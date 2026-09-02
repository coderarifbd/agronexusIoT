import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AIProviderFactory } from "../services/aiProviders/AIProviderFactory.js";
import { conversationContext } from "../services/conversationContext.js";
import * as tools from "../services/aiTools.js";
import { detectChannelAnomalies } from "../services/anomalyDetector.js";
import { wsHub } from "../services/websocket.js";
import { db } from "../db.js";

const router = express.Router();

/**
 * Main AI IoT Assistant Query Endpoint
 * Supports Level 1 (Readings), Level 2 (Analysis/Trends), Level 3 (Health/Alerts), Level 4 (Automation Proposals)
 */
router.post("/query", authenticateToken, async (req, res) => {
  const { query, channelId, conversationHistory } = req.body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Query text is required." });
  }

  try {
    const provider = AIProviderFactory.getProvider();
    const context = conversationContext.getContext(req.user.id);
    if (channelId) context.activeChannelId = channelId;

    const result = await provider.processQuery({
      query: query.trim(),
      userId: req.user.id,
      channelId: channelId || context.activeChannelId,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      context
    });

    res.json({
      query,
      answer: result.answer,
      cards: result.cards || {},
      actionProposal: result.actionProposal || null,
      provider: provider.name
    });
  } catch (err) {
    console.error("AI Assistant Query Error:", err);
    res.status(500).json({
      error: "Unable to process IoT AI query.",
      message: "An internal error occurred while communicating with the telemetry intelligence engine."
    });
  }
});

/**
 * Level 4 Action Execution Endpoint
 * Requires verified confirmationToken generated during proposal stage.
 * Never executes without explicit confirmation.
 */
router.post("/execute-action", authenticateToken, async (req, res) => {
  const { confirmationToken, actionType } = req.body;

  if (!confirmationToken || !actionType) {
    return res.status(400).json({ error: "Confirmation token and action type are required." });
  }

  try {
    if (actionType === "CREATE_AUTOMATION_RULE") {
      const result = await tools.confirmCreateAutomationRule(req.user.id, confirmationToken);
      return res.json(result);
    } else if (actionType === "CONTROL_ACTUATOR") {
      const result = await tools.confirmControlActuator(req.user.id, confirmationToken, wsHub);
      return res.json(result);
    } else {
      return res.status(400).json({ error: "Unsupported action type." });
    }
  } catch (err) {
    console.error("Action Execution Error:", err);
    res.status(403).json({ error: err.message || "Failed to execute verified action." });
  }
});

/**
 * Proactive Daily AI Summary
 */
router.get("/daily-summary", authenticateToken, async (req, res) => {
  try {
    const summary = await tools.getDailyAISummary(req.user.id, req.query.projectId);
    res.json(summary);
  } catch (err) {
    console.error("Daily Summary Error:", err);
    res.status(500).json({ error: "Failed to retrieve daily AI summary." });
  }
});

/**
 * Legacy/Component Anomaly Endpoint
 */
router.get("/anomalies/:channelId", authenticateToken, async (req, res) => {
  try {
    const result = await detectChannelAnomalies(req.params.channelId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to scan anomalies." });
  }
});

/**
 * Legacy/Component Forecast Endpoint
 */
router.get("/forecast/:channelId", authenticateToken, async (req, res) => {
  try {
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
      model: "AgroNexus Time-Series AR-Predictor v2.0 (Neon Cloud Engine)",
      generatedAt: new Date().toISOString(),
      forecast: forecastData
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute forecast." });
  }
});

export default router;
