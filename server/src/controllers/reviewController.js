import { supabase } from "../services/supabase.js"; 
 
export const reviewController = { 
  async getReviews(req, res, next) { 
    try { 
      const { provider, externalId } = req.params; 
      const normProvider = provider === "open_library" ? "openlibrary" : provider; 
 
      const { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .in("provider", [normProvider, provider]) 
        .eq("external_id", String(externalId)) 
        .maybeSingle(); 
 
      if (!item) { 
        return res.json({ 
          success: true, 
          data: { 
            communityAverage: null, 
            communityVotes: 0, 
            reviews: [], 
          } 
        }); 
      } 
 
      const { data: rawReviews, error } = await supabase 
        .from("reviews") 
        .select(` 
          id, 
          user_id, 
          parent_id, 
          score, 
          content, 
          is_edited, 
          created_at, 
          updated_at, 
          users ( 
            id, 
            user_name, 
            profile_url 
          ) 
        `) 
        .eq("item_id", item.id) 
        .eq("is_deleted", false) 
        .order("created_at", { ascending: false }); 
 
      if (error) throw error; 
 
      const topLevel = []; 
      const repliesByParent = {}; 
      let scoreSum = 0; 
      let scoreCount = 0; 
 
      (rawReviews || []).forEach((rev) => { 
        if (rev.parent_id) { 
          if (!repliesByParent[rev.parent_id]) repliesByParent[rev.parent_id] = []; 
          repliesByParent[rev.parent_id].push({ 
            id: rev.id, 
            userId: rev.user_id, 
            author: rev.users?.user_name || "Unnamed Orgi", 
            avatar: rev.users?.profile_url || "", 
            content: rev.content, 
            is_edited: rev.is_edited || false, 
            time: rev.created_at, 
            source: "community", 
          }); 
        } else { 
          if (typeof rev.score === "number" && rev.score > 0) { 
            scoreSum += rev.score; 
            scoreCount += 1; 
          } 
          topLevel.push(rev); 
        } 
      }); 
 
      const reviewIds = topLevel.map((r) => r.id); 
      const likesCountMap = {}; 
      const userLikedSet = new Set(); 
 
      if (reviewIds.length > 0) { 
        const { data: likesData } = await supabase 
          .from("review_likes") 
          .select("review_id, user_id") 
          .in("review_id", reviewIds); 
 
        (likesData || []).forEach((lk) => { 
          likesCountMap[lk.review_id] = (likesCountMap[lk.review_id] || 0) + 1; 
          if (req.user?.id && lk.user_id === req.user.id) { 
            userLikedSet.add(lk.review_id); 
          } 
        }); 
      } 
 
      const formattedReviews = topLevel.map((rev) => ({ 
        id: rev.id, 
        userId: rev.user_id, 
        author: rev.users?.user_name || "Unnamed Orgi", 
        avatar: rev.users?.profile_url || "", 
        score: rev.score, 
        content: rev.content, 
        is_edited: rev.is_edited || false, 
        time: rev.created_at, 
        source: "community", 
        likes: likesCountMap[rev.id] || 0, 
        isLiked: userLikedSet.has(rev.id), 
        repliesCount: (repliesByParent[rev.id] || []).length, 
        replies: repliesByParent[rev.id] || [], 
      })); 
 
      const communityAverage = scoreCount > 0 ? Number((scoreSum / scoreCount).toFixed(1)) : null; 
 
      res.json({ 
        success: true, 
        data: { 
          communityAverage, 
          communityVotes: scoreCount, 
          reviews: formattedReviews, 
        } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async createReview(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { 
        external_id, 
        provider, 
        type, 
        title, 
        cover_url, 
        score, 
        content, 
        parent_id 
      } = req.body; 
 
      if (!external_id || !provider || !type || !title) { 
        return res.status(400).json({ 
          error: { message: "Missing item details", code: "VALIDATION_ERROR" } 
        }); 
      } 
 
      let { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("type", type) 
        .eq("provider", provider) 
        .eq("external_id", String(external_id)) 
        .maybeSingle(); 
 
      if (!item) { 
        const { data: newItem, error: itemError } = await supabase 
          .from("items") 
          .insert({ 
            external_id: String(external_id), 
            provider, 
            type, 
            title, 
            cover_url: cover_url || null, 
          }) 
          .select("id") 
          .single(); 
 
        if (itemError) throw itemError; 
        item = newItem; 
      } 
 
      if (parent_id) { 
        const { data: reply, error: replyError } = await supabase 
          .from("reviews") 
          .insert({ 
            item_id: item.id, 
            user_id: userId, 
            parent_id, 
            content: content || "", 
          }) 
          .select(` 
            id, 
            user_id, 
            parent_id, 
            score, 
            content, 
            is_edited, 
            created_at, 
            users ( 
              user_name, 
              profile_url 
            ) 
          `) 
          .single(); 
 
        if (replyError) throw replyError; 
 
        return res.json({ 
          success: true, 
          data: { 
            id: reply.id, 
            userId: reply.user_id, 
            parentId: reply.parent_id, 
            author: reply.users?.user_name || "Unnamed Orgi", 
            avatar: reply.users?.profile_url || "", 
            content: reply.content, 
            is_edited: reply.is_edited || false, 
            time: reply.created_at, 
            source: "community", 
          } 
        }); 
      } 
 
      const parsedScore = score !== undefined && score !== null ? parseInt(score, 10) : null; 
      if (parsedScore !== null && (parsedScore < 1 || parsedScore > 10)) { 
        return res.status(400).json({ 
          error: { message: "Score must be an integer between 1 and 10", code: "VALIDATION_ERROR" } 
        }); 
      } 
 
      const { data: existingReview } = await supabase 
        .from("reviews") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .is("parent_id", null) 
        .maybeSingle(); 
 
      let query; 
      if (existingReview) { 
        query = supabase 
          .from("reviews") 
          .update({ 
            score: parsedScore, 
            content: content || "", 
            is_edited: true, 
            updated_at: new Date().toISOString(), 
          }) 
          .eq("id", existingReview.id) 
          .select(` 
            id, 
            user_id, 
            score, 
            content, 
            is_edited, 
            created_at, 
            updated_at, 
            users ( 
              user_name, 
              profile_url 
            ) 
          `) 
          .single(); 
      } else { 
        query = supabase 
          .from("reviews") 
          .insert({ 
            user_id: userId, 
            item_id: item.id, 
            score: parsedScore, 
            content: content || "", 
            is_edited: false, 
          }) 
          .select(` 
            id, 
            user_id, 
            score, 
            content, 
            is_edited, 
            created_at, 
            updated_at, 
            users ( 
              user_name, 
              profile_url 
            ) 
          `) 
          .single(); 
      } 
 
      const { data: reviewRecord, error: reviewError } = await query; 
      if (reviewError) throw reviewError; 
 
      res.json({ 
        success: true, 
        data: { 
          id: reviewRecord.id, 
          userId: reviewRecord.user_id, 
          author: reviewRecord.users?.user_name || "Unnamed Orgi", 
          avatar: reviewRecord.users?.profile_url || "", 
          score: reviewRecord.score, 
          content: reviewRecord.content, 
          is_edited: reviewRecord.is_edited || false, 
          time: reviewRecord.created_at, 
          source: "community", 
          likes: 0, 
          isLiked: false, 
          repliesCount: 0, 
          replies: [], 
        } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async deleteReview(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { id } = req.params; 
 
      const { error } = await supabase 
        .from("reviews") 
        .update({ is_deleted: true }) 
        .eq("id", id) 
        .eq("user_id", userId); 
 
      if (error) throw error; 
 
      res.json({ success: true }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async toggleLike(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { id: reviewId } = req.params; 
 
      const { data: existingLike } = await supabase 
        .from("review_likes") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("review_id", reviewId) 
        .maybeSingle(); 
 
      let liked = false; 
      if (existingLike) { 
        const { error: delError } = await supabase 
          .from("review_likes") 
          .delete() 
          .eq("id", existingLike.id); 
        if (delError) throw delError; 
        liked = false; 
      } else { 
        const { error: insError } = await supabase 
          .from("review_likes") 
          .insert({ 
            user_id: userId, 
            review_id: reviewId, 
          }); 
        if (insError) throw insError; 
        liked = true; 
      } 
 
      const { count } = await supabase 
        .from("review_likes") 
        .select("*", { count: "exact", head: true }) 
        .eq("review_id", reviewId); 
 
      res.json({ 
        success: true, 
        data: { 
          liked, 
          likesCount: count || 0, 
        } 
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async getMyReviews(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { data, error } = await supabase 
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
        .order("created_at", { ascending: false }); 
 
      if (error) throw error; 
 
      res.json({ success: true, data: data || [] }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
 
  async getMyLikes(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { data, error } = await supabase 
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
        .order("created_at", { ascending: false }); 
 
      if (error) throw error; 
 
      const formatted = (data || []) 
        .filter((item) => item.reviews && !item.reviews.is_deleted) 
        .map((item) => ({ 
          likeId: item.id, 
          likedAt: item.created_at, 
          review: item.reviews, 
        })); 
 
      res.json({ success: true, data: formatted }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
