import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/channel/:channelId/widgets", authenticateToken, async (req, res) => {
  const widgets = await db.all("SELECT * FROM dashboard_widgets WHERE channel_id = $1 ORDER BY grid_y ASC, grid_x ASC", [req.params.channelId]);
  res.json({ widgets });
});

router.post("/channel/:channelId/widgets", authenticateToken, async (req, res) => {
  const { title, widget_type, field_key, chart_type, config, grid_x, grid_y, grid_w, grid_h } = req.body;
  if (!title || !widget_type) {
    return res.status(400).json({ error: "Title and Widget Type are required." });
  }

  const id = uuidv4();
  await db.run(`
    INSERT INTO dashboard_widgets (id, channel_id, title, widget_type, field_key, chart_type, config_json, grid_x, grid_y, grid_w, grid_h)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    id, req.params.channelId, title, widget_type, field_key || "temperature",
    chart_type || "line", JSON.stringify(config || {}), grid_x || 0, grid_y || 0, grid_w || 6, grid_h || 4
  ]);

  const created = await db.get("SELECT * FROM dashboard_widgets WHERE id = $1", [id]);
  res.status(201).json({ message: "Widget added to dashboard.", widget: created });
});

router.delete("/widgets/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM dashboard_widgets WHERE id = $1", [req.params.id]);
  res.json({ message: "Widget removed." });
});

router.get("/public/:slug", async (req, res) => {
  const { password } = req.query;
  const channel = await db.get(`
    SELECT c.*, p.name as project_name, u.name as owner_name, u.user_id_code
    FROM channels c
    JOIN projects p ON c.project_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE c.public_slug = $1 OR c.id = $1
  `, [req.params.slug]);

  if (!channel) {
    return res.status(404).json({ error: "Dashboard not found." });
  }

  if (!channel.is_public) {
    return res.status(403).json({ error: "This dashboard is configured as Private by its owner." });
  }

  if (channel.public_password_hash) {
    if (!password || !bcrypt.compareSync(password, channel.public_password_hash)) {
      return res.status(401).json({ error: "This public dashboard is password protected.", requiresPassword: true });
    }
  }

  const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [channel.id]);
  const widgets = await db.all("SELECT * FROM dashboard_widgets WHERE channel_id = $1 ORDER BY grid_y ASC, grid_x ASC", [channel.id]);
  const actuators = await db.all("SELECT id, name, state, icon, actuator_type FROM actuators WHERE channel_id = $1", [channel.id]);
  
  const telemetry = await db.all(`
    SELECT data_json, timestamp 
    FROM telemetry_data 
    WHERE channel_id = $1 
    ORDER BY timestamp ASC LIMIT 50
  `, [channel.id]);

  const flatTelemetry = telemetry.map(t => {
    try {
      const parsed = typeof t.data_json === "string" ? JSON.parse(t.data_json) : t.data_json;
      return { timestamp: t.timestamp, ...parsed };
    } catch (e) {
      return { timestamp: t.timestamp };
    }
  });

  const latestRow = flatTelemetry[flatTelemetry.length - 1] || {};

  res.json({
    channel: {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      channel_number: channel.channel_number,
      project_name: channel.project_name,
      owner_name: channel.owner_name,
      user_id_code: channel.user_id_code,
      api_read_key: channel.api_read_key
    },
    fields,
    widgets,
    actuators,
    currentValues: latestRow,
    telemetryHistory: flatTelemetry
  });
});

export default router;
