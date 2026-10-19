import { getTmdbImageUrl } from "../../../services/tmdb"; 
import { MANGADEX_GENRE_TAGS, fetchMediaVerdict } from "../../../services/mediaApi"; 

const DIRECT_API_KEY = "e2a7d3e1dd95c5e71b164f3334a3628d"; 
const TMDB_DIRECT_URL = "https://api.themoviedb.org/3"; 
const MANGADEX_BASE = "https://api.mangadex.org"; 
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers"; 

const VIBE_GENRE_MAP = { 
  Relaxed: ["16", "35", "10751"], 
  Exciting: ["28", "12", "878"], 
  "Thought-provoking": ["9648", "878", "18"], 
  Emotional: ["18", "10749"], 
  Funny: ["35"], 
  "Dark & Intense": ["53", "80", "27"], 
  "Feel-good": ["35", "16", "10402"], 
  Suspenseful: ["53", "9648"], 
  Whimsical: ["14", "16", "10751"], 
  "Mind-bending": ["878", "9648"], 
  Romantic: ["10749"], 
  Cozy: ["35", "10751", "16"], 
}; 

const VIBE_TV_GENRE_MAP = { 
  Relaxed: ["16", "35", "10762"], 
  Exciting: ["10759", "10765"], 
  "Thought-provoking": ["9648", "10765", "18"], 
  Emotional: ["18", "10766"], 
  Funny: ["35"], 
  "Dark & Intense": ["80", "18", "9648"], 
  "Feel-good": ["35", "16", "10762"], 
  Suspenseful: ["9648", "80"], 
  Whimsical: ["10765", "16", "10762"], 
  "Mind-bending": ["10765", "9648"], 
  Romantic: ["18", "10766"], 
  Cozy: ["35", "10762", "16"], 
}; 

const VIBE_MANGADEX_MAP = { 
  Relaxed: ["Slice of Life", "Comedy"], 
  Exciting: ["Action", "Adventure"], 
  "Thought-provoking": ["Psychological", "Mystery"], 
  Emotional: ["Drama", "Romance"], 
  Funny: ["Comedy"], 
  "Dark & Intense": ["Horror", "Psychological", "Crime"], 
  "Feel-good": ["Slice of Life", "Comedy", "Fantasy"], 
  Suspenseful: ["Mystery", "Psychological"], 
  Whimsical: ["Fantasy", "Comedy"], 
  "Mind-bending": ["Psychological", "Sci-Fi"], 
  Romantic: ["Romance"], 
  Cozy: ["Slice of Life"], 
}; 

const VIBE_OPENLIBRARY_SUBJECT_MAP = {
  Relaxed: ["fiction", "humorous_stories", "cozy"],
  Exciting: ["adventure", "action", "fantasy"],
  "Thought-provoking": ["psychological_fiction", "philosophy", "mystery"],
  Emotional: ["romance", "drama"],
  Funny: ["humor", "comedy"],
  "Dark & Intense": ["thriller", "horror", "crime"],
  "Feel-good": ["friendship", "humor", "fantasy"],
  Suspenseful: ["suspense", "thriller", "mystery"],
  Whimsical: ["fairy_tales", "fantasy"],
  "Mind-bending": ["science_fiction", "time_travel"],
  Romantic: ["romance"],
  Cozy: ["fiction", "domestic_fiction"],
};

const GENRE_NAME_MAP = { 
  "28": "Action", 
  "12": "Adventure", 
  "16": "Animation", 
  "35": "Comedy", 
  "80": "Crime", 
  "99": "Documentary", 
  "18": "Drama", 
  "10751": "Family", 
  "14": "Fantasy", 
  "36": "History", 
  "27": "Horror", 
  "10402": "Music", 
  "9648": "Mystery", 
  "10749": "Romance", 
  "878": "Sci-Fi", 
  "10770": "TV Movie", 
  "53": "Thriller", 
  "10752": "War", 
  "37": "Western", 
  "10759": "Action & Adventure", 
  "10765": "Sci-Fi & Fantasy", 
  "10762": "Kids",
  "10763": "News",
  "10764": "Reality",
  "10766": "Soap",
  "10767": "Talk",
  "10768": "War & Politics",
}; 

