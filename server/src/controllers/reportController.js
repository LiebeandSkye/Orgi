import crypto from "crypto"; 
import { supabase, supabaseAdmin } from "../services/supabase.js"; 

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; 

async function enrichReportsWithTargets(reportsList, client) { 
  if (!reportsList || reportsList.length === 0) return []; 
  const reviewTargetIds = reportsList 
    .filter((r) => r.target_type === "review") 
    .map((r) => r.target_id); 
  
  let reviewTargetsMap = {}; 
  if (reviewTargetIds.length > 0) { 
    const { data: targetReviews } = await client 
      .from("reviews") 
      .select(` 
        id, 
        score, 
        content, 
        created_at, 
        users ( 
          id, 
          user_name, 
          profile_url 
        ), 
        items ( 
          id, 
          external_id, 
          provider, 
          type, 
          title, 
          cover_url 
        ) 
      `) 
      .in("id", reviewTargetIds); 
    
    (targetReviews || []).forEach((tr) => { 
      let content = tr.content || ""; 
      let author = tr.users?.user_name || "Community Member"; 
      let avatar = tr.users?.profile_url || null; 
      const anonMatch = content.match(/^<!--anon:([^>]+)-->/); 
      if (anonMatch) { 
        author = anonMatch[1]; 
        avatar = null; 
        content = content.replace(/^<!--anon:[^>]+-->\s*/, ""); 
      } 
      content = content.replace(/^<!--prov:[^>]+-->\s*/, ""); 
      
      reviewTargetsMap[tr.id] = { 
        content, 
        score: tr.score, 
        authorName: author, 
        authorAvatar: avatar, 
        mediaTitle: tr.items?.title || "Untitled Media", 
        mediaType: tr.items?.type || "MEDIA", 
        mediaCover: tr.items?.cover_url || null, 
        externalId: tr.items?.external_id, 
        provider: tr.items?.provider, 
      }; 
    }); 
  } 
  
  return reportsList.map((rep) => { 
    if (rep.target_type === "review" && reviewTargetsMap[rep.target_id]) { 
      return { 
        ...rep, 
        targetDetails: reviewTargetsMap[rep.target_id], 
      }; 
    } 
    return rep; 
  }); 
} 

export const reportController = { 
  async createReport(req, res, next) { 
    try { 
      const reporterId = req.user.id; 
      const { target_type, target_id, reason } = req.body; 
      
      if (!target_type || !target_id || !reason) { 
        return res.status(400).json({ 
          error: { message: "target_type, target_id, and reason are required", code: "VALIDATION_ERROR" } 
        }); 
      } 
      
      const validTypes = ["item", "review", "user"]; 
      if (!validTypes.includes(target_type)) { 
        return res.status(400).json({ 
          error: { message: "target_type must be item, review, or user", code: "VALIDATION_ERROR" } 
        }); 
      } 
      
      let finalTargetId = String(target_id).trim(); 
      let finalReason = String(reason).trim(); 
      
      if (!UUID_REGEX.test(finalTargetId)) { 
        const hash = crypto.createHash("md5").update(finalTargetId).digest("hex"); 
        finalTargetId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`; 
        if (!finalReason.includes(String(target_id))) { 
          finalReason = `[Reported Target ID: ${target_id}] ${finalReason}`; 
        } 
      } 
      
      const client = supabaseAdmin || supabase; 
      const { data, error } = await client 
        .from("reports") 
        .insert({ 
          reporter_id: reporterId, 
          target_type, 
          target_id: finalTargetId, 
          reason: finalReason, 
          status: "pending", 
        }) 
        .select() 
        .single(); 
      
      if (error) throw error; 
      
      res.json({ success: true, data }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
  
  async getMyReports(req, res, next) { 
    try { 
      const reporterId = req.user.id; 
      const client = supabaseAdmin || supabase; 
      
      const { data, error } = await client 
        .from("reports") 
        .select("*") 
        .eq("reporter_id", reporterId) 
        .order("created_at", { ascending: false }); 
      
      if (error) throw error; 
      
      const enriched = await enrichReportsWithTargets(data || [], client); 
      res.json({ success: true, data: enriched }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
  
  async getAllReports(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const client = supabaseAdmin || supabase; 
      
      const { data: userRecord } = await client 
        .from("users") 
        .select("role") 
        .eq("id", userId) 
        .maybeSingle(); 
      
      if (!userRecord || !["admin", "moderator"].includes(userRecord.role)) { 
        return res.status(403).json({ 
          error: { message: "Forbidden: Moderator access required", code: "FORBIDDEN" } 
        }); 
      } 
      
      const { data, error } = await client 
        .from("reports") 
        .select(` 
          id, 
          reporter_id, 
          target_type, 
          target_id, 
          reason, 
          status, 
          moderator_notes, 
          created_at, 
          resolved_at, 
          users!reporter_id ( 
            id, 
            user_name, 
            profile_url 
          ) 
        `) 
        .order("created_at", { ascending: false }); 
      
      if (error) throw error; 
      
      const enriched = await enrichReportsWithTargets(data || [], client); 
      res.json({ success: true, data: enriched }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
  
  async updateReportStatus(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { id } = req.params; 
      const { status, moderator_notes } = req.body; 
      const client = supabaseAdmin || supabase; 
      
      const { data: userRecord } = await client 
        .from("users") 
        .select("role") 
        .eq("id", userId) 
        .maybeSingle(); 
      
      if (!userRecord || !["admin", "moderator"].includes(userRecord.role)) { 
        return res.status(403).json({ 
          error: { message: "Forbidden: Moderator access required", code: "FORBIDDEN" } 
        }); 
      } 
      
      const validStatuses = ["pending", "in_review", "resolved", "dismissed"]; 
      if (!validStatuses.includes(status)) { 
        return res.status(400).json({ 
          error: { message: "Invalid report status", code: "VALIDATION_ERROR" } 
        }); 
      } 
      
      const isClosed = status === "resolved" || status === "dismissed"; 
      const updatePayload = { 
        status, 
        resolved_by: isClosed ? userId : null, 
        resolved_at: isClosed ? new Date().toISOString() : null, 
      }; 
      
      if (moderator_notes !== undefined) { 
        updatePayload.moderator_notes = moderator_notes; 
      } 
      
      const { data, error } = await client 
        .from("reports") 
        .update(updatePayload) 
        .eq("id", id) 
        .select() 
        .single(); 
      
      if (error) throw error; 
      
      res.json({ success: true, data }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
  
  async deleteReport(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { id } = req.params; 
      const client = supabaseAdmin || supabase; 
      
      const { error } = await client 
        .from("reports") 
        .delete() 
        .eq("id", id) 
        .eq("reporter_id", userId); 
      
      if (error) throw error; 
      
      res.json({ success: true, message: "Report deleted successfully" }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
