import { AIProviderBase } from "./AIProviderBase.js";
import * as tools from "../aiTools.js";

/**
 * Google Gemini Provider for AgroNexus IoT
 * Uses official Gemini REST API (gemini-1.5-flash / gemini-2.0-flash)
 */
export class GeminiProvider extends AIProviderBase {
  constructor(apiKey) {
    super("Google-Gemini");
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  async processQuery(options) {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const { query, userId, channelId, conversationHistory = [] } = options;

    // First fetch real context data using our tools layer
    const projectSummary = await tools.getProjectSummary(userId);
    const latestData = await tools.getLatestSensorData(userId, { channelId });
    const deviceHealth = await tools.getDeviceHealth(userId);
    const activeAlerts = await tools.getActiveAlerts(userId);

    const systemInstruction = `You are the AgroNexus AI Assistant, an expert IoT agronomist and automated farm manager.
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
`;

    const contents = [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "Understood. I am connected to the user's real AgroNexus IoT database and will answer strictly using authentic telemetry." }] }
    ];

    // Append recent history
    for (const msg of conversationHistory.slice(-4)) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text || msg.content || "" }]
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: query }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate response from Gemini.";

    // Attach real sensor card if query relates to readings
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
