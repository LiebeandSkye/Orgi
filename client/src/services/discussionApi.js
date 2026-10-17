import api from "./api.js";

/**
 * Fetch comment counts for all episodes in a given season of a TV series.
 * @param {string|number} seriesId
 * @param {string|number} seasonNumber
 * @returns {Promise<Record<number, number>>} Map of episodeNumber -> commentCount
 */
export async function getSeasonDiscussionCounts(seriesId, seasonNumber) {
  if (!seriesId || !seasonNumber) return {};

  try {
    const res = await api.get(
      `/discussions/tv/${seriesId}/season/${seasonNumber}/counts`
    );
    if (res?.success && res.data) {
      return res.data;
    }
    return {};
  } catch (err) {
    console.error("Failed to load discussion counts:", err);
    return {};
  }
}

/**
 * Fetch the discussion thread (comments, replies, likes) for a specific episode.
 * @param {string|number} seriesId
 * @param {string|number} seasonNumber
 * @param {string|number} episodeNumber
 * @returns {Promise<{ comments: Array<any>, totalCount: number, likedCommentIds: Array<string> }>}
 */
export async function getEpisodeDiscussion(seriesId, seasonNumber, episodeNumber) {
  if (!seriesId || !seasonNumber || !episodeNumber) {
    return { comments: [], totalCount: 0, likedCommentIds: [] };
  }

  try {
    const res = await api.get(
      `/discussions/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`
    );
    if (res?.success && res.data) {
      return {
        comments: Array.isArray(res.data.comments) ? res.data.comments : [],
        totalCount: typeof res.data.totalCount === "number" ? res.data.totalCount : 0,
        likedCommentIds: Array.isArray(res.data.likedCommentIds)
          ? res.data.likedCommentIds
          : [],
      };
    }
    return { comments: [], totalCount: 0, likedCommentIds: [] };
  } catch (err) {
    console.error("Failed to load episode discussion:", err);
    throw err;
  }
}

/**
 * Post a new top-level comment or a reply in an episode discussion.
 * @param {object} params
 * @returns {Promise<{ success: boolean, data: any }>}
 */
export async function postEpisodeComment({
  seriesId,
  seasonNumber,
  episodeNumber,
  content,
  parentId = null,
  isAnonymous = false,
  seriesTitle = "",
  episodeTitle = "",
  coverUrl = "",
}) {
  if (!content || !content.trim()) {
    throw new Error("Comment cannot be empty.");
  }

  const res = await api.post(
    `/discussions/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/comments`,
    {
      content: content.trim(),
      parent_id: parentId,
      is_anonymous: isAnonymous,
      series_title: seriesTitle,
      episode_title: episodeTitle,
      cover_url: coverUrl,
    }
  );

  return res;
}

/**
 * Toggle like on a comment in an episode discussion.
 * @param {string} commentId
 * @returns {Promise<{ isLiked: boolean, likes: number }>}
 */
export async function toggleCommentLike(commentId) {
  if (!commentId) return { isLiked: false, likes: 0 };

  const res = await api.post(`/discussions/comments/${commentId}/like`);
  if (res?.success && res.data) {
    return res.data;
  }
  return { isLiked: false, likes: 0 };
}

/**
 * Delete a comment created by the current user.
 * @param {string} commentId
 * @returns {Promise<boolean>}
 */
export async function deleteComment(commentId) {
  if (!commentId) return false;

  const res = await api.delete(`/discussions/comments/${commentId}`);
  return !!res?.success;
}
