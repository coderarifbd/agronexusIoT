import express from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { applySensorCalibration } from "../services/calibrationEngine.js";
import { evaluateCalculatedFields } from "../services/formulaEvaluator.js";
import { evaluateAutomationRules } from "../services/ruleEngine.js";
import { wsHub } from "../services/websocket.js";

const router = express.Router();

// Helper: Common ingestion processor
async function processAndStoreTelemetry(channel, device, rawData) {
  const sensorData = {};
  // Unpack nested data object if present (e.g. { device_id, api_key, data: { temperature: 28.5, humidity: 70 } })
  const payload = (rawData.data && typeof rawData.data === "object") ? { ...rawData, ...rawData.data } : rawData;

  for (const [k, v] of Object.entries(payload)) {
    if (!["device_id", "device_id_code", "api_key", "key", "write_api_key", "channel_id", "channel_number", "secret", "timestamp", "created_at", "data"].includes(k)) {
      if (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) {
        sensorData[k] = isNaN(Number(v)) ? v : Number(v);
      }
    }
  }

  // Smart Field Auto-Mapping:
  // If payload does not have standard field1, field2... but has custom sensor names (e.g. tds, temp, humidity),
  // map them to the channel's fields so charts and widgets display them immediately!
  try {
    const channelFields = await db.all(
      "SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC",
      [channel.id]
    );

    const hasStandardField = Object.keys(sensorData).some((k) => /^field\d+$/i.test(k));
    if (!hasStandardField && channelFields && channelFields.length > 0) {
      const sensorKeys = Object.keys(sensorData);
      let mapped = false;

      // 1. Match by field name or key (e.g. sensor "tds" matches field named "TDS" or "Field Label 1")
      sensorKeys.forEach((key) => {
        const lowerKey = key.toLowerCase().trim();
        const match = channelFields.find((f) => {
          const fn = (f.name || "").toLowerCase().trim();
          const fk = (f.field_key || "").toLowerCase().trim();
          return fn === lowerKey || fk === lowerKey || fn.includes(lowerKey) || lowerKey.includes(fn);
        });

        if (match && sensorData[match.field_key] === undefined) {
          sensorData[match.field_key] = sensorData[key];
          mapped = true;
        }
      });

      // 2. If no direct name match, map sequentially: 1st sensor -> field1, 2nd -> field2, etc.
      if (!mapped) {
        sensorKeys.forEach((key, idx) => {
          if (channelFields[idx]) {
            const targetKey = channelFields[idx].field_key || `field${idx + 1}`;
            if (sensorData[targetKey] === undefined) {
              sensorData[targetKey] = sensorData[key];
            }
          } else if (idx < 8) {
            const fallbackKey = `field${idx + 1}`;
            if (sensorData[fallbackKey] === undefined) {
              sensorData[fallbackKey] = sensorData[key];
            }
          }
        });
      }
    }
  } catch (mapErr) {
    console.warn("Smart field mapping note:", mapErr.message);
  }

  let processedData = await applySensorCalibration(channel.id, sensorData);
  processedData = await evaluateCalculatedFields(channel.id, processedData);

  const timestamp = rawData.created_at || rawData.timestamp ? new Date(rawData.created_at || rawData.timestamp) : new Date();

  const insertRes = await db.run(`
    INSERT INTO telemetry_data (channel_id, device_id, data_json, timestamp)
    VALUES ($1, $2, $3, $4)
  `, [channel.id, device?.id || null, JSON.stringify(processedData), timestamp]);

  if (device) {
    const battery = rawData.battery || rawData.battery_level;
    const wifi = rawData.wifi_rssi || rawData.rssi;
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

  return processedData;
}

// 1. ThingSpeak GET /update endpoint (e.g. GET /update?api_key=KEY&field1=0)
router.get("/update", async (req, res) => {
  const apiKey =
    req.query.api_key ||
    req.query.key ||
    req.query.write_api_key ||
    req.headers["x-api-key"] ||
    req.headers["api_key"];

  const channelIdNum = req.query.channel_id || req.query.channel_number;

  let channel = null;
  if (apiKey) {
    channel = await db.get("SELECT * FROM channels WHERE api_write_key = $1", [apiKey]);
  }
  if (!channel && channelIdNum) {
    channel = await db.get(
      "SELECT * FROM channels WHERE channel_number = $1 OR id = $2",
      [isNaN(Number(channelIdNum)) ? -1 : Number(channelIdNum), String(channelIdNum)]
    );
  }

  if (!channel) {
    return res.status(404).send("0");
  }

  try {
    await processAndStoreTelemetry(channel, null, req.query);
    const countRow = await db.get("SELECT COUNT(*) as count FROM telemetry_data WHERE channel_id = $1", [channel.id]);

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(String(countRow?.count || 1));
  } catch (err) {

    return res.status(500).send("0");
  }
});

// 2. ThingSpeak POST /update (and root POST /) endpoint
router.post(["/update", "/"], async (req, res) => {
  let bodyObj = req.body;

  // Handle raw string body (JSON string or form-urlencoded string)
  if (typeof bodyObj === "string") {
    const trimmed = bodyObj.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        bodyObj = JSON.parse(trimmed);
      } catch (e) {}
    } else {
      try {
        bodyObj = Object.fromEntries(new URLSearchParams(trimmed));
      } catch (e) {}
    }
  }

  if (!bodyObj || typeof bodyObj !== "object") {
    bodyObj = {};
  }

  const payload = { ...req.query, ...bodyObj };

  const apiKey =
    payload.api_key ||
    payload.key ||
    payload.write_api_key ||
    req.headers["x-api-key"] ||
    req.headers["api_key"] ||
    req.headers["authorization"]?.replace("Bearer ", "");

  const channelIdNum = payload.channel_id || payload.channel_number;

  let channel = null;
  if (apiKey) {
    channel = await db.get("SELECT * FROM channels WHERE api_write_key = $1", [apiKey]);
  }

  // Fallback: If not found by apiKey but channel_id is provided, look up by channel number
  if (!channel && channelIdNum) {
    channel = await db.get(
      "SELECT * FROM channels WHERE channel_number = $1 OR id = $2",
      [isNaN(Number(channelIdNum)) ? -1 : Number(channelIdNum), String(channelIdNum)]
    );
  }

  if (!channel) {
    console.warn("⚠️ [Update Endpoint] Channel not found for payload:", payload);
    return res.status(404).send("0");
  }

  try {
    await processAndStoreTelemetry(channel, null, payload);
    const countRow = await db.get("SELECT COUNT(*) as count FROM telemetry_data WHERE channel_id = $1", [channel.id]);
    const entryId = String(countRow?.count || 1);

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(entryId);
  } catch (err) {
    console.error("❌ [Update Endpoint Error]:", err);

    return res.status(500).send("0");
  }
});

