import { AIProviderBase } from "./AIProviderBase.js";
import * as tools from "../aiTools.js";

/**
 * OpenAI Provider for AgroNexus IoT
 * Uses official OpenAI Chat Completions REST API (gpt-4o-mini / gpt-3.5-turbo)
 */
export class OpenAIProvider extends AIProviderBase {
  constructor(apiKey) {
    super("OpenAI");
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async processQuery(options) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const { query, userId, channelId, conversationHistory = [] } = options;

    const projectSummary = await tools.getProjectSummary(userId);
    const latestData = await tools.getLatestSensorData(userId, { channelId });
    const deviceHealth = await tools.getDeviceHealth(userId);
    const activeAlerts = await tools.getActiveAlerts(userId);

    const systemMessage = {
      role: "system",
      content: `You are the AgroNexus AI Assistant, an expert IoT agronomist and automated farm manager.
You have direct, real-time access to the user's authentic PostgreSQL database telemetry and microcontroller fleet.

CRITICAL RULES:
1. NEVER invent or hallucinate sensor readings, device statuses, or historical data.
2. Only refer to the real data provided below or clearly state that data is unavailable.
3. If the user asks to turn devices/relays on or off or create automation rules, state that you can propose the action and explain the conditions, but emphasize that explicit confirmation will be required.
4. Support English and Bengali naturally.
5. Provide units (e.g. °C, %, pH, ppm) and timestamps where relevant.

CURRENT REAL-TIME CONTEXT:
- Total Devices: ${deviceHealth.total_devices} (${deviceHealth.online_count} online, ${deviceHealth.offline_count} offline)
- Channel In Focus: ${latestData.channel?.name || 'Primary Channel'}
- Latest Readings: ${JSON.stringify(latestData.readings || [])}
- Active Alerts: ${JSON.stringify(activeAlerts || [])}
- Device Health: ${JSON.stringify(deviceHealth.devices || [])}
`
    };

    const messages = [systemMessage];

    for (const msg of conversationHistory.slice(-4)) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text || msg.content || ""
      });
    }

    messages.push({ role: "user", content: query });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        max_tokens: 800
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || "Unable to generate response from OpenAI.";

    const cards = {};
    if (latestData.status === "ok" && (query.toLowerCase().includes("sensor") || query.toLowerCase().includes("reading") || query.toLowerCase().includes("temp") || query.toLowerCase().includes("moisture"))) {
      cards.sensorCard = latestData;
    }

    return {
      answer,
      cards,
      actionProposal: null
    };
  }
}
