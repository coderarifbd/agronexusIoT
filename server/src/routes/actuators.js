import express from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { wsHub } from "../services/websocket.js";

const router = express.Router();

router.get("/channel/:channelId", authenticateToken, async (req, res) => {
  const actuators = await db.all("SELECT * FROM actuators WHERE channel_id = $1", [req.params.channelId]);
  res.json({ actuators });
});

router.post("/", authenticateToken, async (req, res) => {
  const { channel_id, device_id, name, actuator_key, actuator_type, icon } = req.body;
  if (!channel_id || !name || !actuator_key) {
    return res.status(400).json({ error: "Channel ID, Name, and Actuator Key are required." });
  }

  const id = uuidv4();
  await db.run(`
    INSERT INTO actuators (id, channel_id, device_id, name, actuator_key, actuator_type, state, icon)
    VALUES ($1, $2, $3, $4, $5, $6, '0', $7)
  `, [id, channel_id, device_id || null, name, actuator_key, actuator_type || "switch", icon || "power"]);

  const created = await db.get("SELECT * FROM actuators WHERE id = $1", [id]);
  res.status(201).json({ message: "Actuator added.", actuator: created });
});

router.post("/:id/control", authenticateToken, async (req, res) => {
  const { state } = req.body;
  const actuatorId = req.params.id;

  const actuator = await db.get(`
    SELECT a.*, c.project_id, p.user_id 
    FROM actuators a
    JOIN channels c ON a.channel_id = c.id
    JOIN projects p ON c.project_id = p.id
    WHERE a.id = $1
  `, [actuatorId]);

  if (!actuator) {
    return res.status(404).json({ error: "Actuator not found." });
  }

  const newState = String(state);
  await db.run("UPDATE actuators SET state = $1, updated_at = NOW() WHERE id = $2", [newState, actuatorId]);

  wsHub.broadcastActuatorChange(actuator.channel_id, actuatorId, newState, actuator.name);

  const logId = uuidv4();
  const stateLabel = newState === "1" ? "ON" : newState === "0" ? "OFF" : newState;
  const description = `User manually turned ${actuator.name} ${stateLabel}`;

  await db.run(`
    INSERT INTO activity_logs (id, user_id, channel_id, device_id, event_type, description)
    VALUES ($1, $2, $3, $4, 'ACTUATOR_MANUAL', $5)
  `, [logId, req.user.id, actuator.channel_id, actuator.device_id, description]);

  wsHub.broadcastActivityLog({
    id: logId,
    user_id: req.user.id,
    channel_id: actuator.channel_id,
    event_type: "ACTUATOR_MANUAL",
    description,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    actuator_id: actuatorId,
    name: actuator.name,
    state: newState
  });
});

router.delete("/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM actuators WHERE id = $1", [req.params.id]);
  res.json({ message: "Actuator removed." });
});

export default router;
