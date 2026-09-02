import { AIProviderBase } from "./AIProviderBase.js";
import * as tools from "../aiTools.js";
import { db } from "../../db.js";

/**
 * Built-in High-Performance Analytical Engine Provider
 * Interacts directly with AgroNexus real IoT database without mock data.
 * Works seamlessly in offline, serverless, and production edge environments.
 */
export class AnalyticalEngineProvider extends AIProviderBase {
  constructor() {
    super("AgroNexus-Analytical-Engine-v2");
  }

  async processQuery({ query, userId, channelId, conversationHistory = [], context = {} }) {
    const qLower = (query || "").toLowerCase().trim();

    // ------------------------------------------------------------------------
    // Context Memory Resolution:
    // If the user refers to "it", "this sensor", "trend", or "yesterday",
    // resolve to the previously discussed sensor field in this session!
    // ------------------------------------------------------------------------
    let sensorField = context.lastSensorField || null;
    let targetDeviceId = context.lastDeviceId || null;
    let targetChannelId = channelId || context.activeChannelId || null;

    // Detect sensor field mentions in current query
    if (qLower.includes("moisture") || qLower.includes("ময়েশ্চার") || qLower.includes("আর্দ্রতা") || qLower.includes("মাটি")) {
      sensorField = "soil_moisture";
    } else if (qLower.includes("temp") || qLower.includes("তাপ") || qLower.includes("তাপমাত্রা")) {
      sensorField = "temperature";
    } else if (qLower.includes("humidity") || qLower.includes("বাতাসের আর্দ্রতা")) {
      sensorField = "humidity";
    } else if (qLower.includes("ph") || qLower.includes("পিএইচ")) {
      sensorField = "ph";
    } else if (qLower.includes("tds") || qLower.includes("টিডিএস")) {
      sensorField = "tds";
    } else if (qLower.includes("light") || qLower.includes("lux") || qLower.includes("আলো")) {
      sensorField = "light_intensity";
    }

    // Detect device mentions (e.g. Device 1, Device ESP-01)
    const devMatch = qLower.match(/device\s*#?\s*([0-9]+|[a-z0-9]+-[a-z0-9]+)/i);
    const reservedWords = ["online", "offline", "health", "status", "battery", "fleet", "is", "my", "the"];
    if (devMatch && !reservedWords.includes(devMatch[1].toLowerCase())) {
      targetDeviceId = devMatch[1];
    }

    // Update conversation context memory
    if (sensorField) context.lastSensorField = sensorField;
    if (targetDeviceId) context.lastDeviceId = targetDeviceId;
    if (targetChannelId) context.activeChannelId = targetChannelId;

    // ========================================================================
    // LEVEL 4: AUTOMATION & ACTUATOR CONTROL PROPOSALS (Strict Confirmation)
    // ========================================================================

    // 1. Automation Rule Proposal Request (Conditional "IF ... THEN ...")
    if (
      (qLower.includes("when") || qLower.includes("if") || qLower.includes("below") || qLower.includes("above") || qLower.includes("হলে")) &&
      (qLower.includes("turn on") || qLower.includes("turn off") || qLower.includes("create automation") || qLower.includes("auto rule") || qLower.includes("alert me") || qLower.includes("pump") || qLower.includes("fan") || qLower.includes("irrigation"))
    ) {
      // Find channel
      let ch = await tools.verifyUserChannelAccess(userId, targetChannelId);
      if (!ch) {
        const userCh = await db.get("SELECT c.id, c.name FROM channels c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1 LIMIT 1", [userId]);
        if (userCh) ch = userCh;
      }

      if (!ch) {
        return {
          answer: "⚠️ You need at least one created channel before creating an automation rule.",
          cards: {},
          actionProposal: null
        };
      }

      // Extract threshold number
      const numMatch = qLower.match(/(\d+(\.\d+)?)/);
      const thresholdVal = numMatch ? parseFloat(numMatch[1]) : 30;
      const isBelow = qLower.includes("below") || qLower.includes("less") || qLower.includes("কম");
      const operator = isBelow ? "<" : ">";

      const targetField = sensorField || "soil_moisture";
      const ruleName = `Auto ${targetField} ${operator} ${thresholdVal}`;

      const conditions = [
        { field_key: targetField, operator, value: thresholdVal }
      ];

      // Find an actuator on this channel if available
      const actuator = await db.get("SELECT id, name FROM actuators WHERE channel_id = $1 LIMIT 1", [ch.id]);
      const actions = actuator
        ? [{ action_type: "ACTUATOR", target_actuator_id: actuator.id, target_value: "1" }]
        : [{ action_type: "ALERT", severity: "warning", message: `${targetField} crossed threshold ${thresholdVal}` }];

      const proposal = await tools.proposeAutomationRule(userId, {
        channelId: ch.id,
        name: ruleName,
        description: `Triggered automatically when ${targetField} is ${isBelow ? "below" : "above"} ${thresholdVal}`,
        conditions,
        actions
      });

      return {
        answer: `I have prepared the following automation rule for **${ch.name}**:\n\n` +
          `• **Rule**: \`IF ${targetField} ${operator} ${thresholdVal}\`\n` +
          `• **Action**: \`${actuator ? `Turn ON ${actuator.name}` : `Dispatch Emergency Alert`}\`\n\n` +
          `🔒 **Safety Verification Required**: Please review and confirm below to activate this rule in your system:`,
        cards: {},
        actionProposal: proposal
      };
    }

    // 2. Direct Actuator Turn ON/OFF Request (Immediate Command)
    if (
      qLower.includes("turn on") || qLower.includes("turn off") ||
      qLower.includes("চালু করো") || qLower.includes("বন্ধ করো") ||
      qLower.includes("switch on") || qLower.includes("switch off")
    ) {
      const isTurnOn = qLower.includes("on") || qLower.includes("চালু");
      const targetState = isTurnOn ? "1" : "0";

      // Find user actuators
      const actuators = await db.all(
        `SELECT a.id, a.name, a.actuator_key, c.name as channel_name 
         FROM actuators a
         JOIN channels c ON a.channel_id = c.id
         JOIN projects p ON c.project_id = p.id
         WHERE p.user_id = $1`,
        [userId]
      );

      if (actuators.length === 0) {
        return {
          answer: "⚠️ No hardware actuators or relays are registered for your account. You can configure actuators under Channel Settings.",
          cards: {},
          actionProposal: null
        };
      }

      // Match actuator by query keyword (e.g. pump, fan, light, valve)
      let matchedActuator = actuators.find(a => 
        qLower.includes(a.name.toLowerCase()) || 
        qLower.includes(a.actuator_key.toLowerCase())
      ) || actuators[0];

      const proposal = await tools.proposeControlActuator(userId, {
        actuatorId: matchedActuator.id,
        targetState
      });

      return {
        answer: `I can turn **${isTurnOn ? "ON" : "OFF"}** the **${matchedActuator.name}** for you.\n\n` +
          `🔒 **Safety Verification Required**: In accordance with AgroNexus hardware safety protocols, please review and confirm the action below before execution:`,
        cards: {},
        actionProposal: proposal
      };
    }

    // ========================================================================
    // LEVEL 3: PROACTIVE MONITORING & DAILY SUMMARY
    // ========================================================================

    if (
      qLower.includes("daily summary") || qLower.includes("today's summary") ||
      qLower.includes("আজকের সামারি") || qLower.includes("good morning") ||
      qLower.includes("farm summary") || qLower.includes("overview")
    ) {
      const summary = await tools.getDailyAISummary(userId);

      let answer = `🌾 **AgroNexus Daily IoT Summary** — *${summary.date}*\n\n` +
        `• 📱 **Device Fleet**: **${summary.devices_online} online**, ${summary.devices_offline} offline (Total: ${summary.total_devices})\n` +
        `• 🌡️ **Temperature**: Current average is **${summary.temperature_avg}** (Trend: **${summary.temperature_trend}**, ${summary.temperature_change})\n` +
        `• 💧 **Soil Moisture**: Current average is **${summary.soil_moisture_avg}** (Trend: **${summary.soil_moisture_trend}**, ${summary.soil_moisture_change})\n` +
        `• 🔍 **Anomalies Detected**: **${summary.anomalies_count}** telemetry outlier(s)\n` +
        `• ⚠️ **Active Alerts**: **${summary.total_alerts_count}** alerts (${summary.critical_alerts_count} critical)\n\n`;

      if (summary.recommendations.length > 0) {
        answer += `💡 **Recommendations**:\n` + summary.recommendations.map(r => `  - ${r}`).join("\n");
      } else {
        answer += `✅ **Status**: All farm sensor streams and automated irrigation systems are operating normally.`;
      }

      return {
        answer,
        cards: { dailySummaryCard: summary },
        actionProposal: null
      };
    }

    // Active Alerts Query
    if (
      qLower.includes("alert") || qLower.includes("warning") || qLower.includes("এলার্ট") ||
      qLower.includes("সতর্কবার্তা") || qLower.includes("problem")
    ) {
      const alerts = await tools.getActiveAlerts(userId);
      if (alerts.length === 0) {
        return {
          answer: "✅ **No Active Alerts**: All sensor channels are operating within normal configured thresholds.",
          cards: { alertCard: [] },
          actionProposal: null
        };
      }

      const alertList = alerts.map(a => 
        `• **[${a.severity.toUpperCase()}] ${a.title}**\n  *Message*: ${a.message}\n  *Channel*: ${a.channel_name || "Farm"} | *Time*: ${new Date(a.created_at).toLocaleTimeString()}`
      ).join("\n\n");

      return {
        answer: `⚠️ **Active IoT Alerts (${alerts.length} unread)**:\n\n${alertList}`,
        cards: { alertCard: alerts },
        actionProposal: null
      };
    }

    // Device Health Query
    if (
      qLower.includes("device health") || qLower.includes("is my device online") ||
      qLower.includes("device status") || qLower.includes("battery") ||
      qLower.includes("wifi") || qLower.includes("ডিভাইস") || qLower.includes("অনলাইন")
    ) {
      const health = await tools.getDeviceHealth(userId, targetDeviceId);

      if (health.total_devices === 0) {
        return {
          answer: "📱 No IoT devices registered yet. You can register your ESP32, Arduino, or Raspberry Pi in the **IoT Devices Fleet** page.",
          cards: {},
          actionProposal: null
        };
      }

      const devDetails = health.devices.map(d => {
        const icon = d.status === "online" ? "🟢" : "🔴";
        return `${icon} **${d.name}** (\`${d.code}\`)\n` +
          `   • Status: **${d.status.toUpperCase()}** | Channel: ${d.channel}\n` +
          `   • Battery: **${d.battery}** | Wi-Fi: **${d.wifi}** | Firmware: ${d.firmware}\n` +
          `   • Last Seen: ${d.last_seen !== "Never" ? new Date(d.last_seen).toLocaleTimeString() : "Never"}` +
          (d.issues.length > 0 ? `\n   ⚠️ *Issues*: ${d.issues.join(", ")}` : "");
      }).join("\n\n");

      return {
        answer: `📡 **IoT Devices Fleet Status** (${health.online_count}/${health.total_devices} Online):\n\n${devDetails}`,
        cards: { deviceCard: health.devices },
        actionProposal: null
      };
    }

    // ========================================================================
    // LEVEL 2: HISTORICAL TRENDS & STATISTICAL ANALYSIS
    // ========================================================================

    if (
      qLower.includes("trend") || qLower.includes("history") || qLower.includes("last 7 days") ||
      qLower.includes("last 24 hours") || qLower.includes("yesterday") || qLower.includes("average") ||
      qLower.includes("maximum") || qLower.includes("highest") || qLower.includes("minimum") ||
      qLower.includes("ট্রেন্ড") || qLower.includes("গড়") || qLower.includes("সর্বোচ্চ") || qLower.includes("সর্বনিম্ন")
    ) {
      const targetSensor = sensorField || "temperature";
      const is24h = qLower.includes("24") || qLower.includes("today") || qLower.includes("গতকাল");
      const startTime = is24h 
        ? new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        : new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

      const stats = await tools.getSensorStatistics(userId, {
        channelId: targetChannelId,
        sensorId: targetSensor,
        startTime
      });

      if (stats.status === "no_data") {
        return {
          answer: `📊 ${stats.message}\nPlease ensure your microcontroller is actively streaming data to this channel.`,
          cards: {},
          actionProposal: null
        };
      }

      const trendIcon = stats.trend === "increasing" ? "📈" : stats.trend === "decreasing" ? "📉" : "➡️";
      const trendExplanation = stats.trend === "increasing"
        ? `has increased by **${stats.percentage_change}** over the observed period. Readings are trending upward.`
        : stats.trend === "decreasing"
        ? `has decreased by **${stats.percentage_change}**. The trend is downward compared with earlier readings.`
        : `has remained relatively stable (**${stats.percentage_change}** change).`;

      const answer = `${trendIcon} **${stats.sensor} Statistical Analysis (${is24h ? "Last 24 Hours" : "Past 7 Days"})**:\n\n` +
        `Your ${stats.sensor.toLowerCase()} ${trendExplanation}\n\n` +
        `• **Latest Reading**: **${stats.latest_reading} ${stats.unit}**\n` +
        `• **Average (Mean)**: **${stats.average} ${stats.unit}**\n` +
        `• **Median**: **${stats.median} ${stats.unit}**\n` +
        `• **Minimum Recorded**: **${stats.minimum} ${stats.unit}**\n` +
        `• **Maximum Recorded**: **${stats.maximum} ${stats.unit}**\n` +
        `• **Data Points Analyzed**: ${stats.sample_count} samples from cloud PostgreSQL`;

      return {
        answer,
        cards: { trendCard: stats },
        actionProposal: null
      };
    }

    // Anomaly Detection Query
    if (qLower.includes("anomal") || qLower.includes("unusual") || qLower.includes("অস্বাভাবিক") || qLower.includes("ত্রুটি")) {
      const anomRes = await tools.detectSensorAnomalies(userId, { channelId: targetChannelId });

      if (anomRes.anomalies_detected === 0) {
        return {
          answer: `🔍 **Anomaly Scanner Result** for **${anomRes.channel?.name || "Channel"}**:\n\n` +
            `✅ All sensor readings are within normal statistical envelopes (±2.2σ standard deviation). No abnormal spikes detected.`,
          cards: {},
          actionProposal: null
        };
      }

      const anomLines = anomRes.anomalies.map(a => 
        `• 🚨 **${a.field_key.toUpperCase()} Outlier**:\n` +
        `   - Reading: **${a.current_value}** (Normal Baseline: ${a.normal_range})\n` +
        `   - Severity: **${a.severity.toUpperCase()}** (Z-Score: ${a.z_score})\n` +
        `   - Timestamp: ${new Date(a.timestamp).toLocaleTimeString()}`
      ).join("\n\n");

      return {
        answer: `⚠️ **${anomRes.anomalies_detected} Telemetry Outlier(s) Detected**:\n\n${anomLines}\n\n💡 *Recommendation*: Inspect sensor probe calibration and wire connections.`,
        cards: { anomaliesCard: anomRes.anomalies },
        actionProposal: null
      };
    }

    // ========================================================================
    // LEVEL 1: LATEST SENSOR READINGS & SYSTEM INVENTORY
    // ========================================================================

    // How many devices do I have? / Which sensors are connected?
    if (qLower.includes("how many devices") || qLower.includes("কয়টি ডিভাইস") || qLower.includes("which sensors") || qLower.includes("কয়টি সেন্সর")) {
      const projects = await tools.getUserProjects(userId);
      const devices = await db.all("SELECT id, name, device_type, status FROM devices WHERE user_id = $1", [userId]);
      const channels = await db.all("SELECT c.id, c.name FROM channels c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1", [userId]);
      
      let allSensors = [];
      if (channels.length > 0) {
        allSensors = await db.all("SELECT field_key, name, unit FROM channel_fields WHERE channel_id = $1", [channels[0].id]);
      }

      return {
        answer: `📋 **AgroNexus IoT Inventory**:\n\n` +
          `• **Projects**: ${projects.length} project(s)\n` +
          `• **Channels**: ${channels.length} channel(s) (\`${channels.map(c => c.name).join(", ")}\`)\n` +
          `• **IoT Devices**: ${devices.length} microcontroller node(s) (${devices.filter(d => d.status === "online").length} currently online)\n` +
          `• **Active Sensors**: ${allSensors.length > 0 ? allSensors.map(s => `${s.name} (${s.unit || s.field_key})`).join(", ") : "Configured per channel"}\n\n` +
          `You can ask for specific readings like *"What is my soil moisture?"* or *"Show temperature trend"*.`,
        cards: {},
        actionProposal: null
      };
    }

    // Latest Sensor Data (Default Data Query)
    const latest = await tools.getLatestSensorData(userId, {
      channelId: targetChannelId,
      deviceId: targetDeviceId,
      sensorId: sensorField
    });

    if (latest.status === "no_readings") {
      return {
        answer: `📡 **${latest.channel.name}**: No sensor readings have been recorded yet.\n` +
          `To begin sending data, flash your microcontroller using the **Code Generator** with your Channel Write Key.`,
        cards: {},
        actionProposal: null
      };
    }

    if (latest.readings && latest.readings.length > 0) {
      const timeStr = new Date(latest.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dateStr = new Date(latest.timestamp).toLocaleDateString([], { month: "short", day: "numeric" });

      const readingLines = latest.readings.map(r => {
        const icon = r.field_key.includes("temp") ? "🌡️" : r.field_key.includes("moist") ? "💧" : r.field_key.includes("ph") ? "🧪" : "📊";
        const statusNote = r.status === "warning" ? " ⚠️ *(Out of Normal Range)*" : "";
        return `${icon} **${r.name}**: **${r.value} ${r.unit}**${statusNote}`;
      }).join("\n");

      return {
        answer: `🌱 **Live Sensor Readings — ${latest.channel.name}**\n*Recorded on ${dateStr} at ${timeStr}*:\n\n` +
          `${readingLines}\n\n` +
          `💡 *Ask me for historical trends, anomalies, or to create smart automations.*`,
        cards: { sensorCard: latest },
        actionProposal: null
      };
    }

    // Default Fallback Help Guide
    return {
      answer: `👋 **AgroNexus AI IoT Assistant** is connected to your live farm data.\n\nHere are some things you can ask me:\n` +
        `• 💧 *"What is my soil moisture now?"*\n` +
        `• 🌡️ *"Show temperature trend for the last 7 days"*\n` +
        `• 🔍 *"Find abnormal readings"* or *"Any anomalies?"*\n` +
        `• 📡 *"Is my device online?"* or *"Show device health"*\n` +
        `• 🌾 *"Give me today's daily summary"*\n` +
        `• ⚡ *"Turn on irrigation when soil moisture drops below 30%"*`,
      cards: {},
      actionProposal: null
    };
  }
}
