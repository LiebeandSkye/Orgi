import { supabase } from "../supabase.js"; 
import { createExcerpt } from "./excerpt.js"; 

export async function getOrgiReviewCards({ category = "all", limit = 20 } = {}) { 
  if (!supabase) return []; 

  try { 
    const query = supabase 
      .from("reviews") 
      .select(` 
        id, 
        user_id, 
        item_id, 
        score, 
        content, 
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
      `) 
      .is("parent_id", null) 
      .eq("is_deleted", false) 
      .order("created_at", { ascending: false }) 
      .limit(limit); 

    const { data: rawReviews, error } = await query; 
    if (error || !rawReviews) return []; 

    const reviewIds = rawReviews.map((r) => r.id); 
    const likesMap = {}; 
    const repliesMap = {}; 

    if (reviewIds.length > 0) { 
      const [{ data: likesData }, { data: repliesData }] = await Promise.all([ 
        supabase 
          .from("review_likes") 
          .select("review_id") 
          .in("review_id", reviewIds), 
        supabase 
          .from("reviews") 
          .select("parent_id") 
          .in("parent_id", reviewIds) 
          .eq("is_deleted", false), 
      ]); 

      (likesData || []).forEach((l) => { 
        likesMap[l.review_id] = (likesMap[l.review_id] || 0) + 1; 
      }); 

      (repliesData || []).forEach((r) => { 
        repliesMap[r.parent_id] = (repliesMap[r.parent_id] || 0) + 1; 
      }); 
    } 

    const cards = []; 
    for (const rev of rawReviews) { 
      const item = rev.items; 
      if (!item) continue; 

      const itemType = (item.type || "MOVIE").toUpperCase(); 
      let mappedCategory = "movie"; 
      let mediaLabel = "Movie"; 
      let mediaRoute = `/movie/${item.external_id}`; 

      if (itemType === "SERIES" || itemType === "TV") { 
        mappedCategory = "series"; 
        mediaLabel = "Series"; 
        mediaRoute = `/series/${item.external_id}`; 
      } else if (itemType === "ANIME") { 
        mappedCategory = "anime"; 
        mediaLabel = "Anime"; 
        mediaRoute = `/anime/${item.external_id}`; 
      } else if (itemType === "MANGA" || itemType === "MANHWA" || itemType === "MANHUA") { 
        mappedCategory = itemType.toLowerCase(); 
        mediaLabel = itemType.charAt(0) + itemType.slice(1).toLowerCase(); 
        mediaRoute = `/books/${mappedCategory}/${item.external_id}`; 
      } else if (itemType === "BOOK" || itemType === "NOVEL") { 
        mappedCategory = "book"; 
        mediaLabel = "Book"; 
        mediaRoute = `/books/novels/${item.external_id}`; 
      } 

      if (category !== "all") { 
        if (category === "manga" && mappedCategory !== "manga" && mappedCategory !== "manhwa" && mappedCategory !== "manhua") continue; 
        else if (category === "book" && mappedCategory !== "book" && mappedCategory !== "novel") continue; 
        else if (category !== mappedCategory && !(category === "series" && mappedCategory === "series") && !(category === "movie" && mappedCategory === "movie") && !(category === "anime" && mappedCategory === "anime")) continue; 
      } 

      cards.push({ 
        id: `orgi:${item.id}:${rev.id}`, 
        source: "orgi", 
        category: mappedCategory, 
        titleId: String(item.external_id), 
        title: item.title, 
        mediaLabel, 
        posterUrl: item.cover_url, 
        backdropUrl: item.cover_url, 
        genres: [], 
        rating: typeof rev.score === "number" && rev.score > 0 ? rev.score : undefined, 
        excerpt: createExcerpt(rev.content || "", 260), 
        excerptKind: "review", 
        author: { 
          name: rev.users?.user_name || "Community Member", 
          avatarUrl: rev.users?.profile_url || undefined, 
        }, 
        likes: likesMap[rev.id] || 0, 
        commentsCount: repliesMap[rev.id] || 0, 
        createdAt: rev.created_at, 
        detailHref: `/reviews/orgi/${item.external_id}/${rev.id}`, 
        mediaRoute, 
        rawContent: rev.content, 
      }); 
    } 

    return cards; 
  } catch (err) { 
    console.warn("Failed to fetch Orgi review cards:", err); 
    return []; 
  } 
} 

export async function getOrgiReviewDetail(titleId, reviewId) { 
  if (!supabase) return null; 

  try { 
    const { data: rev, error } = await supabase 
      .from("reviews") 
      .select(` 
        id, 
        user_id, 
        item_id, 
        score, 
        content, 
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
      `) 
      .eq("id", reviewId) 
      .maybeSingle(); 

    if (error || !rev || !rev.items) return null; 

    const item = rev.items; 
    const itemType = (item.type || "MOVIE").toUpperCase(); 
    let mappedCategory = "movie"; 
    let mediaLabel = "Movie"; 
    let mediaRoute = `/movie/${item.external_id}`; 

    if (itemType === "SERIES" || itemType === "TV") { 
      mappedCategory = "series"; 
      mediaLabel = "Series"; 
      mediaRoute = `/series/${item.external_id}`; 
    } else if (itemType === "ANIME") { 
      mappedCategory = "anime"; 
      mediaLabel = "Anime"; 
      mediaRoute = `/anime/${item.external_id}`; 
    } else if (itemType === "MANGA" || itemType === "MANHWA" || itemType === "MANHUA") { 
      mappedCategory = itemType.toLowerCase(); 
      mediaLabel = itemType.charAt(0) + itemType.slice(1).toLowerCase(); 
      mediaRoute = `/books/${mappedCategory}/${item.external_id}`; 
    } else if (itemType === "BOOK" || itemType === "NOVEL") { 
      mappedCategory = "book"; 
      mediaLabel = "Book"; 
      mediaRoute = `/books/novels/${item.external_id}`; 
    } 

    const [{ count: likesCount }, { count: repliesCount }] = await Promise.all([ 
      supabase 
        .from("review_likes") 
        .select("*", { count: "exact", head: true }) 
        .eq("review_id", rev.id), 
      supabase 
        .from("reviews") 
        .select("*", { count: "exact", head: true }) 
        .eq("parent_id", rev.id) 
        .eq("is_deleted", false), 
    ]); 

    return { 
      id: `orgi:${item.id}:${rev.id}`, 
      source: "orgi", 
      category: mappedCategory, 
      titleId: String(item.external_id), 
      title: item.title, 
      mediaLabel, 
      posterUrl: item.cover_url, 
      backdropUrl: item.cover_url, 
      genres: [], 
      rating: typeof rev.score === "number" && rev.score > 0 ? rev.score : undefined, 
      excerpt: createExcerpt(rev.content || "", 260), 
      content: rev.content, 
      author: { 
        name: rev.users?.user_name || "Community Member", 
        avatarUrl: rev.users?.profile_url || undefined, 
      }, 
      likes: likesCount || 0, 
      commentsCount: repliesCount || 0, 
      createdAt: rev.created_at, 
      detailHref: `/reviews/orgi/${item.external_id}/${rev.id}`, 
      mediaRoute, 
    }; 
  } catch (err) { 
    console.warn("Failed to get Orgi review detail:", err); 
    return null; 
  } 
} 
