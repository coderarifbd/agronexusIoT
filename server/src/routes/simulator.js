import express from "express";
import { simulator } from "../services/simulatorService.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/status", authenticateToken, (req, res) => {
  res.json({
    isRunning: simulator.isRunning,
    step: simulator.step,
    intervalMs: 4000
  });
});

router.post("/toggle", authenticateToken, (req, res) => {
  if (simulator.isRunning) {
    simulator.stop();
  } else {
    simulator.start();
  }
  res.json({ isRunning: simulator.isRunning });
});

router.post("/burst", authenticateToken, (req, res) => {
  simulator.tick();
  res.json({ success: true, message: "Synthetic telemetry burst dispatched." });
});

export default router;
