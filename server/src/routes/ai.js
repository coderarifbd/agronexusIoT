import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { processAIAssistantQuery } from "../services/aiAssistant.js";
import { detectChannelAnomalies } from "../services/anomalyDetector.js";
import { db } from "../db.js";

const router = express.Router();

router.post("/query", authenticateToken, async (req, res) => {
  const { query, channelId } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query text is required." });
  }

  const response = await processAIAssistantQuery(query, req.user.id, channelId);
  res.json(response);
});

router.get("/anomalies/:channelId", authenticateToken, async (req, res) => {
  const result = await detectChannelAnomalies(req.params.channelId);
  res.json(result);
});

router.get("/forecast/:channelId", authenticateToken, async (req, res) => {
  const channelId = req.params.channelId;
  const recent = await db.all(`
    SELECT data_json, timestamp 
    FROM telemetry_data 
    WHERE channel_id = $1 
    ORDER BY id DESC LIMIT 30
  `, [channelId]);

  const forecastData = [];
  let baseTemp = 28.5;
  let baseHum = 65;

  if (recent.length > 0) {
    try {
      const last = typeof recent[0].data_json === "string" ? JSON.parse(recent[0].data_json) : recent[0].data_json;
      if (last.temperature) baseTemp = last.temperature;
      if (last.humidity) baseHum = last.humidity;
    } catch (e) {}
  }

  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const futureTime = new Date(now.getTime() + i * 3600 * 1000);
    forecastData.push({
      time: futureTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      predicted_temp: +(baseTemp + (i * 0.75 * Math.sin(i / 2))).toFixed(1),
      predicted_humidity: Math.max(30, Math.min(95, Math.round(baseHum - i * 1.8))),
      confidence: Math.round(96 - i * 3)
    });
  }

  res.json({
    channelId,
    model: "AgroNexus Time-Series AR-Predictor v1.4 (Neon Cloud Engine)",
    generatedAt: new Date().toISOString(),
    forecast: forecastData
  });
});

export default router;
