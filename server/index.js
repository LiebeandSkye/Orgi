import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./src/routes/index.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