export function mapVibeToGenres(vibes = [], isTv = false) { 
  const set = new Set(); 
  const map = isTv ? VIBE_TV_GENRE_MAP : VIBE_GENRE_MAP;
  vibes.forEach((v) => { 
    const ids = map[v] || []; 
    ids.forEach((id) => set.add(id)); 
  }); 
  return Array.from(set); 
} 

export function buildTmdbDiscoverParams({ 
  medium = "movie", 
  vibes = [], 
  socialContext, 
  timeBudget, 
  includeGenres = [], 
  excludedGenres = [], 
  seriesFormat = "all",
}) { 
  const isTv = medium === "series" || timeBudget === "episodes"; 
  const params = new URLSearchParams({ 
    api_key: DIRECT_API_KEY, 
    sort_by: "vote_count.desc", 
    "vote_average.gte": "7.0", 
    "vote_count.gte": isTv ? "40" : "150", 
    include_adult: "false", 
  }); 

  const genreIds = new Set(mapVibeToGenres(vibes, isTv)); 
  includeGenres.forEach((g) => { 
    if (g === "Animation" || g === "16") genreIds.add("16"); 
    if (g === "Romance" || g === "10749") { 
      if (isTv) genreIds.add("18"); 
      else genreIds.add("10749"); 
    } 
    if (g === "Sci-Fi" || g === "878") genreIds.add(isTv ? "10765" : "878"); 
    if (g === "Action" || g === "28") genreIds.add(isTv ? "10759" : "28"); 
    if (g === "Drama" || g === "18") genreIds.add("18"); 
    if (g === "Comedy" || g === "35") genreIds.add("35"); 
    if (g === "Mystery" || g === "9648") genreIds.add("9648"); 
    if (g === "Fantasy" || g === "14") genreIds.add(isTv ? "10765" : "14"); 
  }); 

  if (isTv) {
    if (seriesFormat === "animation") {
      const otherGenres = Array.from(genreIds).filter((id) => id !== "16").slice(0, 3);
      if (otherGenres.length > 0) {
        params.set("with_genres", `16,${otherGenres.join("|")}`);
      } else {
        params.set("with_genres", "16");
      }
    } else if (seriesFormat === "live_action") {
      genreIds.delete("16");
      if (genreIds.size > 0) {
        params.set("with_genres", Array.from(genreIds).slice(0, 4).join("|"));
      }
      params.set("without_genres", "16");
    } else if (genreIds.size > 0) {
      params.set("with_genres", Array.from(genreIds).slice(0, 4).join("|"));
    }
  } else if (genreIds.size > 0) { 
    params.set("with_genres", Array.from(genreIds).slice(0, 4).join("|")); 
  } 

  if (excludedGenres.length > 0) { 
    const filteredExcludes = excludedGenres.filter((id) => !genreIds.has(id)); 
    if (filteredExcludes.length > 0) { 
      const currentWithout = params.get("without_genres");
      const combinedWithout = currentWithout
        ? `${currentWithout},${filteredExcludes.join(",")}`
        : filteredExcludes.join(",");
      params.set("without_genres", combinedWithout); 
    } 
  } 

  if (socialContext === "family") { 
    if (isTv) {
      params.set("with_genres", "10762|10751|16");
    } else {
      params.set("certification_country", "US"); 
      params.set("certification.lte", "PG-13"); 
    }
  } 

  if (!isTv) { 
    if (timeBudget === "under90") { 
      params.set("with_runtime.lte", "90"); 
    } else if (timeBudget === "90-120") { 
      params.set("with_runtime.gte", "90"); 
      params.set("with_runtime.lte", "120"); 
    } else if (timeBudget === "2plus") { 
      params.set("with_runtime.gte", "120"); 
    } 
  } 

  return params; 
} 

function shuffleArray(arr) { 
  const shuffled = [...arr]; 
  for (let i = shuffled.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
  } 
  return shuffled; 
} 

