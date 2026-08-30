import express from "express";
import cors from "cors";
import { initDatabase } from "./db.js";

// Routes
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import channelRoutes from "./routes/channels.js";
import deviceRoutes from "./routes/devices.js";
import telemetryRoutes from "./routes/telemetry.js";
import actuatorRoutes from "./routes/actuators.js";
import ruleRoutes from "./routes/rules.js";
import dashboardRoutes from "./routes/dashboards.js";
import aiRoutes from "./routes/ai.js";
import reportRoutes from "./routes/reports.js";
import simulatorRoutes from "./routes/simulator.js";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Lazy database init helper for serverless
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (e) {
      console.error("DB lazy init error:", e);
    }
  }
  next();
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.VERCEL ? "Vercel Serverless" : "Standard Node.js",
    database: "Neon PostgreSQL Cloud",
    platform: "AgroNexus IoT Core",
    version: "2.0.0",
    time: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api", telemetryRoutes);
app.use("/api/actuators", actuatorRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/simulator", simulatorRoutes);

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

export default app;
