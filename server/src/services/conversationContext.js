/**
 * In-memory Session Context Store for Multi-turn Conversations
 */
class ConversationContextManager {
  constructor() {
    this.sessions = new Map();
  }

  getContext(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        lastSensorField: null,
        lastDeviceId: null,
        activeChannelId: null,
        lastUpdated: Date.now()
      });
    }
    const ctx = this.sessions.get(userId);
    ctx.lastUpdated = Date.now();
    return ctx;
  }

  updateContext(userId, updates) {
    const ctx = this.getContext(userId);
    Object.assign(ctx, updates, { lastUpdated: Date.now() });
    return ctx;
  }

  clearContext(userId) {
    this.sessions.delete(userId);
  }
}

export const conversationContext = new ConversationContextManager();
