class SocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.subscribedChannels = new Set();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    // In dev mode when vite is at port 3000, proxy handles /ws or fallback directly to port 5050
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("🟢 WebSocket Connected to AgroNexus Live Stream");
        // Re-subscribe to channels
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
        console.log("🔴 WebSocket Disconnected. Reconnecting in 3s...");
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error("WS Error:", err);
      };
    } catch (err) {
      console.error("WS Connection Init Error:", err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
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
