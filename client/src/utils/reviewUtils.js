/**
 * Normalizes author name and avatar from reviews or comments across all data sources:
 * - Flat string: { author: "alice", avatar: "https://..." }
 * - Nested object: { author: { name: "alice", avatarUrl: "https://..." } }
 * - Direct properties: { author_name: "alice", author_avatar: "https://..." }
 * - Supabase user join: { users: { user_name: "alice", profile_url: "https://..." } }
 * - Supabase auth user: { user_metadata: { user_name: "alice", avatar_url: "https://..." } }
 */
export function getReviewAuthor(item, fallbackName = "Anonymous") {
  if (!item) {
    return { name: fallbackName, avatar: undefined };
  }

  const rawAuthor = item.author;
  const isAuthorString = typeof rawAuthor === "string" && rawAuthor.trim().length > 0;
  const isAuthorObj = typeof rawAuthor === "object" && rawAuthor !== null;

  const name =
    (isAuthorString ? rawAuthor.trim() : null) ||
    (isAuthorObj ? (rawAuthor.name || rawAuthor.username || rawAuthor.user_name) : null) ||
    item.authorName ||
    item.author_name ||
    item.username ||
    item.user_name ||
    item.users?.user_name ||
    item.user?.user_name ||
    item.user_metadata?.user_name ||
    item.user_metadata?.full_name ||
    item.user_metadata?.name ||
    fallbackName;

  const avatar =
    (isAuthorObj ? (rawAuthor.avatarUrl || rawAuthor.avatar || rawAuthor.profile_url) : null) ||
    item.avatar ||
    item.avatarUrl ||
    item.authorAvatar ||
    item.author_avatar ||
    item.profile_url ||
    item.users?.profile_url ||
    item.user?.profile_url ||
    item.user_metadata?.avatar_url ||
    item.user_metadata?.picture ||
    undefined;

  return {
    name: name || fallbackName,
    avatar: avatar && typeof avatar === "string" && avatar.trim().length > 0 ? avatar.trim() : undefined,
  };
}