export async function fetchOrgiPicks({ 
  medium = "movie", 
  subMedium = "movie", 
  vibes = ["Relaxed"], 
  socialContext = "justMe", 
  timeBudget = "90-120", 
  _storyDepth = "deep", 
  includeGenres = [], 
  excludedGenres = [], 
  seriesFormat = "all",
}) { 
  if (medium === "book") { 
    const rawPicks = subMedium === "novels"
      ? await fetchOpenLibraryPicks({ vibes, includeGenres })
      : await fetchMangaPicks({ subMedium, vibes, includeGenres, excludedGenres }); 
    return enrichPicksWithAi(rawPicks, "book"); 
  } 

  const isTvEndpoint = subMedium === "series" || timeBudget === "episodes" || medium === "series"; 
  const endpoint = isTvEndpoint ? "/discover/tv" : "/discover/movie"; 
  const params = buildTmdbDiscoverParams({ 
    medium: isTvEndpoint ? "series" : "movie", 
    vibes, 
    socialContext, 
    timeBudget, 
    includeGenres, 
    excludedGenres, 
    seriesFormat,
  }); 

  let results = [];
  try {
    const res = await fetch(`${TMDB_DIRECT_URL}${endpoint}?${params.toString()}`); 
    if (res.ok) { 
      const json = await res.json(); 
      results = json.results || []; 
    }
  } catch {}

  if (results.length === 0) { 
    const fallbackParams = new URLSearchParams({ 
      api_key: DIRECT_API_KEY, 
      sort_by: "vote_count.desc", 
      "vote_average.gte": "7.0", 
      "vote_count.gte": isTvEndpoint ? "30" : "100",
      include_adult: "false", 
    }); 
    if (isTvEndpoint) {
      if (seriesFormat === "animation") {
        fallbackParams.set("with_genres", "16");
      } else if (seriesFormat === "live_action") {
        fallbackParams.set("without_genres", "16");
      }
    }
    try {
      const fallbackRes = await fetch(`${TMDB_DIRECT_URL}${endpoint}?${fallbackParams.toString()}`); 
      if (fallbackRes.ok) { 
        const fallbackJson = await fallbackRes.json(); 
        results = fallbackJson.results || []; 
      } 
    } catch {}
  } 

  const shuffled = shuffleArray(results); 
  const selected = shuffled.slice(0, 3); 

  const basePicks = selected.map((item, idx) => { 
    const isSeries = Boolean(isTvEndpoint || item.first_air_date || item.name); 
    const genresList = (item.genre_ids || []) 
      .map((gid) => GENRE_NAME_MAP[String(gid)]) 
      .filter(Boolean) 
      .slice(0, 3) 
      .join(" · "); 

    return { 
      id: String(item.id), 
      rank: idx + 1, 
      title: item.title || item.name || "Untitled", 
      poster: getTmdbImageUrl(item.poster_path, "w500"), 
      backdrop: getTmdbImageUrl(item.backdrop_path, "original"), 
      year: (item.release_date || item.first_air_date || "").slice(0, 4) || "2024", 
      genreTags: genresList || (isSeries ? "Series" : "Movie"), 
      rating: typeof item.vote_average === "number" ? item.vote_average.toFixed(1) : "8.0", 
      votesCount: item.vote_count ? `${(item.vote_count / 1000).toFixed(1)}k` : "1.2k", 
      synopsis: item.overview || "An exceptional story recommended based on your tonight's vibe.", 
      provider: "tmdb", 
      type: isSeries ? "SERIES" : "MOVIE", 
      route: isSeries ? `/series/${item.id}` : `/movie/${item.id}`, 
      subMedium: isSeries ? "series" : "movie", 
      vibes: vibes.slice(0, 2), 
      pitch: `Matches your ${vibes.join(" & ").toLowerCase()} mood with standout critical reception.`, 
    }; 
  }); 

  return enrichPicksWithAi(basePicks, isTvEndpoint ? "series" : "movie"); 
} 

