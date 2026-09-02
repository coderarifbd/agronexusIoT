import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// In-memory token store for Level 4 Action Confirmations (expires in 10 minutes)
const pendingActionTokens = new Map();

/**
 * Clean up expired action tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of pendingActionTokens.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingActionTokens.delete(token);
    }
  }
}, 60 * 1000);

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

export async function verifyUserProjectAccess(userId, projectId) {
  if (!projectId) return false;
  const project = await db.get(
    `SELECT p.id, p.name FROM projects p 
     LEFT JOIN users u ON u.id = $1
     WHERE p.id = $2 AND (
       p.user_id = $1 OR 
       EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_email = u.email)
     )`,
    [userId, projectId]
  );
  return Boolean(project);
}

export async function verifyUserChannelAccess(userId, channelId) {
  if (!channelId) return false;
  const channel = await db.get(
    `SELECT c.id, c.name, c.project_id FROM channels c
     JOIN projects p ON c.project_id = p.id
     LEFT JOIN users u ON u.id = $1
     WHERE c.id = $2 AND (
       p.user_id = $1 OR 
       EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_email = u.email)
     )`,
    [userId, channelId]
  );
  return channel || null;
}

export async function verifyUserDeviceAccess(userId, deviceId) {
  if (!deviceId) return false;
  const device = await db.get(
    `SELECT d.* FROM devices d 
     WHERE (d.id = $1 OR d.device_id_code = $1) AND d.user_id = $2`,
    [deviceId, userId]
  );
  return device || null;
}

export async function verifyUserActuatorAccess(userId, actuatorId) {
  if (!actuatorId) return false;
  const actuator = await db.get(
    `SELECT a.*, c.name as channel_name FROM actuators a
     JOIN channels c ON a.channel_id = c.id
     JOIN projects p ON c.project_id = p.id
     LEFT JOIN users u ON u.id = $1
     WHERE a.id = $2 AND (
       p.user_id = $1 OR 
       EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_email = u.email)
     )`,
    [userId, actuatorId]
  );
  return actuator || null;
}

// ============================================================================
// LEVEL 1: BASIC AI IOT ASSISTANT (Real Data Retrieval)
// ============================================================================

export async function getUserProjects(userId) {
  const projects = await db.all(
    `SELECT p.id, p.name, p.description, p.icon, p.color, p.created_at,
       (SELECT COUNT(*) FROM channels c WHERE c.project_id = p.id) as channel_count
     FROM projects p
     LEFT JOIN users u ON u.id = $1
     WHERE p.user_id = $1 OR 
       EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_email = u.email)
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return projects;
}

export async function getProjectDevices(userId, projectId) {
  const hasAccess = await verifyUserProjectAccess(userId, projectId);
  if (!hasAccess) {
    throw new Error("The requested project is not available for your account.");
  }

  const devices = await db.all(
    `SELECT d.id, d.device_id_code, d.name, d.device_type, d.status,
            d.battery_level, d.wifi_rssi, d.firmware_version, d.last_seen,
            d.location_name, c.name as channel_name, c.id as channel_id
     FROM devices d
     LEFT JOIN channels c ON d.channel_id = c.id
     WHERE d.user_id = $1 AND (c.project_id = $2 OR d.channel_id IS NULL)
     ORDER BY d.name ASC`,
    [userId, projectId]
  );
  return devices;
}

export async function getDeviceSensors(userId, deviceId) {
  const device = await verifyUserDeviceAccess(userId, deviceId);
  if (!device) {
    throw new Error("The requested device is not available for your account.");
  }

  if (!device.channel_id) {
    return { device: { id: device.id, name: device.name }, sensors: [] };
  }

  const fields = await db.all(
    `SELECT id, field_key, name, unit, min_value, max_value, color 
     FROM channel_fields 
     WHERE channel_id = $1 
     ORDER BY field_order ASC`,
    [device.channel_id]
  );

  return {
    device: { id: device.id, code: device.device_id_code, name: device.name, status: device.status },
    channel_id: device.channel_id,
    sensors: fields
  };
}

export async function getLatestSensorData(userId, { deviceId = null, channelId = null, sensorId = null } = {}) {
  let targetChannelId = channelId;

  if (deviceId) {
    const device = await verifyUserDeviceAccess(userId, deviceId);
    if (!device) throw new Error("The requested device is not available for your account.");
    targetChannelId = device.channel_id;
  }

  if (!targetChannelId) {
    // Graceful fallback to user's primary channel
    const primaryChannel = await db.get(
      `SELECT c.id FROM channels c 
       JOIN projects p ON c.project_id = p.id 
       WHERE p.user_id = $1 ORDER BY c.created_at ASC LIMIT 1`,
      [userId]
    );
    if (primaryChannel) targetChannelId = primaryChannel.id;
  }

  if (!targetChannelId) {
    return { status: "no_data", message: "No IoT channels found for your account." };
  }

  const channel = await verifyUserChannelAccess(userId, targetChannelId);
  if (!channel) throw new Error("The requested channel is not available for your account.");

  const fields = await db.all(
    `SELECT field_key, name, unit, min_value, max_value FROM channel_fields WHERE channel_id = $1`,
    [targetChannelId]
  );

  const latestRow = await db.get(
    `SELECT data_json, timestamp FROM telemetry_data WHERE channel_id = $1 ORDER BY timestamp DESC LIMIT 1`,
    [targetChannelId]
  );

  if (!latestRow) {
    return {
      status: "no_readings",
      channel: { id: channel.id, name: channel.name },
      message: "No telemetry data has been received yet for this channel."
    };
  }

  let parsed = {};
  try {
    parsed = typeof latestRow.data_json === "string" ? JSON.parse(latestRow.data_json) : latestRow.data_json;
  } catch (e) {}

  const readings = [];
  for (const field of fields) {
    const val = parsed[field.field_key] ?? parsed[`field${fields.indexOf(field) + 1}`];
    if (val !== undefined && val !== null) {
      readings.push({
        field_key: field.field_key,
        name: field.name,
        value: typeof val === "number" ? Math.round(val * 10) / 10 : val,
        unit: field.unit || "",
        min: field.min_value,
        max: field.max_value,
        status: (field.min_value !== null && val < field.min_value) || (field.max_value !== null && val > field.max_value)
          ? "warning"
          : "normal"
      });
    }
  }

  // If specific sensor was requested, filter for it
  let filteredReadings = readings;
  if (sensorId) {
    const sIdLower = sensorId.toLowerCase().replace(/[^a-z0-9]/g, "");
    filteredReadings = readings.filter(r => 
      r.field_key.toLowerCase().replace(/[^a-z0-9]/g, "").includes(sIdLower) ||
      r.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(sIdLower)
    );
  }

  return {
    status: "ok",
    channel: { id: channel.id, name: channel.name },
    timestamp: latestRow.timestamp,
    readings: filteredReadings.length > 0 ? filteredReadings : readings
  };
}

export async function getDeviceStatus(userId, deviceId) {
  const device = await verifyUserDeviceAccess(userId, deviceId);
  if (!device) throw new Error("The requested device is not available for your account.");

  const now = Date.now();
  const lastSeenMs = device.last_seen ? new Date(device.last_seen).getTime() : 0;
  const isOnline = device.last_seen && (now - lastSeenMs < 10 * 60 * 1000) && device.status === "online";

  return {
    id: device.id,
    code: device.device_id_code,
    name: device.name,
    type: device.device_type,
    is_online: Boolean(isOnline),
    status: isOnline ? "online" : "offline",
    battery_level: device.battery_level !== null ? `${device.battery_level}%` : "Mains Powered",
    wifi_rssi: device.wifi_rssi !== null ? `${device.wifi_rssi} dBm` : "N/A",
    firmware: device.firmware_version || "v1.0.0",
    last_seen: device.last_seen ? new Date(device.last_seen).toISOString() : "Never",
    location: device.location_name || "Unassigned"
  };
}

export async function getProjectSummary(userId, projectId) {
  let pId = projectId;
  if (!pId) {
    const firstProject = await db.get(
      "SELECT id FROM projects WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
      [userId]
    );
    if (firstProject) pId = firstProject.id;
  }

  if (!pId) {
    return { status: "no_project", message: "No projects created yet for this account." };
  }

  const project = await db.get(
    "SELECT id, name, description, created_at FROM projects WHERE id = $1",
    [pId]
  );

  const channels = await db.all("SELECT id, name FROM channels WHERE project_id = $1", [pId]);
  const devices = await db.all("SELECT id, name, status, last_seen, battery_level FROM devices WHERE user_id = $1", [userId]);
  const onlineCount = devices.filter(d => d.status === "online").length;

  const alerts = await db.all(
    "SELECT id, severity, title, created_at FROM alerts WHERE user_id = $1 AND is_read = 0 ORDER BY created_at DESC LIMIT 5",
    [userId]
  );

  return {
    project: { id: project.id, name: project.name, description: project.description },
    total_channels: channels.length,
    total_devices: devices.length,
    online_devices: onlineCount,
    offline_devices: devices.length - onlineCount,
    active_unread_alerts: alerts.length,
    channels: channels.map(c => ({ id: c.id, name: c.name }))
  };
}

// ============================================================================
// LEVEL 2: DATA ANALYSIS & INSIGHTS (Historical & Statistical Calculations)
// ============================================================================

export async function getHistoricalSensorData(userId, { channelId = null, sensorId = null, startTime = null, endTime = null, limit = 60 } = {}) {
  let targetChannelId = channelId;
  if (!targetChannelId) {
    const ch = await db.get(
      "SELECT c.id FROM channels c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1 LIMIT 1",
      [userId]
    );
    if (ch) targetChannelId = ch.id;
  }

  if (!targetChannelId) throw new Error("No channel found for your account.");
  const channel = await verifyUserChannelAccess(userId, targetChannelId);
  if (!channel) throw new Error("The requested channel is not available for your account.");

  const start = startTime ? new Date(startTime) : new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const end = endTime ? new Date(endTime) : new Date();

  const rows = await db.all(
    `SELECT data_json, timestamp 
     FROM telemetry_data 
     WHERE channel_id = $1 AND timestamp >= $2 AND timestamp <= $3 
     ORDER BY timestamp ASC`,
    [targetChannelId, start, end]
  );

  if (rows.length === 0) {
    return { channel_id: targetChannelId, data_points: [], total_count: 0 };
  }

  // Downsample to max `limit` points to avoid overloading
  const step = Math.max(1, Math.floor(rows.length / limit));
  const sampled = [];

  for (let i = 0; i < rows.length; i += step) {
    const row = rows[i];
    let parsed = {};
    try {
      parsed = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
    } catch (e) {}

    sampled.push({
      timestamp: row.timestamp,
      values: parsed
    });
  }

  return {
    channel: { id: channel.id, name: channel.name },
    total_raw_points: rows.length,
    sampled_points_count: sampled.length,
    data_points: sampled
  };
}

export async function getSensorStatistics(userId, { channelId = null, sensorId = "temperature", startTime = null, endTime = null } = {}) {
  let targetChannelId = channelId;
  if (!targetChannelId) {
    const ch = await db.get(
      "SELECT c.id FROM channels c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1 LIMIT 1",
      [userId]
    );
    if (ch) targetChannelId = ch.id;
  }

  if (!targetChannelId) throw new Error("No channel found for your account.");
  const channel = await verifyUserChannelAccess(userId, targetChannelId);
  if (!channel) throw new Error("The requested channel is not available for your account.");

  const field = await db.get(
    `SELECT field_key, name, unit FROM channel_fields 
     WHERE channel_id = $1 AND (field_key = $2 OR LOWER(name) LIKE $3) LIMIT 1`,
    [targetChannelId, sensorId, `%${sensorId.toLowerCase()}%`]
  ) || { field_key: sensorId, name: sensorId, unit: "" };

  const start = startTime ? new Date(startTime) : new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const end = endTime ? new Date(endTime) : new Date();

  const rows = await db.all(
    `SELECT data_json, timestamp 
     FROM telemetry_data 
     WHERE channel_id = $1 AND timestamp >= $2 AND timestamp <= $3 
     ORDER BY timestamp ASC`,
    [targetChannelId, start, end]
  );

  const values = [];
  const timeSeries = [];

  for (const row of rows) {
    try {
      const d = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
      const raw = d[field.field_key] ?? d[sensorId];
      if (typeof raw === "number" && !isNaN(raw)) {
        values.push(raw);
        timeSeries.push({ val: raw, time: row.timestamp });
      }
    } catch (e) {}
  }

  if (values.length === 0) {
    return {
      sensor: field.name,
      field_key: field.field_key,
      status: "no_data",
      message: `No numeric readings found for ${field.name} in the selected period.`
    };
  }

  // 1. Math calculations
  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / count;

  // 2. Median
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // 3. Percentage Change & Trend Direction
  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const percentChange = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : 0;
  
  let trend = "stable";
  if (percentChange > 4) trend = "increasing";
  else if (percentChange < -4) trend = "decreasing";

  // 4. Standard Deviation & Anomaly Score
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  const latestZScore = stdDev > 0 ? Math.abs((lastVal - avg) / stdDev) : 0;

  return {
    sensor: field.name,
    field_key: field.field_key,
    unit: field.unit || "",
    sample_count: count,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    latest_reading: Math.round(lastVal * 10) / 10,
    first_reading: Math.round(firstVal * 10) / 10,
    minimum: Math.round(min * 10) / 10,
    maximum: Math.round(max * 10) / 10,
    average: Math.round(avg * 10) / 10,
    median: Math.round(median * 10) / 10,
    percentage_change: `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}%`,
    trend,
    std_dev: Math.round(stdDev * 100) / 100,
    anomaly_score: Math.round(latestZScore * 10) / 10,
    recent_sparkline: timeSeries.slice(-15).map(pt => pt.val)
  };
}

export async function detectSensorAnomalies(userId, { channelId = null } = {}) {
  let targetChannelId = channelId;
  if (!targetChannelId) {
    const ch = await db.get(
      "SELECT c.id FROM channels c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1 LIMIT 1",
      [userId]
    );
    if (ch) targetChannelId = ch.id;
  }

  if (!targetChannelId) throw new Error("No channel found for your account.");
  const channel = await verifyUserChannelAccess(userId, targetChannelId);
  if (!channel) throw new Error("The requested channel is not available for your account.");

  const rows = await db.all(
    `SELECT data_json, timestamp FROM telemetry_data 
     WHERE channel_id = $1 ORDER BY timestamp DESC LIMIT 100`,
    [targetChannelId]
  );

  if (rows.length < 5) {
    return { anomalies: [], message: "Insufficient telemetry data for statistical anomaly detection." };
  }

  const fieldData = {};
  for (const row of rows) {
    try {
      const d = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
      for (const [k, v] of Object.entries(d)) {
        if (typeof v === "number" && !isNaN(v)) {
          if (!fieldData[k]) fieldData[k] = [];
          fieldData[k].push({ val: v, time: row.timestamp });
        }
      }
    } catch (e) {}
  }

  const anomalies = [];
  for (const [fieldKey, points] of Object.entries(fieldData)) {
    if (points.length < 5) continue;
    const vals = points.map(p => p.val);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);

    const latest = points[0];
    const zScore = stdDev > 0 ? Math.abs((latest.val - mean) / stdDev) : 0;

    if (zScore > 2.2) {
      anomalies.push({
        field_key: fieldKey,
        current_value: latest.val,
        baseline_mean: Math.round(mean * 10) / 10,
        normal_range: `${Math.round((mean - 2 * stdDev) * 10) / 10} to ${Math.round((mean + 2 * stdDev) * 10) / 10}`,
        z_score: Math.round(zScore * 10) / 10,
        timestamp: latest.time,
        severity: zScore > 3.0 ? "critical" : "warning"
      });
    }
  }

  return {
    channel: { id: channel.id, name: channel.name },
    anomalies_detected: anomalies.length,
    anomalies
  };
}

// ============================================================================
// LEVEL 3: PROACTIVE AI MONITORING (Alerts & Health Synthesis)
// ============================================================================

export async function getActiveAlerts(userId, projectId = null) {
  const alerts = await db.all(
    `SELECT a.id, a.channel_id, a.device_id, a.severity, a.title, a.message, a.created_at,
            c.name as channel_name, d.name as device_name
     FROM alerts a
     LEFT JOIN channels c ON a.channel_id = c.id
     LEFT JOIN devices d ON a.device_id = d.id
     WHERE a.user_id = $1 AND a.is_read = 0
     ORDER BY a.created_at DESC LIMIT 10`,
    [userId]
  );
  return alerts;
}

export async function getDeviceHealth(userId, deviceId = null) {
  let devices = [];
  if (deviceId) {
    const dev = await verifyUserDeviceAccess(userId, deviceId);
    if (!dev) throw new Error("The requested device is not available for your account.");
    devices = [dev];
  } else {
    devices = await db.all(
      `SELECT d.id, d.device_id_code, d.name, d.status, d.battery_level, 
              d.wifi_rssi, d.firmware_version, d.last_seen, d.location_name,
              c.name as channel_name
       FROM devices d
       LEFT JOIN channels c ON d.channel_id = c.id
       WHERE d.user_id = $1`,
      [userId]
    );
  }

  const now = Date.now();
  const report = devices.map(d => {
    const lastSeenMs = d.last_seen ? new Date(d.last_seen).getTime() : 0;
    const isOnline = d.last_seen && (now - lastSeenMs < 10 * 60 * 1000) && d.status === "online";
    const batteryLow = d.battery_level !== null && d.battery_level < 20;
    const wifiWeak = d.wifi_rssi !== null && d.wifi_rssi < -80;

    const issues = [];
    if (!isOnline) issues.push("Device offline or communication stalled");
    if (batteryLow) issues.push(`Critically low battery (${d.battery_level}%)`);
    if (wifiWeak) issues.push(`Weak Wi-Fi signal (${d.wifi_rssi} dBm)`);

    return {
      id: d.id,
      code: d.device_id_code,
      name: d.name,
      channel: d.channel_name || "Unmapped",
      status: isOnline ? "online" : "offline",
      battery: d.battery_level !== null ? `${d.battery_level}%` : "Mains",
      wifi: d.wifi_rssi !== null ? `${d.wifi_rssi} dBm` : "N/A",
      firmware: d.firmware_version || "v1.0.0",
      last_seen: d.last_seen ? new Date(d.last_seen).toISOString() : "Never",
      health_rating: issues.length === 0 ? "HEALTHY" : issues.length === 1 ? "WARNING" : "CRITICAL",
      issues
    };
  });

  return {
    total_devices: report.length,
    online_count: report.filter(d => d.status === "online").length,
    offline_count: report.filter(d => d.status === "offline").length,
    devices: report
  };
}

export async function getDailyAISummary(userId, projectId = null) {
  const devicesSummary = await getDeviceHealth(userId);
  const activeAlerts = await getActiveAlerts(userId, projectId);

  // Analyze primary channel telemetry for today vs yesterday
  const primaryChannel = await db.get(
    `SELECT c.id, c.name FROM channels c 
     JOIN projects p ON c.project_id = p.id 
     WHERE p.user_id = $1 ORDER BY c.created_at ASC LIMIT 1`,
    [userId]
  );

  let tempStats = null;
  let moistureStats = null;
  let anomaliesFound = 0;

  if (primaryChannel) {
    try {
      tempStats = await getSensorStatistics(userId, { channelId: primaryChannel.id, sensorId: "temperature" });
      moistureStats = await getSensorStatistics(userId, { channelId: primaryChannel.id, sensorId: "soil_moisture" });
      const anomRes = await detectSensorAnomalies(userId, { channelId: primaryChannel.id });
      anomaliesFound = anomRes.anomalies_detected || 0;
    } catch (e) {}
  }

  return {
    date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
    channel_name: primaryChannel?.name || "All Farm Channels",
    devices_online: devicesSummary.online_count,
    devices_offline: devicesSummary.offline_count,
    total_devices: devicesSummary.total_devices,
    temperature_trend: tempStats?.trend || "stable",
    temperature_change: tempStats?.percentage_change || "0.0%",
    temperature_avg: tempStats?.average ? `${tempStats.average}°C` : "N/A",
    soil_moisture_trend: moistureStats?.trend || "stable",
    soil_moisture_change: moistureStats?.percentage_change || "0.0%",
    soil_moisture_avg: moistureStats?.average ? `${moistureStats.average}%` : "N/A",
    anomalies_count: anomaliesFound,
    critical_alerts_count: activeAlerts.filter(a => a.severity === "critical").length,
    total_alerts_count: activeAlerts.length,
    recommendations: [
      moistureStats?.trend === "decreasing" ? "Soil moisture is steadily decreasing. Ensure irrigation schedules are primed." : null,
      devicesSummary.offline_count > 0 ? `${devicesSummary.offline_count} device(s) offline. Inspect power adapters and Wi-Fi gateways.` : null,
      anomaliesFound > 0 ? `${anomaliesFound} telemetry outlier(s) detected. Verify sensor probe contacts.` : null
    ].filter(Boolean)
  };
}

// ============================================================================
// LEVEL 4: AI AUTOMATION & CONTROL (Safe Proposal & Verification Flow)
// ============================================================================

export async function getAutomationRules(userId, channelId) {
  const channel = await verifyUserChannelAccess(userId, channelId);
  if (!channel) throw new Error("The requested channel is not available for your account.");

  const rules = await db.all("SELECT * FROM automation_rules WHERE channel_id = $1", [channelId]);
  return rules.map(r => {
    let conds = [];
    let acts = [];
    try {
      conds = JSON.parse(r.conditions_json);
      acts = JSON.parse(r.actions_json);
    } catch (e) {}
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      is_active: Boolean(r.is_active),
      conditions: conds,
      actions: acts,
      last_triggered: r.last_triggered
    };
  });
}

/**
 * Generate a safe automation proposal that MUST be explicitly confirmed by user
 */