// 3. Unified Ingest Endpoint (POST /api/data)
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
  }

  if (!channel && apiKey) {
    channel = await db.get("SELECT * FROM channels WHERE api_write_key = $1", [apiKey]);
  }

  // Fallback: If device exists but channel_id is not yet set, link to the owner's primary channel
  if (!channel && device && device.user_id) {
    channel = await db.get("SELECT * FROM channels WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [device.user_id]);
    if (channel) {
      await db.run("UPDATE devices SET channel_id = $1 WHERE id = $2", [channel.id, device.id]);
    }
  }

  if (!channel) {
    return res.status(404).json({ error: "Device or Channel not found or not mapped." });
  }

  const processedData = await processAndStoreTelemetry(channel, device, payload);

  res.status(200).json({
    success: true,
    message: "Telemetry ingested successfully into Neon Cloud",
    channel_id: channel.id,
    processed_fields: Object.keys(processedData)
  });
});

// 4. ThingSpeak Read Feed: GET /channels/:id/feeds.json
router.get(["/channels/:id/feeds.json", "/channel/:id/feeds.json"], async (req, res) => {
  const channelId = req.params.id;
  const { api_key, results = 50 } = req.query;

  // Find channel by UUID or channel_number
  const channel = await db.get(
    "SELECT * FROM channels WHERE id = $1 OR channel_number::text = $1",
    [channelId]
  );

  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  // Check read key if private
  if (!channel.is_public && channel.sharing_mode !== "everyone") {
    const isReadKey = await db.get(
      "SELECT id FROM channel_read_keys WHERE channel_id = $1 AND api_key = $2",
      [channel.id, api_key]
    );
    if (!isReadKey && channel.api_read_key !== api_key && channel.api_write_key !== api_key) {
      return res.status(401).json({ error: "Invalid Read API Key for private channel." });
    }
  }

  const limit = Math.min(parseInt(results) || 50, 1000);
  const rows = await db.all(
    "SELECT id, timestamp, data_json FROM telemetry_data WHERE channel_id = $1 ORDER BY id DESC LIMIT $2",
    [channel.id, limit]
  );

  const fields = await db.all(
    "SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC",
    [channel.id]
  );

  const fieldInfo = {};
  fields.forEach((f, idx) => {
    fieldInfo[`field${idx + 1}`] = f.name;
  });

  const feeds = rows.reverse().map((r, i) => {
    let parsed = {};
    try {
      parsed = typeof r.data_json === "string" ? JSON.parse(r.data_json) : r.data_json;
    } catch (e) {}

    const feedObj = {
      created_at: new Date(r.timestamp).toISOString(),
      entry_id: i + 1
    };

    fields.forEach((f, idx) => {
      const fKey = `field${idx + 1}`;
      feedObj[fKey] = parsed[f.field_key] !== undefined ? String(parsed[f.field_key]) : (parsed[fKey] !== undefined ? String(parsed[fKey]) : null);
    });

    return feedObj;
  });

  res.json({
    channel: {
      id: channel.channel_number || channel.id,
      name: channel.name,
      description: channel.description,
      latitude: String(channel.latitude || 0.0),
      longitude: String(channel.longitude || 0.0),
      created_at: channel.created_at,
      updated_at: channel.updated_at,
      last_entry_id: feeds.length,
      ...fieldInfo
    },
    feeds
  });
});

