import { api } from "./api";

class SocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.subscribedChannels = new Set();
    this.pollingInterval = null;
    this.isPollingActive = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("?? WebSocket Connected to AgroNexus Stream");
        this.stopPollingFallback();
        for (const chId of this.subscribedChannels) {
          this.send({ action: "SUBSCRIBE", channelId: chId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      this.ws.onclose = () => {
        this.startPollingFallback();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.startPollingFallback();
      };
    } catch (err) {
      this.startPollingFallback();
      this.scheduleReconnect();
    }
  }

  startPollingFallback() {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    console.log("? Vercel/Serverless Mode: Real-time Telemetry Polling fallback active (3s)");

    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(async () => {
      for (const channelId of this.subscribedChannels) {
        if (!channelId || channelId === "*") continue;
        try {
          const res = await api.getChannel(channelId);
          if (res && res.currentValues) {
            this.emit("TELEMETRY_UPDATE", {
              type: "TELEMETRY_UPDATE",
              channelId,
              data: res.currentValues,
              timestamp: res.lastUpdate || new Date().toISOString()
            });
          }
        } catch (e) {}
      }
    }, 3500);
  }

  stopPollingFallback() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.isPollingActive = false;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 10000);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribeChannel(channelId) {
    this.subscribedChannels.add(channelId);
    this.send({ action: "SUBSCRIBE", channelId });
  }

  unsubscribeChannel(channelId) {
    this.subscribedChannels.delete(channelId);
    this.send({ action: "UNSUBSCRIBE", channelId });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data);
      }
    }
  }
}

export const socketClient = new SocketClient();
