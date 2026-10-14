import "dotenv/config"; 
import express from "express"; 
import cors from "cors"; 
import healthRoutes from "./src/routes/healthRoutes.js"; 
import tmdbRoutes from "./src/routes/tmdbRoutes.js"; 
import authRoutes from "./src/routes/authRoutes.js"; 
import profileRoutes from "./src/routes/profileRoutes.js"; 
import mediaRoutes from "./src/routes/mediaRoutes.js"; 
import reviewRoutes from "./src/routes/reviewRoutes.js"; 
import { errorHandler } from "./src/middlewares/errorHandler.js"; 

const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json()); 

app.use("/api/health", healthRoutes); 
app.use("/api/tmdb", tmdbRoutes); 
app.use("/api/auth", authRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/media", mediaRoutes); 
app.use("/api/reviews", reviewRoutes); 

app.use((req, res) => { 
    res.status(404).json({ 
        error: { 
            message: `Route not found: ${req.method} ${req.originalUrl}`, 
            status: 404, 
        } 
    }); 
}); 

app.use(errorHandler); 

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 
