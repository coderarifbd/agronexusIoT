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

// Get all accessible channels across all projects for current user
router.get("/my/all", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email || "";

  const channels = await db.all(`
    SELECT c.*, p.name as project_name, COALESCE(c.user_id, p.user_id) as owner_id
    FROM channels c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE (c.user_id = $1 OR p.user_id = $1)
       OR EXISTS (SELECT 1 FROM channel_shares cs WHERE cs.channel_id = c.id AND LOWER(cs.user_email) = LOWER($2))
       OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND LOWER(pm.user_email) = LOWER($2))
    ORDER BY c.channel_number ASC
  `, [userId, userEmail]);

  res.json({ channels });
});

// Get all channels by project (only if user has access to project or channel)
router.get("/project/:projectId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email || "";

  const channels = await db.all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM channel_fields WHERE channel_id = c.id) as field_count,
      (SELECT COUNT(*) FROM devices WHERE channel_id = c.id) as device_count,
      (SELECT COUNT(*) FROM actuators WHERE channel_id = c.id) as actuator_count
    FROM channels c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.project_id = $1
      AND (
        c.user_id = $2 OR p.user_id = $2
        OR EXISTS (SELECT 1 FROM channel_shares cs WHERE cs.channel_id = c.id AND LOWER(cs.user_email) = LOWER($3))
        OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND LOWER(pm.user_email) = LOWER($3))
      )
    ORDER BY c.channel_number ASC
  `, [req.params.projectId, userId, userEmail]);

  res.json({ channels });
});

// Create Channel (strict user isolation & ownership)
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email || "";
  let {
    project_id,
    name,
    description,
    is_public,
    public_slug,
    metadata,
    tags,
    external_url,
    github_url,
    elevation,
    latitude,
    longitude,
    show_location,
    video_type,
    video_url,
    show_video,
    show_status,
    fields
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Channel name is required." });
  }

  // Ensure project_id belongs to current user or fallback to user's own project
  if (!project_id) {
    let userProj = await db.get("SELECT id FROM projects WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [userId]);
    if (!userProj) {
      const newProjId = uuidv4();
      await db.run("INSERT INTO projects (id, user_id, name, description) VALUES ($1, $2, $3, $4)",
        [newProjId, userId, "Default IoT Project", "Primary Project for Channels"]);
      userProj = { id: newProjId };
    }
    project_id = userProj.id;
  } else {
    const projCheck = await db.get(`
      SELECT id FROM projects WHERE id = $1 AND (user_id = $2 OR EXISTS (SELECT 1 FROM project_members WHERE project_id = $1 AND LOWER(user_email) = LOWER($3)))
    `, [project_id, userId, userEmail]);

    if (!projCheck) {
      let userProj = await db.get("SELECT id FROM projects WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [userId]);
      if (!userProj) {
        const newProjId = uuidv4();
        await db.run("INSERT INTO projects (id, user_id, name, description) VALUES ($1, $2, $3, $4)",
          [newProjId, userId, "Default IoT Project", "Primary Project for Channels"]);
        userProj = { id: newProjId };
      }
      project_id = userProj.id;
    }
  }

  // Generate unique 7-digit channel number like ThingSpeak (e.g. 3470001, 3470002, 3477622)
  const countRow = await db.get("SELECT MAX(channel_number) as max_num FROM channels");
  const channelNumber = (countRow?.max_num && countRow.max_num >= 3470000) ? (countRow.max_num + 1) : 3470001;

  const id = uuidv4();
  const writeKey = generateApiKey("AGX_WR");
  const readKey = generateApiKey("AGX_RD");
  const slug = public_slug || `ch-${crypto.randomBytes(4).toString("hex")}`;

  await db.run(`
    INSERT INTO channels (
      id, project_id, user_id, name, description, channel_number, api_write_key, api_read_key, is_public, public_slug,
      metadata, tags, external_url, github_url, elevation, latitude, longitude, show_location,
      video_type, video_url, show_video, show_status, sharing_mode
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
  `, [
    id,
    project_id,
    userId,
    name.trim(),
    description || "",
    channelNumber,
    writeKey,
    readKey,
    is_public ? 1 : 0,
    slug,
    metadata || "",
    tags || "",
    external_url || "",
    github_url || "",
    elevation || "",
    latitude ? parseFloat(latitude) : null,
    longitude ? parseFloat(longitude) : null,
    show_location ? 1 : 0,
    video_type || "youtube",
    video_url || "",
    show_video ? 1 : 0,
    show_status ? 1 : 0,
    is_public ? "everyone" : "private"
  ]);

  // Insert initial read key into channel_read_keys
  await db.run(
    "INSERT INTO channel_read_keys (id, channel_id, api_key, note) VALUES ($1, $2, $3, $4)",
    [uuidv4(), id, readKey, "Default Read API Key"]
  );

  // Insert configured fields
  if (Array.isArray(fields) && fields.length > 0) {
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f && f.name) {
        const fieldKey = f.field_key || `field${i + 1}`;
        await db.run(`
          INSERT INTO channel_fields (id, channel_id, field_key, name, unit, icon, color, field_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [uuidv4(), id, fieldKey, f.name, f.unit || "", f.icon || "activity", f.color || "#3B82F6", i + 1]);
      }
    }
  } else {
    await db.run(`
      INSERT INTO channel_fields (id, channel_id, field_key, name, unit, icon, color, field_order)
      VALUES ($1, $2, 'field1', 'Field 1', '', 'activity', '#EF4444', 1),
             ($3, $4, 'field2', 'Field 2', '', 'activity', '#3B82F6', 2)
    `, [uuidv4(), id, uuidv4(), id]);
  }

  const created = await db.get("SELECT * FROM channels WHERE id = $1", [id]);
  res.status(201).json({ message: "Channel created successfully.", channel: created });
});

