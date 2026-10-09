const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

async function fetchFromJikan(endpoint, params = {}) {
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    const url = queryString ? `${JIKAN_BASE_URL}${endpoint}?${queryString}`:`${JIKAN_BASE_URL}}${endpoint}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error (`Jikan API Error: ${response.status}${response.statusText}`);
    }
    return response.json();
}

function formatJikanItem(item, type = "manga") {
    return {
        id: `jikan_${item.mal_id}`,
        sourceID: item.mal_id,
        source: "jikan",
        type: item.type ? item.type.toLowerCase(): type,
        title: item.title || "Untitled",
        originalTitle: item.title_japanese || item.title_english || null,
        overview: item.synopsis || "",
        posterUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
        backdropUrl: null,
        releaseDate: item.published?.from ? item.published.from.split("T")[0] : null,
        rating: item.score || null,
        genres: item.genres?.map((g)=> g.name) || [],
        chapters: item.chapters || null,
        volumes: item.volumes || null,
        authors: item.authors?.map((a)=> a.name)|| [],
    };
}

export const jikanService = {
    async getTopManga(page = 1){
        const data= await fetchFromJikan("/top/manga", {type: "manga", page, filter: "bypopularity",});
        return data.data.map((item) => formatJikanItem(Item, "manga"));
    },

    async getTopManhwa(page =1) {
        const data = await fetchFromJikan("/top/manga", {type: "manhwa", page, filter:"bypopularity",});
        return data.data.map((item) => formatJikanItem(item, "manhwa"));
    },
    
    async search(query, type="manga", page=1){
        const data = await  fetchFromJikan("/manga", {q: query, type: type, page, order_by: "popularity", sort_by:"ascend"})
    }
}