// 5. ThingSpeak Read Single Field: GET /channels/:id/fields/:fieldNum.json or /field/:fieldNum.json
router.get([
  "/channels/:id/fields/:fieldNum.json",
  "/channels/:id/field/:fieldNum.json",
  "/channel/:id/fields/:fieldNum.json",
  "/channel/:id/field/:fieldNum.json"
], async (req, res) => {
  const channelId = req.params.id;
  const fieldNum = parseInt(req.params.fieldNum) || 1;
  const { api_key, results = 50 } = req.query;

  const channel = await db.get(
    "SELECT * FROM channels WHERE id = $1 OR channel_number::text = $1",
    [channelId]
  );

  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  const limit = Math.min(parseInt(results) || 50, 1000);
  const rows = await db.all(
    "SELECT id, timestamp, data_json FROM telemetry_data WHERE channel_id = $1 ORDER BY id DESC LIMIT $2",
    [channel.id, limit]
  );

  const fields = await db.all(
    "SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC",
    [channel.id]
  );

  const targetField = fields[fieldNum - 1] || { name: `Field Label ${fieldNum}`, field_key: `field${fieldNum}` };
  const targetKey = `field${fieldNum}`;

  const feeds = rows.reverse().map((r, i) => {
    let parsed = {};
    try {
      parsed = typeof r.data_json === "string" ? JSON.parse(r.data_json) : r.data_json;
    } catch (e) {}

    const val = parsed[targetField.field_key] !== undefined ? String(parsed[targetField.field_key]) : (parsed[targetKey] !== undefined ? String(parsed[targetKey]) : null);

    return {
      created_at: new Date(r.timestamp).toISOString(),
      entry_id: i + 1,
      [targetKey]: val
    };
  });

  res.json({
    channel: {
      id: channel.channel_number || channel.id,
      name: channel.name,
      description: channel.description,
      [targetKey]: targetField.name,
      last_entry_id: feeds.length
    },
    feeds
  });
});

// 6. ThingSpeak Read Channel Status: GET /channels/:id/status.json
router.get(["/channels/:id/status.json", "/channel/:id/status.json"], async (req, res) => {
  const channelId = req.params.id;
  const channel = await db.get(
    "SELECT * FROM channels WHERE id = $1 OR channel_number::text = $1",
    [channelId]
  );

  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  const latest = await db.get(
    "SELECT * FROM telemetry_data WHERE channel_id = $1 ORDER BY id DESC LIMIT 1",
    [channel.id]
  );

  res.json({
    channel: {
      id: channel.channel_number || channel.id,
      name: channel.name,
      description: channel.description,
      status: channel.show_status ? "Active" : "Normal",
      last_updated: latest?.timestamp || channel.updated_at
    },
    feeds: [
      {
        created_at: latest?.timestamp || new Date().toISOString(),
        status: channel.show_status ? "Operational" : "OK"
      }
    ]
  });
});

