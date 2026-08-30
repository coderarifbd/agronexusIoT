import express from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { db } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { computeCalibrationLinearFit } from "../services/calibrationEngine.js";

const router = express.Router();

function generateApiKey(prefix = "AGX_KEY") {
  return `${prefix}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

// Get all channels
router.get("/project/:projectId", authenticateToken, async (req, res) => {
  const channels = await db.all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM channel_fields WHERE channel_id = c.id) as field_count,
      (SELECT COUNT(*) FROM devices WHERE channel_id = c.id) as device_count,
      (SELECT COUNT(*) FROM actuators WHERE channel_id = c.id) as actuator_count
    FROM channels c
    WHERE c.project_id = $1
    ORDER BY c.channel_number ASC
  `, [req.params.projectId]);

  res.json({ channels });
});

// Create Channel
router.post("/", authenticateToken, async (req, res) => {
  const { project_id, name, description, is_public, public_slug } = req.body;

  if (!project_id || !name) {
    return res.status(400).json({ error: "Project ID and Channel name are required." });
  }

  const countRow = await db.get("SELECT MAX(channel_number) as max_num FROM channels WHERE project_id = $1", [project_id]);
  const channelNumber = (countRow?.max_num || 0) + 1;

  const id = uuidv4();
  const writeKey = generateApiKey("AGX_WR");
  const readKey = generateApiKey("AGX_RD");
  const slug = public_slug || `ch-${crypto.randomBytes(4).toString("hex")}`;

  await db.run(`
    INSERT INTO channels (id, project_id, name, description, channel_number, api_write_key, api_read_key, is_public, public_slug)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [id, project_id, name, description || "", channelNumber, writeKey, readKey, is_public ? 1 : 0, slug]);

  const f1 = uuidv4();
  const f2 = uuidv4();
  await db.run(`
    INSERT INTO channel_fields (id, channel_id, field_key, name, unit, icon, color, field_order)
    VALUES ($1, $2, 'temperature', 'Temperature', '?C', 'thermometer', '#EF4444', 1),
           ($3, $4, 'humidity', 'Humidity', '%', 'droplet', '#3B82F6', 2)
  `, [f1, id, f2, id]);

  const created = await db.get("SELECT * FROM channels WHERE id = $1", [id]);
  res.status(201).json({ message: "Channel created successfully.", channel: created });
});

// Get Channel by ID
router.get("/:id", authenticateToken, async (req, res) => {
  const channel = await db.get(`
    SELECT c.*, p.name as project_name, p.user_id as owner_id
    FROM channels c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = $1
  `, [req.params.id]);

  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [channel.id]);
  const calculatedFields = await db.all("SELECT * FROM calculated_fields WHERE channel_id = $1", [channel.id]);
  const calibrations = await db.all("SELECT * FROM sensor_calibrations WHERE channel_id = $1", [channel.id]);
  const actuators = await db.all("SELECT * FROM actuators WHERE channel_id = $1", [channel.id]);
  const devices = await db.all("SELECT * FROM devices WHERE channel_id = $1", [channel.id]);
  const widgets = await db.all("SELECT * FROM dashboard_widgets WHERE channel_id = $1 ORDER BY grid_y ASC, grid_x ASC", [channel.id]);

  const latestTelemetry = await db.get("SELECT * FROM telemetry_data WHERE channel_id = $1 ORDER BY id DESC LIMIT 1", [channel.id]);

  let currentValues = {};
  if (latestTelemetry) {
    try {
      currentValues = typeof latestTelemetry.data_json === "string" ? JSON.parse(latestTelemetry.data_json) : latestTelemetry.data_json;
    } catch (e) {}
  }

  res.json({
    channel,
    fields,
    calculatedFields,
    calibrations,
    actuators,
    devices,
    widgets,
    currentValues,
    lastUpdate: latestTelemetry?.timestamp || null
  });
});

// Update Channel Settings
router.put("/:id", authenticateToken, async (req, res) => {
  const { name, description, is_public, public_slug } = req.body;
  await db.run(`
    UPDATE channels 
    SET name = COALESCE($1, name), description = COALESCE($2, description),
        is_public = COALESCE($3, is_public), public_slug = COALESCE($4, public_slug), updated_at = NOW()
    WHERE id = $5
  `, [name, description, is_public !== undefined ? (is_public ? 1 : 0) : null, public_slug, req.params.id]);

  const updated = await db.get("SELECT * FROM channels WHERE id = $1", [req.params.id]);
  res.json({ message: "Channel updated.", channel: updated });
});

// Regenerate API Keys
router.post("/:id/regenerate-keys", authenticateToken, async (req, res) => {
  const writeKey = generateApiKey("AGX_WR");
  const readKey = generateApiKey("AGX_RD");
  await db.run("UPDATE channels SET api_write_key = $1, api_read_key = $2, updated_at = NOW() WHERE id = $3", [writeKey, readKey, req.params.id]);
  res.json({ message: "API keys regenerated.", api_write_key: writeKey, api_read_key: readKey });
});

// Delete Channel
router.delete("/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM channels WHERE id = $1", [req.params.id]);
  res.json({ message: "Channel deleted." });
});

// Dynamic Sensor Fields
router.post("/:id/fields", authenticateToken, async (req, res) => {
  const { field_key, name, unit, icon, min_value, max_value, color } = req.body;
  if (!field_key || !name) {
    return res.status(400).json({ error: "Field key (e.g. temperature) and Display Name are required." });
  }

  const cleanKey = field_key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const id = uuidv4();

  const countRow = await db.get("SELECT MAX(field_order) as max_ord FROM channel_fields WHERE channel_id = $1", [req.params.id]);
  const nextOrder = (countRow?.max_ord || 0) + 1;

  try {
    await db.run(`
      INSERT INTO channel_fields (id, channel_id, field_key, name, unit, icon, min_value, max_value, color, field_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [id, req.params.id, cleanKey, name, unit || "", icon || "activity", min_value || 0, max_value || 100, color || "#3B82F6", nextOrder]);

    const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [req.params.id]);
    res.status(201).json({ message: "Dynamic field added.", fields });
  } catch (err) {
    res.status(400).json({ error: "Field key already exists in this channel." });
  }
});

