import express from "express";
import { db } from "../db.js";
import { applySensorCalibration } from "../services/calibrationEngine.js";
import { evaluateCalculatedFields } from "../services/formulaEvaluator.js";
import { evaluateAutomationRules } from "../services/ruleEngine.js";
import { wsHub } from "../services/websocket.js";

const router = express.Router();

// Unified Ingest Endpoint (Item 7: POST /api/data)
router.post("/data", async (req, res) => {
  const apiKeyHeader = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
  const payload = req.body;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid JSON telemetry payload." });
  }

  const deviceIdCode = payload.device_id || payload.device_id_code;
  const apiKey = apiKeyHeader || payload.api_key;

  let device = null;
  let channel = null;

  if (deviceIdCode) {
    device = await db.get("SELECT * FROM devices WHERE device_id_code = $1", [deviceIdCode]);
  } else if (apiKey) {
    device = await db.get("SELECT * FROM devices WHERE api_key = $1", [apiKey]);
  }

  if (device && device.channel_id) {
    channel = await db.get("SELECT * FROM channels WHERE id = $1", [device.channel_id]);
  } else if (apiKey) {
    channel = await db.get("SELECT * FROM channels WHERE api_write_key = $1", [apiKey]);
  }

  if (!channel) {
    return res.status(404).json({ error: "Device or Channel not found or not mapped." });
  }

  const sensorData = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!["device_id", "device_id_code", "api_key", "secret"].includes(k)) {
      if (typeof v === "number" || typeof v === "string") {
        sensorData[k] = isNaN(Number(v)) ? v : Number(v);
      }
    }
  }

  let processedData = await applySensorCalibration(channel.id, sensorData);
  processedData = await evaluateCalculatedFields(channel.id, processedData);

  await db.run(`
    INSERT INTO telemetry_data (channel_id, device_id, data_json, timestamp)
    VALUES ($1, $2, $3, NOW())
  `, [channel.id, device?.id || null, JSON.stringify(processedData)]);

  if (device) {
    const battery = payload.battery || payload.battery_level;
    const wifi = payload.wifi_rssi || payload.rssi;
    await db.run(`
      UPDATE devices 
      SET last_seen = NOW(), status = 'online',
          battery_level = COALESCE($1, battery_level),
          wifi_rssi = COALESCE($2, wifi_rssi)
      WHERE id = $3
    `, [battery, wifi, device.id]);
  }

  wsHub.broadcastTelemetry(channel.id, processedData, device?.id);
  await evaluateAutomationRules(channel.id, processedData, device?.id);

  res.status(200).json({
    success: true,
    message: "Telemetry ingested successfully into Neon Cloud",
    channel_id: channel.id,
    processed_fields: Object.keys(processedData)
  });
});

// Channel Ingest by Write Key: POST /api/channels/:id/data
router.post("/channel/:id/data", async (req, res) => {
  const channelId = req.params.id;
  const apiKey = req.headers["x-api-key"] || req.body.api_key;

  const channel = await db.get("SELECT * FROM channels WHERE id = $1", [channelId]);
  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  if (apiKey && channel.api_write_key !== apiKey) {
    return res.status(403).json({ error: "Invalid API Write Key." });
  }

  const sensorData = { ...req.body };
  delete sensorData.api_key;

  let processed = await applySensorCalibration(channelId, sensorData);
  processed = await evaluateCalculatedFields(channelId, processed);

  await db.run(`
    INSERT INTO telemetry_data (channel_id, data_json, timestamp)
    VALUES ($1, $2, NOW())
  `, [channelId, JSON.stringify(processed)]);

  wsHub.broadcastTelemetry(channelId, processed, null);
  await evaluateAutomationRules(channelId, processed, null);

  res.json({ success: true, channel_id: channelId, data: processed });
});

