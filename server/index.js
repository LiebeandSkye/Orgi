import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running smoothly!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
