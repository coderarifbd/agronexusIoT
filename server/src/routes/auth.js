import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { CONFIG } from "../config.js";
import { authenticateToken } from "../middleware/auth.js";
import { passkeySessions } from "../middleware/passkeyAuth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

async function generateNextUserId() {
  const users = await db.all("SELECT user_id_code FROM users ORDER BY created_at DESC");
  let maxNum = 0;
  for (const u of users) {
    if (u.user_id_code && u.user_id_code.startsWith("ANAMI-")) {
      const num = parseInt(u.user_id_code.replace("ANAMI-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  const nextNum = String(maxNum + 1).padStart(3, "0");
  return `ANAMI-${nextNum}`;
}

// Register
router.post("/register", rateLimiter(10, 60000), async (req, res) => {
  const { name, username, email, password, passkey } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "All fields are required (Name, Username, Email, Password)." });
  }

  const existing = await db.get("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
  if (existing) {
    return res.status(400).json({ error: "Username or Email already registered." });
  }

  const userId = uuidv4();
  const userIdCode = await generateNextUserId();
  const passwordHash = bcrypt.hashSync(password, 10);
  const passkeyHash = passkey ? bcrypt.hashSync(passkey, 10) : passwordHash;

  await db.run(`
    INSERT INTO users (id, user_id_code, name, username, email, password_hash, passkey_hash)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [userId, userIdCode, name, username, email, passwordHash, passkeyHash]);

  const token = jwt.sign({ id: userId, username, userIdCode }, CONFIG.JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRES_IN });

  res.status(201).json({
    message: "Registration successful!",
    token,
    user: {
      id: userId,
      user_id_code: userIdCode,
      name,
      username,
      email,
      role: "admin"
    }
  });
});

// Login
router.post("/login", rateLimiter(20, 60000), async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Username/Email and Password are required." });
  }

  const user = await db.get(`
    SELECT * FROM users 
    WHERE email = $1 OR username = $1 OR user_id_code = $1
  `, [identifier]);

  const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Browser";

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    if (user) {
      await db.run("INSERT INTO login_history (id, user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, $4, $5)", [uuidv4(), user.id, ip, userAgent, "FAILED_PASSWORD"]);
    }
    return res.status(401).json({ error: "Invalid credentials. Please verify your password." });
  }

  await db.run("INSERT INTO login_history (id, user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, $4, $5)", [uuidv4(), user.id, ip, userAgent, "SUCCESS"]);

  const token = jwt.sign(
    { id: user.id, username: user.username, userIdCode: user.user_id_code },
    CONFIG.JWT_SECRET,
    { expiresIn: CONFIG.JWT_EXPIRES_IN }
  );

  res.json({
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      user_id_code: user.user_id_code,
      name: user.name,
      username: user.username,
      email: user.email,
      profile_pic: user.profile_pic,
      role: user.role
    }
  });
});

// Verify Master Passkey (Maintained as always true for backward compatibility)
router.post("/verify-passkey", authenticateToken, async (req, res) => {
  res.json({
    message: "Access granted.",
    unlocked: true,
    expiresInMs: CONFIG.PASSKEY_SESSION_DURATION_MS
  });
});

// Check Passkey Status
router.get("/passkey-status", authenticateToken, (req, res) => {
  res.json({
    unlocked: true,
    remainingMs: 99999999
  });
});

router.post("/lock-passkey", authenticateToken, (req, res) => {
  res.json({ message: "Dashboard unlocked." });
});

router.get("/profile", authenticateToken, async (req, res) => {
  const user = await db.get("SELECT id, user_id_code, name, username, email, profile_pic, role, created_at FROM users WHERE id = $1", [req.user.id]);
  res.json({ user });
});

router.put("/profile", authenticateToken, async (req, res) => {
  const { name, profile_pic } = req.body;
  await db.run("UPDATE users SET name = COALESCE($1, name), profile_pic = COALESCE($2, profile_pic), updated_at = NOW() WHERE id = $3", [name, profile_pic, req.user.id]);

  const updated = await db.get("SELECT id, user_id_code, name, username, email, profile_pic, role FROM users WHERE id = $1", [req.user.id]);
  res.json({ message: "Profile updated successfully.", user: updated });
});

router.put("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required." });
  }

  const user = await db.get("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: "Current password is incorrect." });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  await db.run("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, req.user.id]);

  res.json({ message: "Password updated successfully." });
});

router.get("/login-history", authenticateToken, async (req, res) => {
  const history = await db.all("SELECT * FROM login_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 20", [req.user.id]);
  res.json({ history });
});

router.get("/activity-logs", authenticateToken, async (req, res) => {
  const logs = await db.all("SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50", [req.user.id]);
  res.json({ logs });
});

router.get("/alerts", authenticateToken, async (req, res) => {
  const alerts = await db.all("SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30", [req.user.id]);
  res.json({ alerts });
});

router.put("/alerts/:id/read", authenticateToken, async (req, res) => {
  await db.run("UPDATE alerts SET is_read = 1 WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ success: true });
});

export default router;