// Get Channel by ID (with privacy and ownership validation)
router.get("/:id", authenticateToken, async (req, res) => {
  const channel = await db.get(`
    SELECT c.*, p.name as project_name, COALESCE(c.user_id, p.user_id) as owner_id
    FROM channels c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.id = $1
  `, [req.params.id]);

  if (!channel) {
    return res.status(404).json({ error: "Channel not found." });
  }

  const userId = req.user.id;
  const userEmail = req.user.email;
  const isOwner = channel.user_id === userId || channel.owner_id === userId;
  const isPublic = channel.is_public === 1 || channel.sharing_mode === "everyone";

  // Check if explicitly shared with this user's email
  const shareCheck = await db.get(
    "SELECT id FROM channel_shares WHERE channel_id = $1 AND LOWER(user_email) = LOWER($2)",
    [channel.id, userEmail]
  );

  if (!isOwner && !isPublic && !shareCheck) {
    return res.status(403).json({ error: "Access denied. This channel is private." });
  }

  const fields = await db.all("SELECT * FROM channel_fields WHERE channel_id = $1 ORDER BY field_order ASC", [channel.id]);
  const calculatedFields = await db.all("SELECT * FROM calculated_fields WHERE channel_id = $1", [channel.id]);
  const calibrations = await db.all("SELECT * FROM sensor_calibrations WHERE channel_id = $1", [channel.id]);
  const actuators = await db.all("SELECT * FROM actuators WHERE channel_id = $1", [channel.id]);
  const devices = await db.all("SELECT * FROM devices WHERE channel_id = $1", [channel.id]);
  const widgets = await db.all("SELECT * FROM dashboard_widgets WHERE channel_id = $1 ORDER BY grid_y ASC, grid_x ASC", [channel.id]);
  const shares = await db.all("SELECT * FROM channel_shares WHERE channel_id = $1 ORDER BY created_at DESC", [channel.id]);
  const readKeys = await db.all("SELECT * FROM channel_read_keys WHERE channel_id = $1 ORDER BY created_at ASC", [channel.id]);

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
    shares,
    readKeys: readKeys.length > 0 ? readKeys : [{ id: "default", api_key: channel.api_read_key, note: "" }],
    currentValues,
    lastUpdate: latestTelemetry?.timestamp || null
  });
});