async function enrichPicksWithAi(picks, mediaCategory) { 
  const verdicts = await Promise.allSettled( 
    picks.map((pick) => 
      fetchMediaVerdict({ 
        provider: pick.provider, 
        id: pick.id, 
        title: pick.title, 
        type: mediaCategory === "book" ? (pick.subMedium || "manga") : (pick.type === "SERIES" ? "tv" : "movie"), 
        genres: pick.genreTags || pick.vibes.join(", "), 
        year: pick.year, 
        synopsis: pick.synopsis, 
      }) 
    ) 
  ); 

  return picks.map((pick, i) => { 
    const vResult = verdicts[i]; 
    if (vResult?.status === "fulfilled" && vResult.value?.success && vResult.value.data) { 
      const d = vResult.value.data; 
      return { 
        ...pick, 
        aiVerdict: d, 
        pitch: d.verdict || pick.pitch, 
      }; 
    } 
    return { 
      ...pick, 
      aiVerdict: { 
        worthItHeadline: "Worth your time?", 
        verdict: pick.pitch, 
        enjoyIf: `You appreciate engaging pacing and ${pick.vibes.join(" and ").toLowerCase()} storytelling.`, 
        skipIf: "You are looking for a totally different emotional tempo tonight.", 
        experience: `A satisfying narrative with strong character depth and memorable payoff.`, 
        keyNote: "Recommended based on your current vibe preferences.", 
      }, 
    }; 
  }); 
} 

async function fetchOpenLibraryPicks({ vibes = ["Relaxed"], includeGenres = [] }) {
  let subject = "fiction";
  for (const v of vibes) {
    const list = VIBE_OPENLIBRARY_SUBJECT_MAP[v];
    if (list && list.length > 0) {
      subject = list[0];
      break;
    }
  }
  if (includeGenres.includes("Romance")) subject = "romance";
  if (includeGenres.includes("Fantasy")) subject = "fantasy";
  if (includeGenres.includes("Action")) subject = "adventure";
  if (includeGenres.includes("Mystery")) subject = "mystery";

  let works = [];
  try {
    const res = await fetch(`https://openlibrary.org/subjects/${subject}.json?limit=30`);
    if (res.ok) {
      const json = await res.json();
      works = json.works || [];
    }
  } catch {}

  if (works.length === 0) {
    try {
      const fbRes = await fetch("https://openlibrary.org/subjects/fiction.json?limit=30");
      if (fbRes.ok) {
        const fbJson = await fbRes.json();
        works = fbJson.works || [];
      }
    } catch {}
  }

  const shuffled = shuffleArray(works);
  const selected = shuffled.slice(0, 3);

  return selected.map((item, idx) => {
    const coverId = item.cover_id;
    const authorName = item.authors?.[0]?.name || "Unknown Author";
    const id = (item.key || "").replace("/works/", "") || `ol-${idx}`;
    const cover = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : "";

    return {
      id,
      rank: idx + 1,
      title: item.title || "Untitled",
      poster: cover,
      backdrop: cover,
      year: item.first_publish_year ? String(item.first_publish_year) : "Classic",
      genreTags: "COMPLETED · NOVELS",
      rating: "8.8",
      votesCount: item.edition_count ? `${item.edition_count * 20}` : "850",
      synopsis: item.subject ? `A celebrated work exploring ${item.subject.slice(0, 3).join(", ")}.` : "A critically acclaimed literary work.",
      provider: "openlibrary",
      type: "BOOK",
      subMedium: "novels",
      route: `/books/novels/${id}`,
      vibes: vibes.slice(0, 2),
      pitch: `A standout novel fitting your ${vibes.join(" & ").toLowerCase()} mood.`,
    };
  });
}

