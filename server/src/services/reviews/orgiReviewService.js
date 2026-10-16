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
      if (rev.content?.startsWith("<!--prov:")) continue; 
      
      const item = rev.items; 
      if (!item) continue; 
      
      let contentText = rev.content || ""; 
      let authorName = rev.users?.user_name || "Community Member"; 
      let avatarUrl = rev.users?.profile_url || undefined; 
      const anonMatch = contentText.match(/^<!--anon:([^>]+)-->/); 
      if (anonMatch) { 
        authorName = anonMatch[1]; 
        avatarUrl = undefined; 
        contentText = contentText.replace(/^<!--anon:[^>]+-->\s*/, ""); 
      } 
      contentText = contentText.replace(/^<!--prov:[^>]+-->\s*/, ""); 
      
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
      
      const isBookOrManga = ["manga", "manhwa", "manhua", "book", "novel"].includes(mappedCategory);

      cards.push({ 
        id: `orgi:${item.id}:${rev.id}`, 
        source: "orgi", 
        category: mappedCategory, 
        titleId: String(item.external_id), 
        title: item.title, 
        mediaLabel, 
        posterUrl: item.cover_url, 
        backdropUrl: isBookOrManga ? undefined : item.cover_url, 
        genres: [], 
        rating: typeof rev.score === "number" && rev.score > 0 ? rev.score : undefined, 
        excerpt: createExcerpt(contentText, 260), 
        excerptKind: "review", 
        author: { 
          name: authorName, 
          avatarUrl: avatarUrl, 
        }, 
        likes: likesMap[rev.id] || 0, 
        comments: repliesMap[rev.id] || 0, 
        commentsCount: repliesMap[rev.id] || 0, 
        createdAt: rev.created_at, 
        detailHref: `/reviews/orgi/${item.external_id}/${rev.id}`, 
        mediaRoute, 
        rawContent: contentText, 
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId);
    let query = supabase 
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
      `); 

    if (isUuid) {
      query = query.eq("id", reviewId);
    } else {
      const { data: itemData } = await supabase
        .from("items")
        .select("id")
        .eq("external_id", String(titleId))
        .maybeSingle();
      if (!itemData) return null;
      query = query.eq("item_id", itemData.id).is("parent_id", null).order("created_at", { ascending: false }).limit(1);
    }

    const { data: rev, error } = await query.maybeSingle(); 
    
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
    
    const [{ count: likesCount }, { count: repliesCount }, { data: rawChildReviews }] = await Promise.all([ 
      supabase 
        .from("review_likes") 
        .select("*", { count: "exact", head: true }) 
        .eq("review_id", rev.id), 
      supabase 
        .from("reviews") 
        .select("*", { count: "exact", head: true }) 
        .eq("parent_id", rev.id) 
        .eq("is_deleted", false), 
      supabase 
        .from("reviews") 
        .select(` 
          id, 
          user_id, 
          parent_id, 
          score, 
          content, 
          is_edited, 
          created_at, 
          users ( 
            id, 
            user_name, 
            profile_url 
          ) 
        `) 
        .eq("item_id", rev.item_id) 
        .eq("is_deleted", false) 
        .order("created_at", { ascending: true }), 
    ]); 
    
    const nodeMap = {}; 
    const childrenByParent = {}; 
    
    (rawChildReviews || []).forEach((child) => { 
      let cAuthor = child.users?.user_name || "Community Member"; 
      let cAvatar = child.users?.profile_url || undefined; 
      let cContent = child.content || ""; 
      let cIsAnon = false; 
      const cAnonMatch = cContent.match(/^<!--anon:([^>]+)-->/); 
      if (cAnonMatch) { 
        cIsAnon = true; 
        cAuthor = cAnonMatch[1]; 
        cAvatar = undefined; 
        cContent = cContent.replace(/^<!--anon:[^>]+-->\s*/, ""); 
      } 
      cContent = cContent.replace(/^<!--prov:[^>]+-->\s*/, ""); 
      
      const formattedChild = { 
        id: child.id, 
        userId: child.user_id, 
        parentId: child.parent_id, 
        author: cAuthor, 
        authorName: cAuthor, 
        author_name: cAuthor, 
        avatar: cAvatar, 
        avatarUrl: cAvatar, 
        authorAvatar: cAvatar, 
        author_avatar: cAvatar, 
        score: child.score, 
        content: cContent, 
        isAnonymous: cIsAnon, 
        is_edited: child.is_edited || false, 
        time: child.created_at, 
        source: "community", 
        likes: 0, 
        replies: [], 
        repliesCount: 0, 
      }; 
      
      nodeMap[child.id] = formattedChild; 
      if (child.parent_id) { 
        if (!childrenByParent[child.parent_id]) childrenByParent[child.parent_id] = []; 
        childrenByParent[child.parent_id].push(child.id); 
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
        .map((ch) => attachReplies(ch, currentDepth + 1)); 
      node.repliesCount = node.replies.length; 
      return node; 
    } 
    
    const directChildrenIds = childrenByParent[rev.id] || []; 
    const repliesTree = directChildrenIds 
      .map((cid) => nodeMap[cid]) 
      .filter(Boolean) 
      .map((ch) => attachReplies(ch, 1)); 
    
    let detailContent = rev.content || ""; 
    let detailAuthor = rev.users?.user_name || "Community Member"; 
    let detailAvatar = rev.users?.profile_url || undefined; 
    const detailAnonMatch = detailContent.match(/^<!--anon:([^>]+)-->/); 
    if (detailAnonMatch) { 
      detailAuthor = detailAnonMatch[1]; 
      detailAvatar = undefined; 
      detailContent = detailContent.replace(/^<!--anon:[^>]+-->\s*/, ""); 
    } 
    detailContent = detailContent.replace(/^<!--prov:[^>]+-->\s*/, ""); 
    
    const isBookOrManga = ["manga", "manhwa", "manhua", "book", "novel"].includes(mappedCategory);

    return { 
      id: `orgi:${item.id}:${rev.id}`, 
      source: "orgi", 
      category: mappedCategory, 
      titleId: String(item.external_id), 
      title: item.title, 
      mediaLabel, 
      posterUrl: item.cover_url, 
      backdropUrl: isBookOrManga ? undefined : item.cover_url, 
      genres: [], 
      rating: typeof rev.score === "number" && rev.score > 0 ? rev.score : undefined, 
      excerpt: createExcerpt(detailContent, 260), 
      content: detailContent, 
      author: { 
        name: detailAuthor, 
        avatarUrl: detailAvatar, 
      }, 
      authorName: detailAuthor, 
      author_name: detailAuthor, 
      avatar: detailAvatar, 
      avatarUrl: detailAvatar, 
      authorAvatar: detailAvatar, 
      author_avatar: detailAvatar, 
      likes: likesCount || 0, 
      comments: repliesCount || 0, 
      commentsCount: repliesCount || 0, 
      createdAt: rev.created_at, 
      detailHref: `/reviews/orgi/${item.external_id}/${rev.id}`, 
      mediaRoute, 
      replies: repliesTree, 
    }; 
  } catch (err) { 
    console.warn("Failed to get Orgi review detail:", err); 
    return null; 
  } 
} 
