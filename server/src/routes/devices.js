import express from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { db } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

function generateDeviceKey(prefix = "AGX_DEV") {
  return `${prefix}_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

// Get all devices for user
router.get("/", authenticateToken, async (req, res) => {
  const devices = await db.all(`
    SELECT d.*, c.name as channel_name, p.name as project_name
    FROM devices d
    LEFT JOIN channels c ON d.channel_id = c.id
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE d.user_id = $1
    ORDER BY d.created_at DESC
  `, [req.user.id]);

  res.json({ devices });
});

// Register new Device
router.post("/", authenticateToken, async (req, res) => {
  const { name, device_type, channel_id, location_name, latitude, longitude } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Device name is required." });
  }

  const id = uuidv4();
  const countRow = await db.get("SELECT COUNT(*) as count FROM devices");
  const nextNum = String(parseInt(countRow?.count || "0", 10) + 1).padStart(3, "0");
  const typeStr = (device_type || "ESP32").toUpperCase();
  const deviceIdCode = `${typeStr}-${nextNum}`;

  const apiKey = generateDeviceKey();
  const secret = `sec_${crypto.randomBytes(12).toString("hex")}`;

  await db.run(`
    INSERT INTO devices (
      id, user_id, channel_id, device_id_code, name, device_type, api_key, device_secret,
      status, last_seen, ip_address, wifi_rssi, firmware_version, battery_level, latitude, longitude, location_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'online', NOW(), '192.168.1.120', -60, 'v1.0.0', 100.0, $9, $10, $11)
  `, [
    id, req.user.id, channel_id || null, deviceIdCode, name, device_type || "ESP32",
    apiKey, secret, latitude || 23.8103, longitude || 90.4125, location_name || "Primary Station"
  ]);

  const device = await db.get("SELECT * FROM devices WHERE id = $1", [id]);
  res.status(201).json({ message: "Device registered.", device });
});

// Update Device
router.put("/:id", authenticateToken, async (req, res) => {
  const { name, channel_id, location_name, latitude, longitude, firmware_version } = req.body;
  await db.run(`
    UPDATE devices 
    SET name = COALESCE($1, name), channel_id = COALESCE($2, channel_id),
        location_name = COALESCE($3, location_name), latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude), firmware_version = COALESCE($6, firmware_version),
        updated_at = NOW()
    WHERE id = $7 AND user_id = $8
  `, [name, channel_id, location_name, latitude, longitude, firmware_version, req.params.id, req.user.id]);

  const updated = await db.get("SELECT * FROM devices WHERE id = $1", [req.params.id]);
  res.json({ message: "Device updated.", device: updated });
});

// Regenerate Device Secret / Key
router.post("/:id/regenerate-key", authenticateToken, async (req, res) => {
  const apiKey = generateDeviceKey();
  const secret = `sec_${crypto.randomBytes(12).toString("hex")}`;
  await db.run("UPDATE devices SET api_key = $1, device_secret = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4", [apiKey, secret, req.params.id, req.user.id]);

  res.json({ message: "Device credentials refreshed.", api_key: apiKey, device_secret: secret });
});

// Delete Device
router.delete("/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM devices WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ message: "Device deleted." });
});

export default router;
