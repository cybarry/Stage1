import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import stringRoutes from "./routes/strings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(morgan("dev"));

// Basic rate limiting (best practice for public API)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { status: "fail", message: "Too many requests, slow down." }
});
app.use(limiter);

// Routes
app.use("/strings", stringRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "String Analyzer API - Stage 1" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
