import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import {tmdbService} from "./tmdbService.js";

async function runTest(){
    console.log("K-Dramas: ");
    const kdramas = await tmdbService.getKDramas(1);
    console.log("First item:", kdramas[0]);
}
runTest();