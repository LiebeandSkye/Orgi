import express from "express"; 
import { redis } from "../services/redis.js";

const router = express.Router(); 

router.get("/", (req, res) => { 
    res.json({ 
        status: "ok", 
        message: "Server is healthy and ready!", 
        timestamp: new Date().toISOString(),
        redis: redis ? "connected" : "disabled",
    })
})



export default router; 