async function fetchMangaPicks({ subMedium = "all", vibes = ["Relaxed"], includeGenres = [], excludedGenres = [] }) { 
  if (subMedium === "novels") {
    return fetchOpenLibraryPicks({ vibes, includeGenres });
  }

  const params = new URLSearchParams({ 
    limit: "30", 
    "order[followedCount]": "desc", 
    "order[rating]": "desc", 
  }); 

  params.append("includes[]", "cover_art"); 
  params.append("includes[]", "author"); 
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");

  if (subMedium === "manga") {
    params.append("originalLanguage[]", "ja");
  } else if (subMedium === "manhwa") {
    params.append("originalLanguage[]", "ko");
  } else if (subMedium === "manhua") {
    params.append("originalLanguage[]", "zh");
    params.append("originalLanguage[]", "zh-hk");
  }

  const targetTags = new Set(); 
  vibes.forEach((v) => { 
    const tags = VIBE_MANGADEX_MAP[v] || []; 
    tags.forEach((t) => { 
      if (MANGADEX_GENRE_TAGS[t]) targetTags.add(MANGADEX_GENRE_TAGS[t]); 
    }); 
  }); 

  includeGenres.forEach((g) => { 
    if (MANGADEX_GENRE_TAGS[g]) targetTags.add(MANGADEX_GENRE_TAGS[g]); 
  }); 

  if (targetTags.size > 0) {
    targetTags.forEach((tagId) => params.append("includedTags[]", tagId)); 
    params.set("includedTagsMode", "OR");
  }

  excludedGenres.forEach((eg) => { 
    if (MANGADEX_GENRE_TAGS[eg] && !targetTags.has(MANGADEX_GENRE_TAGS[eg])) { 
      params.append("excludedTags[]", MANGADEX_GENRE_TAGS[eg]); 
    } 
  }); 

  let items = [];
  try {
    const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`); 
    if (res.ok) {
      const json = await res.json(); 
      items = json.data || []; 
    }
  } catch {}

  // Fallback to top-followed items for this subMedium if tag combinations returned 0
  if (items.length === 0) {
    try {
      const fbParams = new URLSearchParams({
        limit: "30",
        "order[followedCount]": "desc",
      });
      fbParams.append("includes[]", "cover_art");
      fbParams.append("contentRating[]", "safe");
      fbParams.append("contentRating[]", "suggestive");
      if (subMedium === "manga") {
        fbParams.append("originalLanguage[]", "ja");
      } else if (subMedium === "manhwa") {
        fbParams.append("originalLanguage[]", "ko");
      } else if (subMedium === "manhua") {
        fbParams.append("originalLanguage[]", "zh");
        fbParams.append("originalLanguage[]", "zh-hk");
      }
      const fbRes = await fetch(`${MANGADEX_BASE}/manga?${fbParams.toString()}`);
      if (fbRes.ok) {
        const fbJson = await fbRes.json();
        items = fbJson.data || [];
      }
    } catch {}
  }

  const shuffled = shuffleArray(items); 
  const selected = shuffled.slice(0, 3); 

  return selected.map((item, idx) => { 
    const attrs = item.attributes || {}; 
    const title = attrs.title?.en || Object.values(attrs.title || {})[0] || "Untitled"; 
    const coverRel = (item.relationships || []).find((r) => r.type === "cover_art"); 
    const fileName = coverRel?.attributes?.fileName; 
    const coverUrl = fileName ? `${MANGADEX_COVERS}/${item.id}/${fileName}.512.jpg` : ""; 
    const bookCategory = subMedium === "all" ? "manga" : subMedium; 

    return { 
      id: String(item.id), 
      rank: idx + 1, 
      title, 
      poster: coverUrl, 
      backdrop: coverUrl, 
      year: (attrs.year || attrs.createdAt || "").toString().slice(0, 4) || "2024", 
      genreTags: `${(attrs.status || "Completed").toUpperCase()} · ${(bookCategory).toUpperCase()}`, 
      rating: "8.6", 
      votesCount: "940", 
      synopsis: attrs.description?.en || "A critically acclaimed story matching your reading mood.", 
      provider: "mangadex", 
      type: "BOOK", 
      subMedium: bookCategory, 
      route: `/books/${bookCategory}/${item.id}`, 
      vibes: vibes.slice(0, 2), 
      pitch: `A standout ${bookCategory} fitting your ${vibes.join(" & ").toLowerCase()} preference.`, 
    }; 
  }); 
} 
