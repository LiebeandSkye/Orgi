import crypto from "crypto"; 
import { supabase, supabaseAdmin } from "../services/supabase.js"; 
import { helperGenerateRandomId } from "../services/functionHelper.js"; 

function parseReviewMetadata(rev, currentUserId) { 
  let author = rev.users?.user_name || "Unnamed Orgi"; 
  let avatar = rev.users?.profile_url || ""; 
  let content = rev.content || ""; 
  let isAnonymous = false; 

  const anonMatch = content.match(/^<!--anon:([^>]+)-->/); 
  if (anonMatch) { 
    isAnonymous = true; 
    author = anonMatch[1]; 
    avatar = ""; 
    content = content.replace(/^<!--anon:[^>]+-->\s*/, ""); 
  } 

  content = content.replace(/^<!--prov:[^>]+-->\s*/, ""); 

  const isAuthor = currentUserId && rev.user_id === currentUserId; 
  const safeUserId = isAuthor ? rev.user_id : isAnonymous ? null : rev.user_id; 

  return { 
    author, 
    avatar, 
    content, 
    isAnonymous, 
    userId: safeUserId, 
  }; 
} 

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
            likedProviderIds: [], 
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

      const allReviewIds = (rawReviews || []).map((r) => r.id); 
      const likesCountMap = {}; 
      const userLikedSet = new Set(); 

      if (allReviewIds.length > 0) { 
        const { data: likesData } = await supabase 
          .from("review_likes") 
          .select("review_id, user_id") 
          .in("review_id", allReviewIds); 

        (likesData || []).forEach((lk) => { 
          likesCountMap[lk.review_id] = (likesCountMap[lk.review_id] || 0) + 1; 
          if (req.user?.id && lk.user_id === req.user.id) { 
            userLikedSet.add(lk.review_id); 
          } 
        }); 
      } 

      const likedProviderIds = []; 
      const nodeMap = {}; 
      const childrenByParent = {}; 
      const topLevel = []; 
      let scoreSum = 0; 
      let scoreCount = 0; 

      (rawReviews || []).forEach((rev) => { 
        const provMatch = rev.content?.match(/^<!--prov:([^>]+)-->/); 
        if (provMatch) { 
          if (userLikedSet.has(rev.id)) { 
            likedProviderIds.push(provMatch[1]); 
          } 
          return; 
        } 

        const parsed = parseReviewMetadata(rev, req.user?.id); 
        const formatted = { 
          id: rev.id, 
          userId: parsed.userId, 
          parentId: rev.parent_id, 
          author: parsed.author, 
          avatar: parsed.avatar, 
          score: rev.score, 
          content: parsed.content, 
          isAnonymous: parsed.isAnonymous, 
          is_edited: rev.is_edited || false, 
          time: rev.created_at, 
          source: "community", 
          likes: likesCountMap[rev.id] || 0, 
          isLiked: userLikedSet.has(rev.id), 
          replies: [], 
          repliesCount: 0, 
        }; 

        nodeMap[rev.id] = formatted; 

        if (rev.parent_id) { 
          if (!childrenByParent[rev.parent_id]) childrenByParent[rev.parent_id] = []; 
          childrenByParent[rev.parent_id].push(rev.id); 
        } else { 
          if (typeof rev.score === "number" && rev.score > 0) { 
            scoreSum += rev.score; 
            scoreCount += 1; 
          } 
          topLevel.push(formatted); 
        } 
      }); 

      Object.values(nodeMap).forEach((node) => { 
        if (node.parentId && nodeMap[node.parentId]) { 
          node.replyToAuthor = nodeMap[node.parentId].author; 
        } 
      }); 

      function countTotalDescendants(node, currentDepth = 0) { 
        if (currentDepth >= 3) return 0; 
        const directIds = childrenByParent[node.id] || []; 
        return directIds.reduce((acc, cid) => { 
          const child = nodeMap[cid]; 
          return acc + 1 + (child ? countTotalDescendants(child, currentDepth + 1) : 0); 
        }, 0); 
      } 

      function attachReplies(node, currentDepth = 0) { 
        if (currentDepth >= 3) { 
          node.replies = []; 
          node.repliesCount = 0; 
          return node; 
        } 
        const childIds = childrenByParent[node.id] || []; 
        node.replies = childIds 
          .map((cid) => nodeMap[cid]) 
          .filter(Boolean) 
          .map((child) => attachReplies(child, currentDepth + 1)); 
        node.repliesCount = countTotalDescendants(node, currentDepth); 
        return node; 
      } 

      const formattedReviews = topLevel.map((rev) => attachReplies(rev, 0)); 
      const communityAverage = scoreCount > 0 ? Number((scoreSum / scoreCount).toFixed(1)) : null; 

      res.json({ 
        success: true, 
        data: { 
          communityAverage, 
          communityVotes: scoreCount, 
          reviews: formattedReviews, 
          likedProviderIds, 
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
        parent_id, 
        is_anonymous, 
      } = req.body; 

      if (!external_id || !provider || !type || !title) { 
        return res.status(400).json({ 
          error: { message: "Missing item details", code: "VALIDATION_ERROR" } 
        }); 
      } 

      const normProvider = provider === "open_library" ? "openlibrary" : provider; 

      let { data: item } = await supabaseAdmin 
        .from("items") 
        .select("id") 
        .in("provider", [normProvider, provider]) 
        .eq("external_id", String(external_id)) 
        .maybeSingle(); 

      if (!item) { 
        const { data: newItem, error: itemError } = await supabaseAdmin 
          .from("items") 
          .insert({ 
            external_id: String(external_id), 
            provider: normProvider, 
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
        let depthCount = 1; 
        let parentAuthor = "Member"; 

        const { data: directParent } = await supabaseAdmin 
          .from("reviews") 
          .select(` 
            id, 
            parent_id, 
            content, 
            users ( 
              user_name, 
              profile_url 
            ) 
          `) 
          .eq("id", parent_id) 
          .maybeSingle(); 

        if (directParent) { 
          const parsedDirect = parseReviewMetadata(directParent, null); 
          parentAuthor = parsedDirect.author; 
          let currentParentId = directParent.parent_id; 

          while (currentParentId && depthCount < 10) { 
            depthCount++; 
            const { data: anc } = await supabaseAdmin 
              .from("reviews") 
              .select("parent_id") 
              .eq("id", currentParentId) 
              .maybeSingle(); 
            if (anc && anc.parent_id) { 
              currentParentId = anc.parent_id; 
            } else { 
              break; 
            } 
          } 
        } 

        if (depthCount > 3) { 
          return res.status(400).json({ 
            error: { message: "Maximum reply nesting depth of 3 reached", code: "MAX_DEPTH_REACHED" } 
          }); 
        } 

        let replyContent = content || ""; 
        if (is_anonymous) { 
          const anonName = "Unnamed Orgi " + helperGenerateRandomId(4); 
          replyContent = `<!--anon:${anonName}-->${replyContent}`; 
        } 

        const { data: reply, error: replyError } = await supabaseAdmin 
          .from("reviews") 
          .insert({ 
            item_id: item.id, 
            user_id: userId, 
            parent_id, 
            content: replyContent, 
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

        const parsed = parseReviewMetadata(reply, userId); 

        return res.json({ 
          success: true, 
          data: { 
            id: reply.id, 
            userId: parsed.userId, 
            parentId: reply.parent_id, 
            author: parsed.author, 
            replyToAuthor: parentAuthor, 
            avatar: parsed.avatar, 
            content: parsed.content, 
            isAnonymous: parsed.isAnonymous, 
            is_edited: reply.is_edited || false, 
            time: reply.created_at, 
            source: "community", 
            likes: 0, 
            isLiked: false, 
            repliesCount: 0, 
            replies: [], 
          } 
        }); 
      } 

      const parsedScore = score !== undefined && score !== null ? parseInt(score, 10) : null; 
      if (parsedScore !== null && (parsedScore < 1 || parsedScore > 10)) { 
        return res.status(400).json({ 
          error: { message: "Score must be an integer between 1 and 10", code: "VALIDATION_ERROR" } 
        }); 
      } 

      const { data: existingReview } = await supabaseAdmin 
        .from("reviews") 
        .select("id, content") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .is("parent_id", null) 
        .maybeSingle(); 

      let finalContent = content || ""; 
      if (is_anonymous) { 
        let anonName = "Unnamed Orgi " + helperGenerateRandomId(4); 
        if (existingReview?.content?.startsWith("<!--anon:")) { 
          const prevMatch = existingReview.content.match(/^<!--anon:([^>]+)-->/); 
          if (prevMatch) anonName = prevMatch[1]; 
        } 
        finalContent = `<!--anon:${anonName}-->${finalContent}`; 
      } 

      let query; 
      if (existingReview) { 
        query = supabaseAdmin 
          .from("reviews") 
          .update({ 
            score: parsedScore, 
            content: finalContent, 
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
        query = supabaseAdmin 
          .from("reviews") 
          .insert({ 
            user_id: userId, 
            item_id: item.id, 
            score: parsedScore, 
            content: finalContent, 
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

      const parsed = parseReviewMetadata(reviewRecord, userId); 

      res.json({ 
        success: true, 
        data: { 
          id: reviewRecord.id, 
          userId: parsed.userId, 
          author: parsed.author, 
          avatar: parsed.avatar, 
          score: reviewRecord.score, 
          content: parsed.content, 
          isAnonymous: parsed.isAnonymous, 
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

      const { error } = await supabaseAdmin 
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

      const { data: existingLike } = await supabaseAdmin 
        .from("review_likes") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("review_id", reviewId) 
        .maybeSingle(); 

      let liked = false; 
      if (existingLike) { 
        const { error: delError } = await supabaseAdmin 
          .from("review_likes") 
          .delete() 
          .eq("id", existingLike.id); 
        if (delError) throw delError; 
        liked = false; 
      } else { 
        const { error: insError } = await supabaseAdmin 
          .from("review_likes") 
          .insert({ 
            user_id: userId, 
            review_id: reviewId, 
          }); 
        if (insError) throw insError; 
        liked = true; 
      } 

      const { count } = await supabaseAdmin 
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

  async toggleProviderLike(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { 
        external_id, 
        provider, 
        type, 
        title, 
        cover_url, 
        provider_review_id, 
        author_name, 
        author_avatar, 
        content, 
        score, 
      } = req.body; 

      if (!external_id || !provider || !content) { 
        return res.status(400).json({ 
          error: { message: "Missing required review fields", code: "VALIDATION_ERROR" } 
        }); 
      } 

      const normProvider = provider === "open_library" ? "openlibrary" : provider; 

      let { data: item } = await supabaseAdmin 
        .from("items") 
        .select("id") 
        .in("provider", [normProvider, provider]) 
        .eq("external_id", String(external_id)) 
        .maybeSingle(); 

      if (!item) { 
        const { data: newItem, error: itemError } = await supabaseAdmin 
          .from("items") 
          .insert({ 
            external_id: String(external_id), 
            provider: normProvider, 
            type: type || "MOVIE", 
            title: title || "Untitled Media", 
            cover_url: cover_url || null, 
          }) 
          .select("id") 
          .single(); 

        if (itemError) throw itemError; 
        item = newItem; 
      } 

      const safeAuthor = (author_name && author_name.trim()) ? author_name.trim() : "Provider Reviewer"; 
      const userHash = crypto 
        .createHash("md5") 
        .update(`prov_user:${normProvider}:${provider_review_id || content.slice(0, 50)}`) 
        .digest("hex"); 
      const provUserId = `${userHash.slice(0, 8)}-${userHash.slice(8, 12)}-4${userHash.slice(13, 16)}-a${userHash.slice(17, 20)}-${userHash.slice(20, 32)}`; 

      await supabaseAdmin 
        .from("users") 
        .upsert({ 
          id: provUserId, 
          public_id: `PROV_${userHash.slice(0, 8)}`, 
          user_name: safeAuthor, 
          profile_url: author_avatar || null, 
        }, { onConflict: "id" }); 

      const revHash = crypto 
        .createHash("md5") 
        .update(`prov_rev:${normProvider}:${item.id}:${provider_review_id || content.slice(0, 80)}`) 
        .digest("hex"); 
      const provReviewId = `${revHash.slice(0, 8)}-${revHash.slice(8, 12)}-4${revHash.slice(13, 16)}-a${revHash.slice(17, 20)}-${revHash.slice(20, 32)}`; 

      const parsedScore = score !== undefined && score !== null ? parseInt(score, 10) : null; 
      const validScore = (typeof parsedScore === "number" && !isNaN(parsedScore) && parsedScore >= 1 && parsedScore <= 10) ? parsedScore : null; 
      const provContent = provider_review_id ? `<!--prov:${provider_review_id}-->${content}` : content; 

      const { data: existingRev } = await supabaseAdmin 
        .from("reviews") 
        .select("id") 
        .eq("id", provReviewId) 
        .maybeSingle(); 

      if (!existingRev) { 
        await supabaseAdmin 
          .from("reviews") 
          .insert({ 
            id: provReviewId, 
            item_id: item.id, 
            user_id: provUserId, 
            score: validScore, 
            content: provContent, 
            is_edited: false, 
          }); 
      } 

      const { data: existingLike } = await supabaseAdmin 
        .from("review_likes") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("review_id", provReviewId) 
        .maybeSingle(); 

      let liked = false; 
      if (existingLike) { 
        const { error: delError } = await supabaseAdmin 
          .from("review_likes") 
          .delete() 
          .eq("id", existingLike.id); 
        if (delError) throw delError; 
        liked = false; 
      } else { 
        const { error: insError } = await supabaseAdmin 
          .from("review_likes") 
          .insert({ 
            user_id: userId, 
            review_id: provReviewId, 
          }); 
        if (insError) throw insError; 
        liked = true; 
      } 

      const { count } = await supabaseAdmin 
        .from("review_likes") 
        .select("*", { count: "exact", head: true }) 
        .eq("review_id", provReviewId); 

      res.json({ 
        success: true, 
        data: { 
          liked, 
          likesCount: count || 0, 
          reviewId: provReviewId, 
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

      const formatted = (data || []).map((rev) => { 
        const parsed = parseReviewMetadata(rev, userId); 
        return { 
          ...rev, 
          content: parsed.content, 
          isAnonymous: parsed.isAnonymous, 
        }; 
      }); 

      res.json({ success: true, data: formatted }); 
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
        .map((item) => { 
          const parsed = parseReviewMetadata(item.reviews, userId); 
          return { 
            likeId: item.id, 
            likedAt: item.created_at, 
            review: { 
              ...item.reviews, 
              content: parsed.content, 
              users: { 
                ...item.reviews.users, 
                user_name: parsed.author, 
                profile_url: parsed.avatar, 
              }, 
            }, 
          }; 
        }); 

      res.json({ success: true, data: formatted }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
