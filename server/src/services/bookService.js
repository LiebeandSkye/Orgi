const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const COVERS_BASE_URL = "https://covers.openlibrary.org/b/id";

async function fetchFromOpenLibrary(endpoint, params = {}) {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    const url = queryString ? `${OPEN_LIBRARY_BASE}${endpoint}?${queryString}`:`${OPEN_LIBRARY_BASE}${endpoint}`;

    const userAgent = `Orgi/1.0 (${process.env.USER_AGENT_EMAIL || ""})`;

    const response = await fetch(url, {headers: {"user-Agent": userAgent,
    },
});

if (!response.ok){
    throw new Error (`Open Library Error API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function formatBookItem(item){
    const rawKey = item.key || "";
    const cleanId = rawKey.replace("/works/", "");

    const coverId = item.cover_i || item.cover_id;
    const posterUrl = coverId ?`${COVERS_BASE_URL}/${coverId}-L.jpg` : null;
    let authors = [];
    if (Array.isArray(item.author_name)) {
        authors = item.author_name;
    }else if (Array.isArray(item.authors)) {
        authors = item.authors.map((a) => (typeof a === "string"? a : a.name));
    }
    
    return {
        id: `book_${cleanId}`,
        sourceID: cleanId,
        source: "openLibrary",
        type: "book",
        title: item.title || "Untitled",
        originalTitle: null,
        overview: typeof item.description === "string" ? item.description : item.description?.value || "",
        posterUrl,
        backdropUrl: null,
        releaseDate: item.first_publish_year ?`${item.first_publish_year}-01-01` : null,
        rating: null,
        voteCount: item.edition_count || 0,
        language: Array.isArray(item.language) ? item.language[0] : null,
        genres: Array.isArray(item.subject) ? item.subject.slice(0, 5) : [],
        authors,
    };
}

export const bookService = {
    async getPopularBooks(subject = "fiction", limit= 20){
        const data = await fetchFromOpenLibrary(`/subjects/${subject}.json`, {limit,});
        return (data.works || []).map(formatBookItem);
    },

    async search(query, page=1, limit=20){
        const data = await fetchFromOpenLibrary("/search.json", {q: query, page, limit,});
        return(data.docs || []).map(formatBookItem);
    },

    async getDetails(workId){
        const cleanId = workId.replace("/works/", "");
        const data = await fetchFromOpenLibrary(`/works/${cleanId}.json`);
        return formatBookItem(data);
    },
};