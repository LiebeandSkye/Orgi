import { describe, it, expect } from "vitest"; 
import { buildTmdbDiscoverParams, mapVibeToGenres } from "./recommendationService"; 

describe("recommendationService", () => { 
  it("maps Thought-provoking vibe to mystery, sci-fi and drama genre IDs", () => { 
    const genreIds = mapVibeToGenres(["Thought-provoking"]); 
    expect(genreIds).toContain("9648"); 
    expect(genreIds).toContain("878"); 
  }); 

  it("builds valid TMDB discover params for movie under 90 minutes", () => { 
    const params = buildTmdbDiscoverParams({ 
      medium: "movie", 
      vibes: ["Relaxed"], 
      timeBudget: "under90", 
    }); 
    expect(params.get("with_runtime.lte")).toBe("90"); 
    expect(params.get("vote_average.gte")).toBe("7.0"); 
  }); 
}); 
