import express from "express";
import { Pool } from "pg";
import { config } from "dotenv";
import { analyzeCompletedSessions } from "./analyzer";

// Load environment variables
config();

// Create Express app
const app = express();
const PORT = process.env.ANALYSIS_SERVER_PORT || 3001;

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Manually trigger analysis for a specific session
app.post("/analyze/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await analyzeCompletedSessions(pool, sessionId);
    res.status(200).json({ message: "Analysis triggered successfully" });
  } catch (error) {
    console.error("Error triggering analysis:", error);
    res.status(500).json({ error: "Failed to trigger analysis" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Analysis server running on port ${PORT}`);

  // Start polling for unprocessed sessions
  const POLL_INTERVAL = 30000; // 30 seconds
  setInterval(async () => {
    try {
      await analyzeCompletedSessions(pool);
      console.log("Checked for unprocessed sessions");
    } catch (error) {
      console.error("Error in analysis polling:", error);
    }
  }, POLL_INTERVAL);
});
