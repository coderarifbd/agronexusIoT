import express from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all projects for logged-in user (including shared projects)
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  const owned = await db.all(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM channels WHERE project_id = p.id) as channel_count,
      (SELECT COUNT(*) FROM devices d JOIN channels c ON d.channel_id = c.id WHERE c.project_id = p.id) as device_count,
      'Owner' as user_role
    FROM projects p
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
  `, [userId]);

  const shared = await db.all(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM channels WHERE project_id = p.id) as channel_count,
      (SELECT COUNT(*) FROM devices d JOIN channels c ON d.channel_id = c.id WHERE c.project_id = p.id) as device_count,
      pm.role as user_role
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_email = $1
    ORDER BY p.created_at DESC
  `, [userEmail]);

  res.json({ projects: [...owned, ...shared] });
});

// Create new Project
router.post("/", authenticateToken, async (req, res) => {
  const { name, description, icon, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required." });
  }

  const id = uuidv4();
  await db.run(`
    INSERT INTO projects (id, user_id, name, description, icon, color)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, req.user.id, name, description || "", icon || "folder", color || "#10B981"]);

  const created = await db.get("SELECT * FROM projects WHERE id = $1", [id]);
  res.status(201).json({ message: "Project created successfully.", project: created });
});

// Get Project Details & its channels
router.get("/:id", authenticateToken, async (req, res) => {
  const project = await db.get("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  if (!project) {
    return res.status(404).json({ error: "Project not found." });
  }

  const channels = await db.all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM channel_fields WHERE channel_id = c.id) as field_count,
      (SELECT COUNT(*) FROM devices WHERE channel_id = c.id) as device_count,
      (SELECT COUNT(*) FROM actuators WHERE channel_id = c.id) as actuator_count
    FROM channels c 
    WHERE c.project_id = $1
    ORDER BY c.channel_number ASC, c.created_at ASC
  `, [project.id]);

  const members = await db.all("SELECT * FROM project_members WHERE project_id = $1 ORDER BY created_at ASC", [project.id]);

  res.json({ project, channels, members });
});

// Update Project
router.put("/:id", authenticateToken, async (req, res) => {
  const { name, description, icon, color } = req.body;
  await db.run(`
    UPDATE projects 
    SET name = COALESCE($1, name), description = COALESCE($2, description),
        icon = COALESCE($3, icon), color = COALESCE($4, color), updated_at = NOW()
    WHERE id = $5 AND user_id = $6
  `, [name, description, icon, color, req.params.id, req.user.id]);

  const updated = await db.get("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  res.json({ message: "Project updated.", project: updated });
});

// Delete Project
router.delete("/:id", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM projects WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ message: "Project deleted." });
});

// Team Member Sharing
router.post("/:id/members", authenticateToken, async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: "Member email and role (Owner, Admin, Editor, Viewer) required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.trim();

  // Check if member already exists in project
  const existing = await db.get("SELECT id FROM project_members WHERE project_id = $1 AND LOWER(user_email) = $2", [req.params.id, cleanEmail]);

  if (existing) {
    await db.run("UPDATE project_members SET role = $1 WHERE id = $2", [cleanRole, existing.id]);
  } else {
    const memberId = uuidv4();
    await db.run(`
      INSERT INTO project_members (id, project_id, user_email, role)
      VALUES ($1, $2, $3, $4)
    `, [memberId, req.params.id, cleanEmail, cleanRole]);
  }

  const members = await db.all("SELECT * FROM project_members WHERE project_id = $1 ORDER BY created_at ASC", [req.params.id]);
  res.status(201).json({ message: `Added ${cleanEmail} as ${cleanRole}`, members });
});

router.delete("/:id/members/:memberId", authenticateToken, async (req, res) => {
  await db.run("DELETE FROM project_members WHERE id = $1 AND project_id = $2", [req.params.memberId, req.params.id]);
  const members = await db.all("SELECT * FROM project_members WHERE project_id = $1 ORDER BY created_at ASC", [req.params.id]);
  res.json({ message: "Member removed.", members });
});

export default router;
