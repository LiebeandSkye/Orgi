import { searchTmdb } from "./tmdb"; 
import { fetchMangaDexByCategory, fetchBooks } from "./mediaApi"; 

export async function unifiedSearch(query = "") { 
  const q = (query || "").trim(); 
  if (!q) return []; 

  const [tmdbRes, mangaRes, manhwaRes, booksRes] = await Promise.allSettled([ 
    searchTmdb(q, 1), 
    fetchMangaDexByCategory("manga", 1, q), 
    fetchMangaDexByCategory("manhwa", 1, q), 
    fetchBooks(1, q), 
  ]); 

  const combined = []; 

  if (tmdbRes.status === "fulfilled" && Array.isArray(tmdbRes.value?.results)) { 
    tmdbRes.value.results 
      .filter((item) => item.type !== "PERSON" && item.title) 
      .slice(0, 5) 
      .forEach((item) => { 
        const isSeries = item.type === "SERIES"; 
        combined.push({ 
          id: String(item.id), 
          title: item.title, 
          type: isSeries ? "Series" : "Movie", 
          badgeColor: isSeries 
            ? "bg-purple-950/80 text-purple-300 border-purple-800/40" 
            : "bg-emerald-950/80 text-emerald-300 border-emerald-800/40", 
          subtitle: item.year || (isSeries ? "Series" : "Movie"), 
          score: item.score && item.score !== "—" ? item.score : null, 
          poster: item.poster, 
          route: item.route || (isSeries ? `/series/${item.id}` : `/movie/${item.id}`), 
        }); 
      }); 
  } 

  if (mangaRes.status === "fulfilled" && Array.isArray(mangaRes.value)) { 
    mangaRes.value.slice(0, 3).forEach((item) => { 
      if (!item.title) return; 
      combined.push({ 
        id: String(item.id), 
        title: item.title, 
        type: "Manga", 
        badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800/40", 
        subtitle: item.author || "Manga", 
        score: item.rating || null, 
        poster: item.cover, 
        route: `/books/manga/${item.id}`, 
      }); 
    }); 
  } 

  if (manhwaRes.status === "fulfilled" && Array.isArray(manhwaRes.value)) { 
    manhwaRes.value.slice(0, 3).forEach((item) => { 
      if (!item.title) return; 
      combined.push({ 
        id: String(item.id), 
        title: item.title, 
        type: "Manhwa", 
        badgeColor: "bg-blue-950/80 text-blue-300 border-blue-800/40", 
        subtitle: item.author || "Manhwa", 
        score: item.rating || null, 
        poster: item.cover, 
        route: `/books/manhwa/${item.id}`, 
      }); 
    }); 
  } 

  if (booksRes.status === "fulfilled" && Array.isArray(booksRes.value)) { 
    booksRes.value.slice(0, 3).forEach((item) => { 
      if (!item.title) return; 
      combined.push({ 
        id: String(item.id), 
        title: item.title, 
        type: "Book", 
        badgeColor: "bg-rose-950/80 text-rose-300 border-rose-800/40", 
        subtitle: item.author || (item.chapters ? `${item.chapters}` : "Book"), 
        score: item.rating || null, 
        poster: item.cover, 
        route: `/books/novels/${item.id}`, 
      }); 
    }); 
  } 

  const queryLower = q.toLowerCase(); 
  return combined.sort((a, b) => { 
    const aExact = a.title.toLowerCase() === queryLower ? 1 : 0; 
    const bExact = b.title.toLowerCase() === queryLower ? 1 : 0; 
    if (aExact !== bExact) return bExact - aExact; 

    const aStarts = a.title.toLowerCase().startsWith(queryLower) ? 1 : 0; 
    const bStarts = b.title.toLowerCase().startsWith(queryLower) ? 1 : 0; 
    return bStarts - aStarts; 
  }); 
} 