// Delete Field
router.delete("/fields/:fieldId", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM channel_fields WHERE id = $1", [req.params.fieldId]);
  res.json({ message: "Field removed successfully." });
});

// Update Channel Settings
router.put("/:id", authenticateToken, async (req, res) => {
  const existing = await db.get(`
    SELECT c.*, COALESCE(c.user_id, p.user_id) as owner_id
    FROM channels c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.id = $1
  `, [req.params.id]);

  if (!existing) {
    return res.status(404).json({ error: "Channel not found." });
  }

  if (existing.owner_id !== req.user.id && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: "Only the channel owner can update settings." });
  }

  const {
    name,
    description,
    is_public,
    public_slug,
    metadata,
    tags,
    external_url,
    github_url,
    elevation,
    latitude,
    longitude,
    show_location,
    video_type,
    video_url,
    show_video,
    show_status,
    sharing_mode
  } = req.body;

  await db.run(`
    UPDATE channels 
    SET name = COALESCE($1, name),
        description = COALESCE($2, description),
        is_public = COALESCE($3, is_public),
        public_slug = COALESCE($4, public_slug),
        metadata = COALESCE($5, metadata),
        tags = COALESCE($6, tags),
        external_url = COALESCE($7, external_url),
        github_url = COALESCE($8, github_url),
        elevation = COALESCE($9, elevation),
        latitude = COALESCE($10, latitude),
        longitude = COALESCE($11, longitude),
        show_location = COALESCE($12, show_location),
        video_type = COALESCE($13, video_type),
        video_url = COALESCE($14, video_url),
        show_video = COALESCE($15, show_video),
        show_status = COALESCE($16, show_status),
        sharing_mode = COALESCE($17, sharing_mode),
        updated_at = NOW()
    WHERE id = $18
  `, [
    name,
    description,
    is_public !== undefined ? (is_public ? 1 : 0) : null,
    public_slug,
    metadata,
    tags,
    external_url,
    github_url,
    elevation,
    latitude ? parseFloat(latitude) : null,
    longitude ? parseFloat(longitude) : null,
    show_location !== undefined ? (show_location ? 1 : 0) : null,
    video_type,
    video_url,
    show_video !== undefined ? (show_video ? 1 : 0) : null,
    show_status !== undefined ? (show_status ? 1 : 0) : null,
    sharing_mode,
    req.params.id
  ]);

  const updated = await db.get("SELECT * FROM channels WHERE id = $1", [req.params.id]);
  res.json({ message: "Channel updated.", channel: updated });
});

// Channel Read Keys
router.get("/:id/read-keys", authenticateToken, async (req, res) => {
  const readKeys = await db.all("SELECT * FROM channel_read_keys WHERE channel_id = $1 ORDER BY created_at ASC", [req.params.id]);
  res.json({ readKeys });
});

router.post("/:id/read-keys", authenticateToken, async (req, res) => {
  const { note } = req.body;
  const id = uuidv4();
  const apiKey = generateApiKey("AGX_RD");
  await db.run(
    "INSERT INTO channel_read_keys (id, channel_id, api_key, note) VALUES ($1, $2, $3, $4)",
    [id, req.params.id, apiKey, note || ""]
  );
  const readKeys = await db.all("SELECT * FROM channel_read_keys WHERE channel_id = $1 ORDER BY created_at ASC", [req.params.id]);
  res.status(201).json({ message: "Read API key generated.", readKeys });
});

router.put("/:id/read-keys/:keyId", authenticateToken, async (req, res) => {
  const { note } = req.body;
  await db.run(
    "UPDATE channel_read_keys SET note = $1 WHERE id = $2 AND channel_id = $3",
    [note || "", req.params.keyId, req.params.id]
  );
  const readKeys = await db.all("SELECT * FROM channel_read_keys WHERE channel_id = $1 ORDER BY created_at ASC", [req.params.id]);
  res.json({ message: "Note updated.", readKeys });
});

