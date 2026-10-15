import { supabase } from "../services/supabase.js"; 

export const dashboardController = { 
  async getSummary(req, res, next) { 
    try { 
      const userId = req.user.id; 
      
      const { data: userRecord } = await supabase 
        .from("users") 
        .select("role, user_name, profile_url") 
        .eq("id", userId) 
        .maybeSingle(); 
      
      const { count: reviewCount } = await supabase 
        .from("reviews") 
        .select("*", { count: "exact", head: true }) 
        .eq("user_id", userId) 
        .is("parent_id", null) 
        .eq("is_deleted", false); 
      
      const { count: likeCount } = await supabase 
        .from("review_likes") 
        .select("*", { count: "exact", head: true }) 
        .eq("user_id", userId); 
      
      const { count: reportCount } = await supabase 
        .from("reports") 
        .select("*", { count: "exact", head: true }) 
        .eq("reporter_id", userId); 
      
      const { data: recentReviews } = await supabase 
        .from("reviews") 
        .select(` 
          id, 
          score, 
          content, 
          is_edited, 
          created_at, 
          updated_at, 
          items ( 
            id, 
            external_id, 
            provider, 
            type, 
            title, 
            cover_url 
          ) 
        `) 
        .eq("user_id", userId) 
        .is("parent_id", null) 
        .eq("is_deleted", false) 
        .order("created_at", { ascending: false }) 
        .limit(10); 
      
      const { data: rawLikes } = await supabase 
        .from("review_likes") 
        .select(` 
          id, 
          created_at, 
          reviews ( 
            id, 
            score, 
            content, 
            is_edited, 
            created_at, 
            items ( 
              id, 
              external_id, 
              provider, 
              type, 
              title, 
              cover_url 
            ), 
            users ( 
              id, 
              user_name, 
              profile_url 
            ) 
          ) 
        `) 
        .eq("user_id", userId) 
        .order("created_at", { ascending: false }) 
        .limit(10); 
      
      const { data: recentReports } = await supabase 
        .from("reports") 
        .select("*") 
        .eq("reporter_id", userId) 
        .order("created_at", { ascending: false }) 
        .limit(10); 
      
      function cleanContentAndAuthor(rev) { 
        if (!rev) return rev; 
        let content = rev.content || ""; 
        let author = rev.users?.user_name || "Unnamed Orgi"; 
        let avatar = rev.users?.profile_url || ""; 
        const anonMatch = content.match(/^<!--anon:([^>]+)-->/); 
        if (anonMatch) { 
          author = anonMatch[1]; 
          avatar = ""; 
          content = content.replace(/^<!--anon:[^>]+-->\s*/, ""); 
        } 
        content = content.replace(/^<!--prov:[^>]+-->\s*/, ""); 
        return { 
          ...rev, 
          content, 
          users: rev.users ? { 
            ...rev.users, 
            user_name: author, 
            profile_url: avatar, 
          } : null, 
        }; 
      } 
      
      const allParentReviewIds = [ 
        ...(recentReviews || []).map((r) => r.id), 
        ...(rawLikes || []).map((l) => l.reviews?.id).filter(Boolean), 
      ]; 
      
      let repliesCountMap = {}; 
      if (allParentReviewIds.length > 0) { 
        const { data: childReviews } = await supabase 
          .from("reviews") 
          .select("id, parent_id") 
          .in("parent_id", allParentReviewIds) 
          .eq("is_deleted", false); 
        
        (childReviews || []).forEach((cr) => { 
          repliesCountMap[cr.parent_id] = (repliesCountMap[cr.parent_id] || 0) + 1; 
        }); 
      } 
      
      const reviewTargetIds = (recentReports || []) 
        .filter((r) => r.target_type === "review") 
        .map((r) => r.target_id); 
      
      let reviewTargetsMap = {}; 
      if (reviewTargetIds.length > 0) { 
        const { data: targetReviews } = await supabase 
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
          reviewTargetsMap[tr.id] = cleanContentAndAuthor(tr); 
        }); 
      } 
      
      const formattedReports = (recentReports || []).map((rep) => { 
        if (rep.target_type === "review" && reviewTargetsMap[rep.target_id]) { 
          const tr = reviewTargetsMap[rep.target_id]; 
          return { 
            ...rep, 
            targetDetails: { 
              content: tr.content, 
              score: tr.score, 
              authorName: tr.users?.user_name || "Community Member", 
              authorAvatar: tr.users?.profile_url || null, 
              mediaTitle: tr.items?.title || "Untitled Media", 
              mediaType: tr.items?.type || "MEDIA", 
              mediaCover: tr.items?.cover_url || null, 
              externalId: tr.items?.external_id, 
              provider: tr.items?.provider, 
            }, 
          }; 
        } 
        return rep; 
      }); 
      
      const formattedReviews = (recentReviews || []).map((r) => ({ 
        ...cleanContentAndAuthor(r), 
        repliesCount: repliesCountMap[r.id] || 0, 
      })); 
      
      const formattedLikes = (rawLikes || []) 
        .filter((l) => l.reviews && !l.reviews.is_deleted) 
        .map((l) => ({ 
          likeId: l.id, 
          likedAt: l.created_at, 
          review: { 
            ...cleanContentAndAuthor(l.reviews), 
            repliesCount: repliesCountMap[l.reviews.id] || 0, 
          }, 
        })); 
      
      res.json({ 
        success: true, 
        data: { 
          stats: { 
            reviewCount: reviewCount || 0, 
            likeCount: likeCount || 0, 
            reportCount: reportCount || 0, 
          }, 
          userRole: userRecord?.role || "user", 
          recentReviews: formattedReviews, 
          recentLikes: formattedLikes, 
          recentReports: formattedReports, 
        } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
