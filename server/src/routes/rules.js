import express from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/channel/:channelId", authenticateToken, async (req, res) => {
  const rules = await db.all("SELECT * FROM automation_rules WHERE channel_id = $1", [req.params.channelId]);
  const scheduled = await db.all(`
    SELECT s.*, a.name as actuator_name 
    FROM scheduled_rules s
    LEFT JOIN actuators a ON s.target_actuator_id = a.id
    WHERE s.channel_id = $1
  `, [req.params.channelId]);

  res.json({ rules, scheduled });
});

router.post("/", authenticateToken, async (req, res) => {
  const { channel_id, name, description, conditions, actions } = req.body;
  if (!channel_id || !name || !conditions || !actions) {
    return res.status(400).json({ error: "Channel ID, Name, Conditions, and Actions are required." });
  }

  const id = uuidv4();
  await db.run(`
    INSERT INTO automation_rules (id, channel_id, name, description, conditions_json, actions_json, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, 1)
  `, [id, channel_id, name, description || "", JSON.stringify(conditions), JSON.stringify(actions)]);

  const created = await db.get("SELECT * FROM automation_rules WHERE id = $1", [id]);
  res.status(201).json({ message: "Automation Rule created.", rule: created });
});

router.put("/:id/toggle", authenticateToken, async (req, res) => {
  const rule = await db.get("SELECT is_active FROM automation_rules WHERE id = $1", [req.params.id]);
  if (!rule) return res.status(404).json({ error: "Rule not found." });

  const nextState = rule.is_active ? 0 : 1;
  await db.run("UPDATE automation_rules SET is_active = $1 WHERE id = $2", [nextState, req.params.id]);

  res.json({ success: true, is_active: nextState });
});

router.delete("/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM automation_rules WHERE id = $1", [req.params.id]);
  res.json({ message: "Rule deleted." });
});

router.post("/scheduled", authenticateToken, async (req, res) => {
  const { channel_id, name, time_schedule, days_of_week, target_actuator_id, target_value } = req.body;
  if (!channel_id || !name || !time_schedule || !target_actuator_id) {
    return res.status(400).json({ error: "Channel ID, Name, Time Schedule (HH:MM), and Actuator are required." });
  }

  const id = uuidv4();
  await db.run(`
    INSERT INTO scheduled_rules (id, channel_id, name, time_schedule, days_of_week, action_type, target_actuator_id, target_value, is_active)
    VALUES ($1, $2, $3, $4, $5, 'ACTUATOR', $6, $7, 1)
  `, [id, channel_id, name, time_schedule, days_of_week || "ALL", target_actuator_id, String(target_value || "1")]);

  const created = await db.get("SELECT * FROM scheduled_rules WHERE id = $1", [id]);
  res.status(201).json({ message: "Scheduled Automation created.", scheduled: created });
});

router.delete("/scheduled/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM scheduled_rules WHERE id = $1", [req.params.id]);
  res.json({ message: "Scheduled rule deleted." });
});

export default router;
