import jwt from "jsonwebtoken";
import { CONFIG } from "../config.js";
import { db } from "../db.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Authentication token required." });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = await db.get("SELECT id, user_id_code, name, username, email, profile_pic, role FROM users WHERE id = $1", [decoded.id]);

    if (!user) {
      return res.status(401).json({ error: "User no longer exists or session invalid." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired session token." });
  }
}
