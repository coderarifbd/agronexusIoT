import { WebSocketServer, WebSocket } from "ws";

class WebSocketHub {
  constructor() {
    this.wss = null;
    this.clients = new Set(); // Set of ws objects with .subscriptions = Set(channelIds)
  }

  init(server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      ws.subscriptions = new Set();
      ws.isAlive = true;
      this.clients.add(ws);

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsed);
        } catch (err) {
          console.error("WS Parse Error:", err);
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
      });

      ws.on("error", (err) => {
        console.error("WS Client Error:", err);
        this.clients.delete(ws);
      });

      // Send initial welcome
      ws.send(JSON.stringify({ type: "CONNECTED", message: "Connected to AgroNexus Real-time Stream" }));
    });

    // Heartbeat ping interval
    setInterval(() => {
      for (const client of this.clients) {
        if (!client.isAlive) {
          client.terminate();
          this.clients.delete(client);
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, 30000);
  }

  handleClientMessage(ws, data) {
    if (data.action === "SUBSCRIBE" && data.channelId) {
      ws.subscriptions.add(data.channelId);
      ws.send(JSON.stringify({ type: "SUBSCRIBED", channelId: data.channelId }));
    } else if (data.action === "UNSUBSCRIBE" && data.channelId) {
      ws.subscriptions.delete(data.channelId);
      ws.send(JSON.stringify({ type: "UNSUBSCRIBED", channelId: data.channelId }));
    } else if (data.action === "SUBSCRIBE_ALL") {
      ws.subscriptions.add("*");
      ws.send(JSON.stringify({ type: "SUBSCRIBED_ALL" }));
    }
  }

  broadcastTelemetry(channelId, telemetryPayload, deviceId) {
    const message = JSON.stringify({
      type: "TELEMETRY_UPDATE",
      channelId,
      deviceId,
      data: telemetryPayload,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        if (client.subscriptions.has(channelId) || client.subscriptions.has("*")) {
          client.send(message);
        }
      }
    }
  }

  broadcastActuatorChange(channelId, actuatorId, state, name) {
    const message = JSON.stringify({
      type: "ACTUATOR_STATE_CHANGED",
      channelId,
      actuatorId,
      state,
      name,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        if (client.subscriptions.has(channelId) || client.subscriptions.has("*")) {
          client.send(message);
        }
      }
    }
  }

  broadcastAlert(userId, alert) {
    const message = JSON.stringify({
      type: "NEW_ALERT",
      alert,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  broadcastActivityLog(log) {
    const message = JSON.stringify({
      type: "NEW_ACTIVITY_LOG",
      log,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

export const wsHub = new WebSocketHub();
