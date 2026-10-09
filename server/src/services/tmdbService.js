const TMDB_BASE_URL="https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

async function fetchFromTMDB(endpoint, params = {}) {
    const apiKey = process.env.TMDB_API_KEY;
    if(!apiKey){
        throw new Error("TMDB_API_KEY is not configured in .env");
    }

    const queryParams = new URLSearchParams({api_key: apiKey,...params,});
    const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok){
        throw new Error(`TMDB API Error: ${response.status}${response.statusText}`);
    }
    return response.json();
    }
    function formatTMDBItem(item, type = "movie"){
        return {
            id: `tmdb_${item.id}`,
            sourceID:item.id,
            source: "tmdb",
            type: item.media_type || type,
            title: item.title || item.name || "Untitled",
            originalTitle: item.original_title || item.original_name,
            overview: item.overview || "",
            posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}`:null,
            backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}`:null,
            releaseDate: item.release_date || item.first_air_date || null,
            rating: item.vote_average ? Math.round(item.vote_average * 10)/10 : null,
            voteCount: item.vote_count || 0,
            language: item.original_language || null,
        };
    }

    export const tmdbService = {
        //TRENDING
        async getTrending(mediaType = "all", timeWindow = "week"){
            const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`);
            return data.results.map((item) => formatTMDBItem(item, item.media_tyoe));
        },

        //KDRAMA
        async getKDramas(page = 1){
            const data = await fetchFromTMDB("/discover/tv",{with_original_language: "ko", sort_by: "popularity.desc", page,});
            return data.results.map((item) => formatTMDBItem(item, "tv"));
        },


        //CDRAMA
        async getCDramas(page = 1){
            const data = await fetchFromTMDB("/discover/tv",{with_original_language: "zh", sort_by: "popularity.desc", page,});
            return data.results.map((item) => formatTMDBItem(item, "tv"));
        },

        //BOLLYWOOD
        async getBollywood(page = 1){
            const data = await fetchFromTMDB("/discover/movie",{with_original_language: "hi", sort_by:"popularity.desc", page,});
            return data.results.map((item) => formatTMDBItem(item,"movie"));
        },

        //HOLLYWOOD
        async getHollywood(page =1){
            const data = await fetchFromTMDB("/discover/movie",{with_original_language: "en", sort_by:"popularity.desc", page,});
            return data.results.map((item)=> formatTMDBItem(item,"movie"));
        },
        
        //ANIME
        async getAnimeSeries(page=1){
            const data = await fetchFromTMDB("/discover/tv", {with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc", page,});
            return data.results.map((item) => formatTMDBItem(item, "tv"));
        },

        async getAnimeMovie(page=1){
            const data = await fetchFromTMDB("/discover/movie", {with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc", page,});
            return data.results.map((item) => formatTMDBItem(item, "movie"));
        },


        //SEARCH
        async search(query, page=1){
            const data = await fetchFromTMDB("/search/multi", { query, page, include_adult: "true",});
            return data.results.filter((item) => item.media_type === "movie" || item.media_type === "tv").map((item) => formatTMDBItem(item, item.media_type));
        },

        async getDetails(id, mediaType = "movie"){
            const data = await fetchFromTMDB(`/${mediaType}/${id}`,{append_to_response:"credits,videos",});
            return {...formatTMDBItem(data, mediaType),
                genres: data.genres?.map((g) => g.name) ||[],
                runtime: data.runtime || data.episode_run_time?.[0] || null,
                status: data.status,
                tagline: data.tagline,
            };
    },
};