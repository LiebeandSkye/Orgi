import { supabase } from "../services/supabase.js"; 

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

      const { data, error } = await supabase 
        .from("reports") 
        .insert({ 
          reporter_id: reporterId, 
          target_type, 
          target_id, 
          reason: String(reason).trim(), 
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

      const { data, error } = await supabase 
        .from("reports") 
        .select("*") 
        .eq("reporter_id", reporterId) 
        .order("created_at", { ascending: false }); 

      if (error) throw error; 

      res.json({ success: true, data: data || [] }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async getAllReports(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { data: userRecord } = await supabase 
        .from("users") 
        .select("role") 
        .eq("id", userId) 
        .maybeSingle(); 

      if (!userRecord || !["admin", "moderator"].includes(userRecord.role)) { 
        return res.status(403).json({ 
          error: { message: "Forbidden: Moderator access required", code: "FORBIDDEN" } 
        }); 
      } 

      const { data, error } = await supabase 
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

      res.json({ success: true, data: data || [] }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async updateReportStatus(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { id } = req.params; 
      const { status, moderator_notes } = req.body; 

      const { data: userRecord } = await supabase 
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

      const { data, error } = await supabase 
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

      const { error } = await supabase 
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