// 7. CSV Import Endpoint: POST /channels/:id/import-csv
router.post("/channel/:channelId/import-csv", async (req, res) => {
  const { channelId } = req.params;
  const { csv_data, timezone } = req.body;

  if (!csv_data || typeof csv_data !== "string") {
    return res.status(400).json({ error: "CSV data string is required." });
  }

  const channel = await db.get("SELECT * FROM channels WHERE id = $1", [channelId]);
  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  const lines = csv_data.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return res.status(400).json({ error: "CSV file must contain a header and at least one data row." });
  }

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : "";
    });

    const timestamp = rowObj.created_at || rowObj.timestamp ? new Date(rowObj.created_at || rowObj.timestamp) : new Date();

    const dataObj = {};
    for (const [k, v] of Object.entries(rowObj)) {
      if (!["created_at", "timestamp", "entry_id"].includes(k) && v !== "") {
        dataObj[k] = isNaN(Number(v)) ? v : Number(v);
      }
    }

    await db.run(
      "INSERT INTO telemetry_data (channel_id, data_json, timestamp) VALUES ($1, $2, $3)",
      [channel.id, JSON.stringify(dataObj), timestamp]
    );
    importedCount++;
  }

  wsHub.broadcastTelemetry(channel.id, { _imported: true });

  res.status(200).json({
    message: `Successfully imported ${importedCount} records into channel.`,
    importedCount
  });
});

// 8. Historical Telemetry for Dashboards
router.get("/channel/:channelId/historical", async (req, res) => {
  const { range = "24h" } = req.query;
  const channelId = req.params.channelId;

  let intervalStr = "24 hours";
  if (range === "7d") intervalStr = "7 days";
  else if (range === "30d") intervalStr = "30 days";
  else if (range === "1h") intervalStr = "1 hour";
  else if (range === "6h") intervalStr = "6 hours";

  const rows = await db.all(`
    SELECT id, timestamp, data_json 
    FROM telemetry_data 
    WHERE channel_id = $1 AND timestamp >= NOW() - ($2::interval)
    ORDER BY timestamp ASC
  `, [channelId, intervalStr]);

  res.json({ channelId, range, count: rows.length, data: rows });
});

// 9. Data Export (CSV & JSON)
router.get("/channel/:channelId/export", async (req, res) => {
  const { format = "json", range = "30d", timezone = "UTC" } = req.query;
  const channelId = req.params.channelId;

  const channel = await db.get("SELECT * FROM channels WHERE id = $1", [channelId]);
  const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [channelId]);

  const rows = await db.all(
    "SELECT id, timestamp, data_json FROM telemetry_data WHERE channel_id = $1 ORDER BY timestamp ASC",
    [channelId]
  );

  const flatData = rows.map((r, idx) => {
    let parsed = {};
    try {
      parsed = typeof r.data_json === "string" ? JSON.parse(r.data_json) : r.data_json;
    } catch (e) {}

    const rowObj = {
      created_at: new Date(r.timestamp).toISOString(),
      entry_id: idx + 1
    };

    fields.forEach((f, fIdx) => {
      const fieldKey = `field${fIdx + 1}`;
      rowObj[fieldKey] = parsed[f.field_key] !== undefined ? parsed[f.field_key] : (parsed[fieldKey] !== undefined ? parsed[fieldKey] : "");
    });

    if (channel?.latitude) rowObj.latitude = channel.latitude;
    if (channel?.longitude) rowObj.longitude = channel.longitude;
    if (channel?.elevation) rowObj.elevation = channel.elevation;

    return rowObj;
  });

  if (format === "csv") {
    if (flatData.length === 0) {
      const header = ["created_at", "entry_id", ...fields.map((_, i) => `field${i + 1}`)].join(",");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="channel_${channel?.channel_number || channelId}.csv"`);
      return res.status(200).send(header + "\n");
    }

    const allKeys = Array.from(new Set(flatData.flatMap(Object.keys)));
    const header = allKeys.join(",");
    const csvRows = flatData.map(row => {
      return allKeys.map(k => (row[k] !== undefined ? `"${row[k]}"` : "")).join(",");
    });

    const csvContent = [header, ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="channel_${channel?.channel_number || channelId}.csv"`);
    return res.send(csvContent);
  }

  if (format === "xlsx" || format === "excel") {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Telemetry Feeds");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="channel_${channel?.channel_number || channelId}_data.xlsx"`
    );
    return res.send(buffer);
  }

  res.json({
    channelId,
    exportedAt: new Date().toISOString(),
    totalRecords: flatData.length,
    data: flatData
  });
});

export default router;