// Historical Telemetry Query
router.get("/channel/:channelId/historical", async (req, res) => {
  const { range = "24h", limit = 300 } = req.query;
  const channelId = req.params.channelId;

  let intervalStr = "24 hours";
  if (range === "1h") intervalStr = "1 hours";
  else if (range === "6h") intervalStr = "6 hours";
  else if (range === "24h") intervalStr = "24 hours";
  else if (range === "7d") intervalStr = "7 days";
  else if (range === "30d") intervalStr = "30 days";
  else if (range === "all") intervalStr = "365 days";

  const rows = await db.all(`
    SELECT id, data_json, timestamp 
    FROM telemetry_data 
    WHERE channel_id = $1 AND timestamp >= NOW() - ($2::interval)
    ORDER BY timestamp ASC
    LIMIT $3
  `, [channelId, intervalStr, parseInt(limit, 10) || 300]);

  const formatted = rows.map(r => {
    let data = {};
    try { data = typeof r.data_json === "string" ? JSON.parse(r.data_json) : r.data_json; } catch (e) {}
    return {
      id: r.id,
      timestamp: r.timestamp,
      ...data
    };
  });

  res.json({
    channelId,
    range,
    count: formatted.length,
    records: formatted
  });
});

// Advanced Analytics
router.get("/channel/:channelId/analytics", async (req, res) => {
  const { field, range = "24h" } = req.query;
  const channelId = req.params.channelId;

  let intervalStr = "24 hours";
  if (range === "1h") intervalStr = "1 hours";
  else if (range === "6h") intervalStr = "6 hours";
  else if (range === "7d") intervalStr = "7 days";
  else if (range === "30d") intervalStr = "30 days";

  const rows = await db.all(`
    SELECT data_json, timestamp 
    FROM telemetry_data 
    WHERE channel_id = $1 AND timestamp >= NOW() - ($2::interval)
    ORDER BY timestamp ASC
  `, [channelId, intervalStr]);

  if (rows.length === 0) {
    return res.json({ message: "No data available in this time range.", analytics: {} });
  }

  const fieldValuesMap = {};

  for (const row of rows) {
    try {
      const data = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === "number" && !isNaN(v)) {
          if (!fieldValuesMap[k]) fieldValuesMap[k] = [];
          fieldValuesMap[k].push({ val: v, time: row.timestamp });
        }
      }
    } catch (e) {}
  }

  const results = {};

  for (const [fKey, arr] of Object.entries(fieldValuesMap)) {
    if (field && field !== fKey) continue;
    if (arr.length === 0) continue;

    const values = arr.map(a => a.val);
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = +(sum / values.length).toFixed(2);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);

    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    const stdDev = +Math.sqrt(variance).toFixed(2);

    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const pctChange = firstVal !== 0 ? +(((lastVal - firstVal) / Math.abs(firstVal)) * 100).toFixed(2) : 0;
    const trend = pctChange > 1 ? "RISING" : pctChange < -1 ? "FALLING" : "STABLE";

    results[fKey] = {
      count: values.length,
      current: lastVal,
      average: avg,
      minimum: min,
      maximum: max,
      median,
      stdDev,
      percentChange: pctChange,
      trend,
      firstTimestamp: arr[0].time,
      lastTimestamp: arr[arr.length - 1].time
    };
  }

  res.json({ channelId, range, analytics: results });
});

// Data Export
router.get("/channel/:channelId/export", async (req, res) => {
  const { format = "json", range = "30d" } = req.query;
  const channelId = req.params.channelId;

  let intervalStr = "30 days";
  if (range === "7d") intervalStr = "7 days";
  else if (range === "24h") intervalStr = "24 hours";

  const rows = await db.all(`
    SELECT id, timestamp, data_json 
    FROM telemetry_data 
    WHERE channel_id = $1 AND timestamp >= NOW() - ($2::interval)
    ORDER BY timestamp ASC
  `, [channelId, intervalStr]);

  const flatData = rows.map(r => {
    let parsed = {};
    try { parsed = typeof r.data_json === "string" ? JSON.parse(r.data_json) : r.data_json; } catch (e) {}
    return {
      timestamp: r.timestamp,
      ...parsed
    };
  });

  if (format === "csv") {
    if (flatData.length === 0) {
      return res.status(200).send("timestamp\n");
    }

    const allKeys = Array.from(new Set(flatData.flatMap(Object.keys)));
    const header = allKeys.join(",");
    const csvRows = flatData.map(row => {
      return allKeys.map(k => (row[k] !== undefined ? `"${row[k]}"` : "")).join(",");
    });

    const csvContent = [header, ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="channel_${channelId}_telemetry.csv"`);
    return res.send(csvContent);
  }

  res.json({ channelId, exportedAt: new Date().toISOString(), totalRecords: flatData.length, data: flatData });
});

export default router;