router.put("/:id/fields/:fieldId", authenticateToken, async (req, res) => {
  const { name, unit, icon, min_value, max_value, color } = req.body;
  await db.run(`
    UPDATE channel_fields 
    SET name = COALESCE($1, name), unit = COALESCE($2, unit), icon = COALESCE($3, icon),
        min_value = COALESCE($4, min_value), max_value = COALESCE($5, max_value), color = COALESCE($6, color)
    WHERE id = $7 AND channel_id = $8
  `, [name, unit, icon, min_value, max_value, color, req.params.fieldId, req.params.id]);

  const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [req.params.id]);
  res.json({ message: "Field updated.", fields });
});

router.delete("/:id/fields/:fieldId", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM channel_fields WHERE id = $1 AND channel_id = $2", [req.params.fieldId, req.params.id]);
  const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [req.params.id]);
  res.json({ message: "Field deleted.", fields });
});

// Calculated Fields
router.post("/:id/calculated-fields", authenticateToken, async (req, res) => {
  const { name, target_field_key, formula, unit } = req.body;
  if (!name || !target_field_key || !formula) {
    return res.status(400).json({ error: "Name, target field key, and mathematical formula are required." });
  }

  const id = uuidv4();
  await db.run(`
    INSERT INTO calculated_fields (id, channel_id, name, target_field_key, formula, unit, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, 1)
  `, [id, req.params.id, name, target_field_key, formula, unit || ""]);

  const calculatedFields = await db.all("SELECT * FROM calculated_fields WHERE channel_id = $1", [req.params.id]);
  res.status(201).json({ message: "Calculated field configured.", calculatedFields });
});

router.delete("/:id/calculated-fields/:calcId", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM calculated_fields WHERE id = $1 AND channel_id = $2", [req.params.calcId, req.params.id]);
  const calculatedFields = await db.all("SELECT * FROM calculated_fields WHERE channel_id = $1", [req.params.id]);
  res.json({ message: "Calculated field removed.", calculatedFields });
});

// Sensor Calibration
router.post("/:id/calibrations", authenticateToken, async (req, res) => {
  const { field_key, points } = req.body;
  if (!field_key || !points || points.length < 2) {
    return res.status(400).json({ error: "Field key and at least 2 calibration points required." });
  }

  const { slope, intercept } = computeCalibrationLinearFit(points);
  const id = uuidv4();

  await db.run(`
    INSERT INTO sensor_calibrations (id, channel_id, field_key, points_json, slope, intercept, is_active, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 1, NOW())
    ON CONFLICT(channel_id, field_key) DO UPDATE SET
      points_json = EXCLUDED.points_json,
      slope = EXCLUDED.slope,
      intercept = EXCLUDED.intercept,
      is_active = 1,
      updated_at = NOW()
  `, [id, req.params.id, field_key, JSON.stringify(points), slope, intercept]);

  const calibrations = await db.all("SELECT * FROM sensor_calibrations WHERE channel_id = $1", [req.params.id]);
  res.json({
    message: `Calibration computed: y = ${slope} * x + (${intercept})`,
    slope,
    intercept,
    calibrations
  });
});

export default router;