export async function proposeAutomationRule(userId, { channelId, name, conditions, actions, description = "" }) {
  const channel = await verifyUserChannelAccess(userId, channelId);
  if (!channel) throw new Error("The requested channel is not available for your account.");

  const confirmationToken = crypto.randomBytes(24).toString("hex");
  const proposalData = {
    actionType: "CREATE_AUTOMATION_RULE",
    userId,
    channelId,
    channelName: channel.name,
    name: name || "Smart Auto-Rule",
    description,
    conditions,
    actions,
    createdAt: Date.now()
  };

  pendingActionTokens.set(confirmationToken, proposalData);

  return {
    confirmation_token: confirmationToken,
    action_type: "CREATE_AUTOMATION_RULE",
    channel_name: channel.name,
    summary: `IF ${conditions.map(c => `${c.field_key} ${c.operator} ${c.value}`).join(" AND ")} THEN ${actions.map(a => `${a.action_type || 'ACTUATOR'} -> ${a.target_value}`).join(", ")}`,
    rule_name: name,
    requires_user_confirmation: true,
    expires_in_seconds: 600
  };
}

export async function confirmCreateAutomationRule(userId, confirmationToken) {
  const proposal = pendingActionTokens.get(confirmationToken);
  if (!proposal || proposal.userId !== userId || proposal.actionType !== "CREATE_AUTOMATION_RULE") {
    throw new Error("Invalid or expired action confirmation token. Please request the action again.");
  }

  // Remove used token
  pendingActionTokens.delete(confirmationToken);

  const id = uuidv4();
  await db.run(
    `INSERT INTO automation_rules (id, channel_id, name, description, conditions_json, actions_json, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, 1)`,
    [
      id,
      proposal.channelId,
      proposal.name,
      proposal.description || "Created via AgroNexus AI Assistant",
      JSON.stringify(proposal.conditions),
      JSON.stringify(proposal.actions)
    ]
  );

  // Audit Log
  const logId = uuidv4();
  await db.run(
    `INSERT INTO activity_logs (id, user_id, channel_id, event_type, description, metadata_json)
     VALUES ($1, $2, $3, 'AI_RULE_CREATED', $4, $5)`,
    [
      logId,
      userId,
      proposal.channelId,
      `AI Assistant created automation rule: ${proposal.name}`,
      JSON.stringify({ rule_id: id, conditions: proposal.conditions, actions: proposal.actions })
    ]
  );

  return {
    success: true,
    rule_id: id,
    message: `Automation Rule "${proposal.name}" successfully created and activated.`
  };
}

