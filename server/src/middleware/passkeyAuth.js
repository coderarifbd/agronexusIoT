import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { CONFIG } from "../config.js";

export const passkeySessions = new Map();

export async function verifyMasterPasskey(req, res, next) {
  const userId = req.user?.id;
  const passkeyHeader = req.headers["x-master-passkey"];

  const lastUnlock = passkeySessions.get(userId);
  const now = Date.now();
  const validityPeriod = CONFIG.PASSKEY_SESSION_DURATION_MS || (30 * 60 * 1000);

  if (lastUnlock && (now - lastUnlock < validityPeriod)) {
    return next();
  }

  if (passkeyHeader) {
    const userRow = await db.get("SELECT passkey_hash FROM users WHERE id = $1", [userId]);
    if (userRow && bcrypt.compareSync(passkeyHeader, userRow.passkey_hash)) {
      passkeySessions.set(userId, now);
      return next();
    }
  }

  return res.status(403).json({
    error: "Master Passkey required to access this secure resource.",
    requiresPasskey: true
  });
}
