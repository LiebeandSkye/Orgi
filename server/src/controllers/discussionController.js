import { supabase, supabaseAdmin } from "../services/supabase.js";
import { helperGenerateRandomId } from "../services/functionHelper.js";

function parseCommentMetadata(rev, currentUserId) {
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

export const discussionController = {
  async getSeasonDiscussionCounts(req, res, next) {
    try {
      const { seriesId, seasonNumber } = req.params;
      if (!seriesId || !seasonNumber) {
        return res.status(400).json({ error: { message: "Missing seriesId or seasonNumber" } });
      }

      const prefix = `tv_${seriesId}_s${seasonNumber}_e`;

      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("id, external_id")
        .eq("provider", "tmdb")
        .eq("type", "tv_episode")
        .ilike("external_id", `${prefix}%`);

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        return res.json({ success: true, data: {} });
      }

      const itemIds = items.map((i) => i.id);
      const itemIdToEpisode = {};
      items.forEach((item) => {
        const match = item.external_id.match(/_e(\d+)$/);
        if (match) {
          itemIdToEpisode[item.id] = parseInt(match[1], 10);
        }
      });

      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, item_id, content")
        .in("item_id", itemIds)
        .eq("is_deleted", false)
        .neq("content", "<!--discussion_root-->");

      if (reviewsError) throw reviewsError;

      const counts = {};
      (reviews || []).forEach((r) => {
        const epNum = itemIdToEpisode[r.item_id];
        if (epNum !== undefined) {
          counts[epNum] = (counts[epNum] || 0) + 1;
        }
      });

      res.json({ success: true, data: counts });
    } catch (err) {
      next(err);
    }
  },

  async getEpisodeDiscussion(req, res, next) {
    try {
      const { seriesId, seasonNumber, episodeNumber } = req.params;
      const externalId = `tv_${seriesId}_s${seasonNumber}_e${episodeNumber}`;

      const { data: item } = await supabase
        .from("items")
        .select("id")
        .eq("provider", "tmdb")
        .eq("type", "tv_episode")
        .eq("external_id", externalId)
        .maybeSingle();

      if (!item) {
        return res.json({
          success: true,
          data: {
            comments: [],
            totalCount: 0,
            likedCommentIds: [],
          },
        });
      }

      const { data: rawReviews, error } = await supabase
        .from("reviews")
        .select(`
          id,
          user_id,
          parent_id,
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
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rootNode = (rawReviews || []).find((r) => r.content === "<!--discussion_root-->" && !r.parent_id);
      const rootId = rootNode ? rootNode.id : null;

      const nonRootReviews = (rawReviews || []).filter((r) => r.id !== rootId);
      const allCommentIds = nonRootReviews.map((r) => r.id);

      const likesCountMap = {};
      const userLikedSet = new Set();

      if (allCommentIds.length > 0) {
        const { data: likesData } = await supabase
          .from("review_likes")
          .select("review_id, user_id")
          .in("review_id", allCommentIds);

        (likesData || []).forEach((lk) => {
          likesCountMap[lk.review_id] = (likesCountMap[lk.review_id] || 0) + 1;
          if (req.user?.id && lk.user_id === req.user.id) {
            userLikedSet.add(lk.review_id);
          }
        });
      }

      const nodeMap = {};
      const childrenByParent = {};
      const topLevel = [];

      nonRootReviews.forEach((rev) => {
        const parsed = parseCommentMetadata(rev, req.user?.id);
        const formatted = {
          id: rev.id,
          userId: parsed.userId,
          parentId: rev.parent_id === rootId ? null : rev.parent_id,
          author: parsed.author,
          authorName: parsed.author,
          avatar: parsed.avatar,
          content: parsed.content,
          isAnonymous: parsed.isAnonymous,
          is_edited: rev.is_edited || false,
          time: rev.created_at,
          createdAt: rev.created_at,
          likes: likesCountMap[rev.id] || 0,
          likesCount: likesCountMap[rev.id] || 0,
          isLiked: userLikedSet.has(rev.id),
          replies: [],
          repliesCount: 0,
        };

        nodeMap[rev.id] = formatted;

        if (rev.parent_id && rev.parent_id !== rootId) {
          if (!childrenByParent[rev.parent_id]) childrenByParent[rev.parent_id] = [];
          childrenByParent[rev.parent_id].push(rev.id);
        } else {
          topLevel.push(formatted);
        }
      });

      Object.values(nodeMap).forEach((node) => {
        if (node.parentId && nodeMap[node.parentId]) {
          node.replyToAuthor = nodeMap[node.parentId].author;
        }
      });

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

      function countTotalDescendants(node, currentDepth = 0) {
        if (currentDepth >= 3) return 0;
        const directIds = childrenByParent[node.id] || [];
        return directIds.reduce((acc, cid) => {
          const child = nodeMap[cid];
          return acc + 1 + (child ? countTotalDescendants(child, currentDepth + 1) : 0);
        }, 0);
      }

      const formattedComments = topLevel.map((c) => attachReplies(c, 0));

      res.json({
        success: true,
        data: {
          comments: formattedComments,
          totalCount: nonRootReviews.length,
          likedCommentIds: Array.from(userLikedSet),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async postComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { seriesId, seasonNumber, episodeNumber } = req.params;
      const {
        content,
        parent_id,
        is_anonymous,
        series_title,
        episode_title,
        cover_url,
      } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          error: { message: "Comment content cannot be empty", code: "VALIDATION_ERROR" },
        });
      }

      const externalId = `tv_${seriesId}_s${seasonNumber}_e${episodeNumber}`;

      let normalizedCoverUrl = cover_url || null;
      if (normalizedCoverUrl && typeof normalizedCoverUrl === "string") {
        normalizedCoverUrl = normalizedCoverUrl.trim();
        if (normalizedCoverUrl && !normalizedCoverUrl.startsWith("http")) {
          const cleanPath = normalizedCoverUrl.startsWith("/")
            ? normalizedCoverUrl
            : `/${normalizedCoverUrl}`;
          normalizedCoverUrl = `https://image.tmdb.org/t/p/w780${cleanPath}`;
        }
      }

      let { data: item } = await supabaseAdmin
        .from("items")
        .select("id, cover_url")
        .eq("provider", "tmdb")
        .eq("type", "tv_episode")
        .eq("external_id", externalId)
        .maybeSingle();

      if (!item) {
        const title = `${series_title || "Series"} - S${seasonNumber}E${episodeNumber}${
          episode_title ? `: ${episode_title}` : ""
        }`;

        const { data: newItem, error: itemError } = await supabaseAdmin
          .from("items")
          .insert({
            external_id: externalId,
            provider: "tmdb",
            type: "tv_episode",
            title,
            cover_url: normalizedCoverUrl,
          })
          .select("id, cover_url")
          .single();

        if (itemError) throw itemError;
        item = newItem;
      } else if (normalizedCoverUrl && (!item.cover_url || item.cover_url.startsWith("/"))) {
        await supabaseAdmin
          .from("items")
          .update({ cover_url: normalizedCoverUrl })
          .eq("id", item.id);
        item.cover_url = normalizedCoverUrl;
      }

      let { data: threadRoot } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("item_id", item.id)
        .is("parent_id", null)
        .maybeSingle();

      if (!threadRoot) {
        const { data: newRoot, error: rootError } = await supabaseAdmin
          .from("reviews")
          .insert({
            item_id: item.id,
            user_id: userId,
            parent_id: null,
            content: "<!--discussion_root-->",
          })
          .select("id")
          .single();

        if (rootError && !rootError.message?.includes("duplicate")) {
          throw rootError;
        }

        threadRoot = newRoot;
        if (!threadRoot) {
          const { data: fetchedRoot } = await supabaseAdmin
            .from("reviews")
            .select("id")
            .eq("item_id", item.id)
            .is("parent_id", null)
            .single();
          threadRoot = fetchedRoot;
        }
      }

      let effectiveParentId = threadRoot.id;
      let parentAuthor = null;

      if (parent_id) {
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
          const parsedDirect = parseCommentMetadata(directParent, null);
          parentAuthor = parsedDirect.author;
          effectiveParentId = directParent.id;
        }
      }

      let finalContent = content.trim();
      if (is_anonymous) {
        const anonName = "Unnamed Orgi " + helperGenerateRandomId(4);
        finalContent = `<!--anon:${anonName}-->${finalContent}`;
      }

      const { data: comment, error: commentError } = await supabaseAdmin
        .from("reviews")
        .insert({
          item_id: item.id,
          user_id: userId,
          parent_id: effectiveParentId,
          content: finalContent,
        })
        .select(`
          id,
          user_id,
          parent_id,
          content,
          is_edited,
          created_at,
          users (
            user_name,
            profile_url
          )
        `)
        .single();

      if (commentError) throw commentError;

      let userObj = comment.users;
      if (!userObj?.user_name) {
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("user_name, profile_url")
          .eq("id", userId)
          .maybeSingle();
        userObj = dbUser || {
          user_name:
            req.user?.user_metadata?.user_name ||
            req.user?.user_metadata?.full_name ||
            req.user?.email?.split("@")[0] ||
            "Unnamed Orgi",
          profile_url: req.user?.user_metadata?.avatar_url || "",
        };
      }

      const parsed = parseCommentMetadata({ ...comment, users: userObj }, userId);

      res.json({
        success: true,
        data: {
          id: comment.id,
          userId: parsed.userId,
          parentId: comment.parent_id === threadRoot.id ? null : comment.parent_id,
          author: parsed.author,
          authorName: parsed.author,
          avatar: parsed.avatar,
          content: parsed.content,
          isAnonymous: parsed.isAnonymous,
          is_edited: false,
          time: comment.created_at,
          createdAt: comment.created_at,
          replyToAuthor: parentAuthor,
          likes: 0,
          likesCount: 0,
          isLiked: false,
          replies: [],
          repliesCount: 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async toggleLike(req, res, next) {
    try {
      const userId = req.user.id;
      const reviewId = req.params.id;

      const { data: existingLike } = await supabaseAdmin
        .from("review_likes")
        .select("id")
        .eq("user_id", userId)
        .eq("review_id", reviewId)
        .maybeSingle();

      let isLiked = false;
      if (existingLike) {
        await supabaseAdmin
          .from("review_likes")
          .delete()
          .eq("id", existingLike.id);
        isLiked = false;
      } else {
        await supabaseAdmin
          .from("review_likes")
          .insert({
            user_id: userId,
            review_id: reviewId,
          });
        isLiked = true;
      }

      const { count } = await supabaseAdmin
        .from("review_likes")
        .select("id", { count: "exact", head: true })
        .eq("review_id", reviewId);

      res.json({
        success: true,
        data: {
          isLiked,
          likes: count || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteComment(req, res, next) {
    try {
      const userId = req.user.id;
      const reviewId = req.params.id;

      const { data: comment } = await supabaseAdmin
        .from("reviews")
        .select("id, user_id")
        .eq("id", reviewId)
        .maybeSingle();

      if (!comment) {
        return res.status(404).json({ error: { message: "Comment not found" } });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({ error: { message: "Unauthorized to delete this comment" } });
      }

      await supabaseAdmin
        .from("reviews")
        .update({ is_deleted: true })
        .eq("id", reviewId);

      res.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      next(err);
    }
  },
};
