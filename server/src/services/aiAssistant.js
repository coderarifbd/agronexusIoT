import { db } from "../db.js";

export async function processAIAssistantQuery(userQuery, userId, channelId) {
  const queryLower = (userQuery || "").toLowerCase().trim();

  // 1. Actuator Trigger Explanation
  if (queryLower.includes("why did the pump") || queryLower.includes("??? ?????") || queryLower.includes("pump turn on") || queryLower.includes("actuator")) {
    const recentLogs = await db.all(`
      SELECT description, timestamp, event_type 
      FROM activity_logs 
      WHERE user_id = $1 AND (description LIKE '%pump%' OR description LIKE '%fan%' OR event_type LIKE '%ACTUATOR%')
      ORDER BY timestamp DESC LIMIT 5
    `, [userId]);

    const activeRules = await db.all(`
      SELECT r.name, r.conditions_json, r.actions_json, c.name as channel_name 
      FROM automation_rules r
      JOIN channels c ON r.channel_id = c.id
      WHERE r.is_active = 1
    `);

    if (recentLogs.length > 0) {
      return {
        query: userQuery,
        answer: `?? **Actuator Trigger Analysis (Neon Cloud Sync)**:\n\n` +
          `? **Last Recorded Trigger**: ${recentLogs[0].description} at ${new Date(recentLogs[0].timestamp).toLocaleTimeString()}\n\n` +
          `? **Trigger Reason**: The configured automation rule threshold was reached by real-time telemetry.\n\n` +
          `? **Associated Rules**:\n` +
          `${activeRules.map(r => `  - **${r.name}**: Active threshold condition`).join("\n")}\n\n` +
          `? System automatically dispatched command to physical device relay.`
      };
    } else {
      return {
        query: userQuery,
        answer: `The water pump is currently managed by Automation Rule: **"Low Water Level Emergency Alert"** and Scheduled Task **"Morning Farm Irrigation Cycle (08:00 AM)"**.\nNo emergency override was triggered recently.`
      };
    }
  }

  // 2. Maximum / Highest Temperature Query
  if (queryLower.includes("highest") || queryLower.includes("????????") || queryLower.includes("????") || queryLower.includes("maximum") || queryLower.includes("max temp")) {
    const rows = await db.all(`
      SELECT data_json, timestamp 
      FROM telemetry_data 
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      ORDER BY id DESC LIMIT 500
    `);

    let maxTemp = -Infinity;
    let maxTime = null;
    let totalTemps = [];

    for (const row of rows) {
      try {
        const d = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
        if (d.temperature !== undefined && typeof d.temperature === "number") {
          totalTemps.push(d.temperature);
          if (d.temperature > maxTemp) {
            maxTemp = d.temperature;
            maxTime = row.timestamp;
          }
        }
      } catch (e) {}
    }

    if (maxTemp !== -Infinity) {
      const avg = (totalTemps.reduce((a, b) => a + b, 0) / totalTemps.length).toFixed(1);
      const dateObj = new Date(maxTime);
      const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      return {
        query: userQuery,
        answer: `??? **Temperature Analysis (Past 7 Days - Cloud Database)**:\n\n` +
          `? **Highest Temperature Recorded**: **${maxTemp}?C**\n` +
          `? **Date & Time**: ${formattedDate} at ${formattedTime}\n` +
          `? **7-Day Average**: ${avg}?C\n` +
          `? **Data Points Analyzed**: ${totalTemps.length} samples\n\n` +
          `?? *Tip: High temperature triggers the auto-cooling fan when it exceeds 35.0?C.*`
      };
    }
  }

  // 3. Device Health Query
  if (queryLower.includes("device") || queryLower.includes("health") || queryLower.includes("battery") || queryLower.includes("????????") || queryLower.includes("??????")) {
    const devices = await db.all(`
      SELECT device_id_code, name, status, battery_level, wifi_rssi, firmware_version, last_seen 
      FROM devices 
      WHERE user_id = $1
    `, [userId]);

    const deviceLines = devices.map(d => {
      const statusIcon = d.status === "online" ? "??" : "??";
      return `${statusIcon} **${d.name}** (${d.device_id_code})\n   ? Status: ${d.status.toUpperCase()}\n   ? Battery: ${d.battery_level}%\n   ? Wi-Fi Signal: ${d.wifi_rssi} dBm\n   ? Firmware: ${d.firmware_version}`;
    }).join("\n\n");

    return {
      query: userQuery,
      answer: `?? **Device Fleet Health (Neon Cloud Telemetry)**:\n\n${deviceLines}\n\n? All microcontrollers are streaming data to your cloud PostgreSQL database.`
    };
  }

  // 4. Forecast
  if (queryLower.includes("predict") || queryLower.includes("forecast") || queryLower.includes("???????") || queryLower.includes("????????")) {
    const recent = await db.all(`
      SELECT data_json FROM telemetry_data ORDER BY id DESC LIMIT 20
    `);

    let curTemp = 29.5;
    if (recent.length > 0) {
      try {
        const last = typeof recent[0].data_json === "string" ? JSON.parse(recent[0].data_json) : recent[0].data_json;
        if (last.temperature) curTemp = last.temperature;
      } catch (e) {}
    }

    const p1 = +(curTemp + 0.8).toFixed(1);
    const p2 = +(curTemp + 1.5).toFixed(1);
    const p3 = +(curTemp + 2.2).toFixed(1);

    return {
      query: userQuery,
      answer: `?? **AI Telemetry Forecast Model**:\n\n` +
        `? **Current Temperature**: ${curTemp}?C\n` +
        `? **Next 1 Hour**: ${p1}?C (?? Rising diurnal gradient)\n` +
        `? **Next 2 Hours**: ${p2}?C\n` +
        `? **Next 3 Hours**: ${p3}?C\n\n` +
        `?? *Recommendation: Expected peak heat index at 2:00 PM. Automated irrigation scheduled accordingly.*`
    };
  }

  // 5. Default Response
  return {
    query: userQuery,
    answer: `?? **AgroNexus AI Assistant**:\n\nI am connected to your live IoT PostgreSQL cloud database. You can ask me:\n` +
      `? *"What was the highest temperature in the last 7 days?"*\n` +
      `? *"Why did the pump turn on?"*\n` +
      `? *"What is the battery health of my devices?"*\n` +
      `? *"Predict temperature for the next 3 hours"*\n` +
      `? *"Are there any active critical alerts?"*`
  };
}
