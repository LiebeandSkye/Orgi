import express from "express"; 



const router = express.Router(); 

router.get("/", (req, res) => { 
    res.json({ 
        status: "ok", 
        message: "Server is healthy and ready!", 
        timestamp: new Date().toISOString() 
    })
})



export default router; 
