import express from "express";
import http from "http";
import cors from "cors";
import { CONFIG } from "./config.js";
import { initDatabase } from "./db.js";
import { wsHub } from "./services/websocket.js";
import { scheduler } from "./services/scheduler.js";
import { simulator } from "./services/simulatorService.js";

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
const server = http.createServer(app);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
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

// Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

async function startServer() {
  try {
    await initDatabase();
    wsHub.init(server);
    scheduler.start();
    simulator.start();

    server.listen(CONFIG.PORT, () => {
      console.log(`?? AgroNexus IoT Server listening on http://localhost:${CONFIG.PORT}`);
      console.log(`?? Cloud DB: Connected to Neon PostgreSQL Cluster`);
      console.log(`?? WebSocket endpoint ready at ws://localhost:${CONFIG.PORT}/ws`);
      console.log(`? Ingestion endpoint: POST http://localhost:${CONFIG.PORT}/api/data`);
    });
  } catch (err) {
    console.error("Failed to start AgroNexus Server:", err);
    process.exit(1);
  }
}

startServer();
