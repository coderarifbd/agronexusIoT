import http from "http";
import app from "./app.js";
import { CONFIG } from "./config.js";
import { initDatabase } from "./db.js";
import { wsHub } from "./services/websocket.js";
import { scheduler } from "./services/scheduler.js";
import { simulator } from "./services/simulatorService.js";

const server = http.createServer(app);

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
