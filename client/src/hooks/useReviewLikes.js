import { useState, useCallback, useEffect } from "react"; 
import api from "../services/api"; 
import { getReviewAuthor } from "../utils/reviewUtils"; 

const STORAGE_KEY = "orgi_review_likes"; 

export function useReviewLikes() { 
  const [likes, setLikes] = useState(() => { 
    try { 
      const stored = localStorage.getItem(STORAGE_KEY); 
      return stored ? JSON.parse(stored) : {}; 
    } catch { 
      return {}; 
    } 
  }); 

  useEffect(() => { 
    const sessionToken = localStorage.getItem("orgi_session"); 
    if (!sessionToken) return; 

    let mounted = true; 
    api.get("/reviews/user/likes") 
      .then((res) => { 
        if (!mounted || !res?.success || !Array.isArray(res.data)) return; 
        setLikes((prev) => { 
          const next = { ...prev }; 
          res.data.forEach((item) => { 
            const rev = item.review; 
            if (!rev) return; 
            if (rev.id) next[rev.id] = true; 
            if (rev.items?.external_id) { 
              const orgiId = `orgi:${rev.items.id}:${rev.id}`; 
              next[orgiId] = true; 
            } 
          }); 
          return next; 
        }); 
      }) 
      .catch(() => {}); 

    return () => { 
      mounted = false; 
    }; 
  }, []); 

  const isLiked = useCallback( 
    (id) => { 
      if (!id) return false; 
      return Boolean(likes[id]); 
    }, 
    [likes] 
  ); 

  const toggleLike = useCallback(async (itemOrId) => { 
    const isObject = typeof itemOrId === "object" && itemOrId !== null; 
    const id = isObject ? itemOrId.id : itemOrId; 
    if (!id) return false; 

    setLikes((prev) => { 
      const next = { ...prev }; 
      if (next[id]) { 
        delete next[id]; 
      } else { 
        next[id] = true; 
      } 
      try { 
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); 
      } catch {} 
      return next; 
    }); 

    const sessionToken = localStorage.getItem("orgi_session"); 
    if (!sessionToken) return; 

    try { 
      if (isObject && itemOrId.source === "orgi") { 
        const parts = String(id).split(":"); 
        const reviewUuid = parts[2] || parts[1] || id; 
        await api.post(`/reviews/${reviewUuid}/like`); 
      } else if (isObject) { 
        await api.post("/reviews/provider/like", { 
          external_id: String(itemOrId.titleId || itemOrId.external_id || ""), 
          provider: itemOrId.source || "tmdb", 
          type: itemOrId.category || "movie", 
          title: itemOrId.title || "Untitled", 
          cover_url: itemOrId.posterUrl || itemOrId.backdropUrl || null, 
          provider_review_id: String(itemOrId.id || ""), 
          author_name: getReviewAuthor(itemOrId, "Reviewer").name, 
          author_avatar: getReviewAuthor(itemOrId, "Reviewer").avatar || null, 
          content: itemOrId.rawContent || itemOrId.excerpt || itemOrId.content || "", 
          score: itemOrId.rating || itemOrId.score || null, 
        }); 
      } else { 
        await api.post(`/reviews/${id}/like`); 
      } 
    } catch (err) { 
      console.warn("Failed to sync like with server:", err); 
    } 
  }, [likes]); 

  return { 
    isLiked, 
    toggleLike, 
  }; 
} 
