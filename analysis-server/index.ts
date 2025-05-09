import express, { Request, Response } from "express";
import { Pool } from "pg";
import { config } from "dotenv";
import { analyzeSession } from "./analyzer";

// Load environment variables
config();

// Create Express app
const app = express();
const PORT = process.env.ANALYSIS_SERVER_PORT ?? 3001;

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Trigger analysis for a session - non-blocking
app.post("/analyze/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // Immediately acknowledge the request
  res.status(202).json({ message: "Analysis job queued" });

  // Process in the background
  void (async () => {
    try {
      await analyzeSession(pool, sessionId);
      console.log(`Analysis completed for session ${sessionId}`);
    } catch (error) {
      console.error(`Analysis failed for session ${sessionId}:`, error);
    }
  })();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Analysis server running on port ${PORT}`);
});
