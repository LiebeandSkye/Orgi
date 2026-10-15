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

      const formattedReviews = (recentReviews || []).map(cleanContentAndAuthor); 

      const formattedLikes = (rawLikes || []) 
        .filter((l) => l.reviews && !l.reviews.is_deleted) 
        .map((l) => ({ 
          likeId: l.id, 
          likedAt: l.created_at, 
          review: cleanContentAndAuthor(l.reviews), 
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
          recentReports: recentReports || [], 
        } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