/**
 * Generate a safe actuator control proposal that MUST be explicitly confirmed by user
 */
export async function proposeControlActuator(userId, { actuatorId, targetState }) {
  const actuator = await verifyUserActuatorAccess(userId, actuatorId);
  if (!actuator) throw new Error("The requested actuator is not available for your account.");

  const confirmationToken = crypto.randomBytes(24).toString("hex");
  const stateLabel = String(targetState) === "1" ? "ON" : "OFF";

  const proposalData = {
    actionType: "CONTROL_ACTUATOR",
    userId,
    actuatorId,
    actuatorName: actuator.name,
    channelId: actuator.channel_id,
    targetState: String(targetState),
    createdAt: Date.now()
  };

  pendingActionTokens.set(confirmationToken, proposalData);

  return {
    confirmation_token: confirmationToken,
    action_type: "CONTROL_ACTUATOR",
    actuator_id: actuator.id,
    actuator_name: actuator.name,
    target_state: String(targetState),
    state_label: stateLabel,
    summary: `Turn ${stateLabel} physical actuator "${actuator.name}" on channel "${actuator.channel_name}"`,
    requires_user_confirmation: true,
    expires_in_seconds: 600
  };
}

export async function confirmControlActuator(userId, confirmationToken, wsHub = null) {
  const proposal = pendingActionTokens.get(confirmationToken);
  if (!proposal || proposal.userId !== userId || proposal.actionType !== "CONTROL_ACTUATOR") {
    throw new Error("Invalid or expired action confirmation token. Please request the action again.");
  }

  pendingActionTokens.delete(confirmationToken);

  await db.run(
    "UPDATE actuators SET state = $1, updated_at = NOW() WHERE id = $2",
    [proposal.targetState, proposal.actuatorId]
  );

  if (wsHub) {
    wsHub.broadcastActuatorChange(proposal.channelId, proposal.actuatorId, proposal.targetState, proposal.actuatorName);
  }

  // Audit Log
  const logId = uuidv4();
  const stateLabel = proposal.targetState === "1" ? "ON" : "OFF";
  await db.run(
    `INSERT INTO activity_logs (id, user_id, channel_id, event_type, description)
     VALUES ($1, $2, $3, 'AI_ACTUATOR_CONTROLLED', $4)`,
    [
      logId,
      userId,
      proposal.channelId,
      `User confirmed AI action: Turned ${proposal.actuatorName} ${stateLabel}`
    ]
  );

  return {
    success: true,
    actuator_id: proposal.actuatorId,
    new_state: proposal.targetState,
    message: `Actuator "${proposal.actuatorName}" successfully turned ${stateLabel}.`
  };
}