router.delete("/:id/read-keys/:keyId", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM channel_read_keys WHERE id = $1 AND channel_id = $2", [req.params.keyId, req.params.id]);
  const readKeys = await db.all("SELECT * FROM channel_read_keys WHERE channel_id = $1 ORDER BY created_at ASC", [req.params.id]);
  res.json({ message: "Read API key deleted.", readKeys });
});

// Regenerate Write API Key
router.post("/:id/regenerate-write-key", authenticateToken, async (req, res) => {
  const writeKey = generateApiKey("AGX_WR");
  await db.run("UPDATE channels SET api_write_key = $1, updated_at = NOW() WHERE id = $2", [writeKey, req.params.id]);
  res.json({ message: "Write API key regenerated.", api_write_key: writeKey });
});

// Regenerate API Keys (both)
router.post("/:id/regenerate-keys", authenticateToken, async (req, res) => {
  const writeKey = generateApiKey("AGX_WR");
  const readKey = generateApiKey("AGX_RD");
  await db.run("UPDATE channels SET api_write_key = $1, api_read_key = $2, updated_at = NOW() WHERE id = $3", [writeKey, readKey, req.params.id]);
  await db.run("INSERT INTO channel_read_keys (id, channel_id, api_key, note) VALUES ($1, $2, $3, $4)", [uuidv4(), req.params.id, readKey, "Regenerated Read Key"]);
  res.json({ message: "API keys regenerated.", api_write_key: writeKey, api_read_key: readKey });
});

// Channel Shares
router.get("/:id/shares", authenticateToken, async (req, res) => {
  const shares = await db.all("SELECT * FROM channel_shares WHERE channel_id = $1 ORDER BY created_at DESC", [req.params.id]);
  res.json({ shares });
});

router.post("/:id/shares", authenticateToken, async (req, res) => {
  const { email, role } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email address is required." });
  }

  const id = uuidv4();
  try {
    await db.run(
      "INSERT INTO channel_shares (id, channel_id, user_email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (channel_id, user_email) DO UPDATE SET role = EXCLUDED.role",
      [id, req.params.id, email.toLowerCase().trim(), role || "Viewer"]
    );
    const shares = await db.all("SELECT * FROM channel_shares WHERE channel_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.status(201).json({ message: "User added to channel share.", shares });
  } catch (err) {
    res.status(400).json({ error: "Failed to add user share." });
  }
});

router.delete("/:id/shares/:shareId", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM channel_shares WHERE id = $1 AND channel_id = $2", [req.params.shareId, req.params.id]);
  const shares = await db.all("SELECT * FROM channel_shares WHERE channel_id = $1 ORDER BY created_at DESC", [req.params.id]);
  res.json({ message: "User removed from channel share.", shares });
});

router.put("/:id/sharing-mode", authenticateToken, async (req, res) => {
  const { sharing_mode } = req.body;
  const isPublic = sharing_mode === "everyone" ? 1 : 0;
  await db.run("UPDATE channels SET sharing_mode = $1, is_public = $2, updated_at = NOW() WHERE id = $3", [sharing_mode, isPublic, req.params.id]);
  const updated = await db.get("SELECT * FROM channels WHERE id = $1", [req.params.id]);
  res.json({ message: "Sharing mode updated.", channel: updated });
});

// Delete Channel
router.delete("/:id", authenticateToken, async (req, res) => {
  const existing = await db.get(`
    SELECT c.*, COALESCE(c.user_id, p.user_id) as owner_id
    FROM channels c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.id = $1
  `, [req.params.id]);

  if (!existing) {
    return res.status(404).json({ error: "Channel not found." });
  }

  if (existing.owner_id !== req.user.id && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: "Only the channel owner can delete this channel." });
  }

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

export default router;
