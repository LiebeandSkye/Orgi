import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import {tmdbService} from "./tmdbService.js";
import {mangadexService} from "./mangadex.js";

async function runTest(){
    console.log("K-Dramas: ");
    const kdramas = await tmdbService.getKDramas(1);
    console.log("First item:", kdramas[0]);

    console.log("C-Dramas: ");
    const cdramas = await tmdbService.getCDramas(1);
    console.log("Second item:", cdramas[0]);

    console.log("Bollywood: ");
    const bollywood = await tmdbService.getBollywood(1);
    console.log("Third item:", bollywood[0]);

    console.log("Hollywood: ");
    const hollywood = await tmdbService.getHollywood(1);
    console.log("Fifth item:", hollywood[0]);

    console.log("Anime series: ");
    const anime = await tmdbService.getAnimeSeries(1);
    console.log("Six item:", anime[0]);
    
    console.log("Anime Movie: ");
    const animovie = await tmdbService.getAnimeMovie(1);
    console.log("First item:", animovie[0]);

    console.log("Manhwa: ");
    const manhwaList = await mangadexService.getPopularManhwa(3);
    console.log("Results:");
    console.log(manhwaList);

    console.log("Manga: ");
    const mangaList = await mangadexService.getPopularManga(3);
    console.log("Results:");
    console.log(mangaList);

    console.log("Manhua: ");
    const manhuaList = await mangadexService.getPopularManhua(3);
    console.log("Results:");
    console.log(manhuaList);
}
runTest();