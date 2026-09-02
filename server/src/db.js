import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { CONFIG } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Prevent unhandled error crashes on idle pool connection resets from cloud DB
pool.on("error", (err) => {
  console.error("⚠️ PostgreSQL idle connection error (handled gracefully):", err.message);
});

// Clean helper wrappers for PostgreSQL async queries
export const db = {
  async query(text, params) {
    return pool.query(text, params);
  },
  async get(text, params) {
    const res = await pool.query(text, params);
    return res.rows[0] || null;
  },
  async all(text, params) {
    const res = await pool.query(text, params);
    return res.rows;
  },
  async run(text, params) {
    return pool.query(text, params);
  }
};

export async function initDatabase() {
  console.log("?? Connecting to Neon PostgreSQL Cloud Database...");

  const client = await pool.connect();

  try {
    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        user_id_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        passkey_hash TEXT NOT NULL,
        profile_pic TEXT,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS login_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Projects Table
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'folder',
        color TEXT DEFAULT '#10B981',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Team Sharing & Permissions
      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Owner', 'Admin', 'Editor', 'Viewer')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. Channels Table (Unlimited per project)
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        channel_number INT,
        api_write_key TEXT UNIQUE NOT NULL,
        api_read_key TEXT UNIQUE NOT NULL,
        is_public INT DEFAULT 0,
        public_slug TEXT UNIQUE,
        public_password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 5. Dynamic Sensor Fields Table (Unlimited per channel)
      CREATE TABLE IF NOT EXISTS channel_fields (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        field_key TEXT NOT NULL,
        name TEXT NOT NULL,
        unit TEXT,
        icon TEXT DEFAULT 'activity',
        min_value DOUBLE PRECISION,
        max_value DOUBLE PRECISION,
        color TEXT DEFAULT '#3B82F6',
        field_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(channel_id, field_key)
      );

      -- 6. Calculated Fields Table
      CREATE TABLE IF NOT EXISTS calculated_fields (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        target_field_key TEXT NOT NULL,
        formula TEXT NOT NULL,
        unit TEXT,
        is_active INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 7. Sensor Calibration Table
      CREATE TABLE IF NOT EXISTS sensor_calibrations (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        field_key TEXT NOT NULL,
        points_json TEXT NOT NULL,
        slope DOUBLE PRECISION DEFAULT 1.0,
        intercept DOUBLE PRECISION DEFAULT 0.0,
        is_active INT DEFAULT 1,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(channel_id, field_key)
      );

      -- 8. Devices Table
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
        device_id_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        device_type TEXT DEFAULT 'ESP32',
        api_key TEXT UNIQUE NOT NULL,
        device_secret TEXT NOT NULL,
        status TEXT DEFAULT 'offline',
        last_seen TIMESTAMPTZ,
        ip_address TEXT,
        wifi_rssi INT,
        firmware_version TEXT DEFAULT 'v1.0.0',
        battery_level DOUBLE PRECISION,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        location_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 9. Telemetry / Sensor Data Table
      CREATE TABLE IF NOT EXISTS telemetry_data (
        id BIGSERIAL PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        device_id TEXT,
        data_json TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_telemetry_channel_time ON telemetry_data(channel_id, timestamp DESC);

      -- 10. Actuators Table
      CREATE TABLE IF NOT EXISTS actuators (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        actuator_key TEXT NOT NULL,
        actuator_type TEXT DEFAULT 'switch',
        state TEXT DEFAULT '0',
        icon TEXT DEFAULT 'power',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 11. Automation Rules Table
      CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        conditions_json TEXT NOT NULL,
        actions_json TEXT NOT NULL,
        is_active INT DEFAULT 1,
        last_triggered TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 12. Scheduled Rules Table
      CREATE TABLE IF NOT EXISTS scheduled_rules (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        time_schedule TEXT NOT NULL,
        days_of_week TEXT DEFAULT 'ALL',
        action_type TEXT DEFAULT 'ACTUATOR',
        target_actuator_id TEXT REFERENCES actuators(id) ON DELETE CASCADE,
        target_value TEXT,
        is_active INT DEFAULT 1,
        last_run TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 13. Alerts Table
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id TEXT,
        device_id TEXT,
        rule_id TEXT,
        severity TEXT DEFAULT 'warning',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 14. Activity Logs Table
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id TEXT,
        device_id TEXT,
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata_json TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_logs(user_id, timestamp DESC);

      -- 15. Dashboard Widgets Table
      CREATE TABLE IF NOT EXISTS dashboard_widgets (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        widget_type TEXT NOT NULL,
        field_key TEXT,
        chart_type TEXT DEFAULT 'line',
        config_json TEXT,
        grid_x INT DEFAULT 0,
        grid_y INT DEFAULT 0,
        grid_w INT DEFAULT 6,
        grid_h INT DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Migration: Ensure channels table has user_id for strict isolation
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS user_id TEXT;
      UPDATE channels SET user_id = (SELECT user_id FROM projects WHERE projects.id = channels.project_id) WHERE user_id IS NULL;
    `);

    console.log("? Neon PostgreSQL schemas verified.");

    await seedDefaultData(client);
  } finally {
    client.release();
  }
}

async function seedDefaultData(client) {
  const userCheck = await client.query("SELECT COUNT(*) as count FROM users");
  if (parseInt(userCheck.rows[0].count, 10) > 0) {
    console.log("? Cloud database already populated with user data.");
    return;
  }

  console.log("?? Seeding initial AgroNexus IoT Cloud Database with ANAMI-001...");

  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync("password123", 10);
  const passkeyHash = bcrypt.hashSync("passkey123", 10);

  // 1. User
  await client.query(`
    INSERT INTO users (id, user_id_code, name, username, email, password_hash, passkey_hash, profile_pic, role)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    userId,
    "ANAMI-001",
    "Tanni",
    "tanni",
    "tanni@agronexus.iot",
    passwordHash,
    passkeyHash,
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "admin"
  ]);

  // 2. Projects
  const p1Id = uuidv4();
  const p2Id = uuidv4();
  const p3Id = uuidv4();
  const p4Id = uuidv4();
  const p5Id = uuidv4();

  const insertProj = `INSERT INTO projects (id, user_id, name, description, icon, color) VALUES ($1, $2, $3, $4, $5, $6)`;
  await client.query(insertProj, [p1Id, userId, "Smart Agriculture", "Autonomous farm, greenhouse and soil moisture management", "sprout", "#10B981"]);
  await client.query(insertProj, [p2Id, userId, "Weather Station", "Ambient meteorological parameters, CO2 & rain tracking", "cloud-sun", "#3B82F6"]);
  await client.query(insertProj, [p3Id, userId, "Smart Home", "Residential lighting, HVAC, power usage and security", "home", "#8B5CF6"]);
  await client.query(insertProj, [p4Id, userId, "Water Monitoring", "Reservoir levels, pH, TDS, and auto-irrigation pumps", "droplets", "#06B6D4"]);
  await client.query(insertProj, [p5Id, userId, "Energy Monitoring", "Solar inverter telemetry, voltage, current and load wattage", "zap", "#F59E0B"]);

  // 3. Channels for Smart Agriculture
  const cSoilId = uuidv4();
  const cWeatherId = uuidv4();
  const cWaterId = uuidv4();
  const cIrrigationId = uuidv4();
  const cGreenhouseId = uuidv4();

  const insertChan = `INSERT INTO channels (id, project_id, name, description, channel_number, api_write_key, api_read_key, is_public, public_slug) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
  await client.query(insertChan, [cSoilId, p1Id, "Soil Monitoring", "Real-time NPK, Soil Moisture & Temperature", 1, "AGX_WR_SOIL_991823", "AGX_RD_SOIL_110293", 1, "soil-station-anami001"]);
  await client.query(insertChan, [cWeatherId, p1Id, "Weather Monitoring", "Temperature, Humidity, Pressure, Wind, Solar", 2, "AGX_WR_WEATH_449102", "AGX_RD_WEATH_552190", 1, "weather-live-anami001"]);
  await client.query(insertChan, [cWaterId, p1Id, "Water Level & Quality", "Tank capacity, pH, TDS, and water temperature", 3, "AGX_WR_WAT_772819", "AGX_RD_WAT_881920", 0, null]);
  await client.query(insertChan, [cIrrigationId, p1Id, "Irrigation Automation", "Actuator relays, flow rates, and solenoid valves", 4, "AGX_WR_IRR_331902", "AGX_RD_IRR_992817", 0, null]);
  await client.query(insertChan, [cGreenhouseId, p1Id, "Greenhouse Climate", "CO2 ppm, Ventilation fans, Grow lights", 5, "AGX_WR_GH_551029", "AGX_RD_GH_662910", 0, null]);

  // 4. Dynamic Sensor Fields for Weather
  const insertField = `INSERT INTO channel_fields (id, channel_id, field_key, name, unit, icon, min_value, max_value, color, field_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
  await client.query(insertField, [uuidv4(), cWeatherId, "temperature", "Temperature", "?C", "thermometer", -10, 60, "#EF4444", 1]);
  await client.query(insertField, [uuidv4(), cWeatherId, "humidity", "Humidity", "%", "droplet", 0, 100, "#3B82F6", 2]);
  await client.query(insertField, [uuidv4(), cWeatherId, "pressure", "Pressure", "hPa", "gauge", 800, 1200, "#8B5CF6", 3]);
  await client.query(insertField, [uuidv4(), cWeatherId, "co2", "CO? Concentration", "ppm", "wind", 300, 2000, "#10B981", 4]);
  await client.query(insertField, [uuidv4(), cWeatherId, "light_intensity", "Light Intensity", "Lux", "sun", 0, 100000, "#F59E0B", 5]);
  await client.query(insertField, [uuidv4(), cWeatherId, "wind_speed", "Wind Speed", "km/h", "compass", 0, 150, "#06B6D4", 6]);
  await client.query(insertField, [uuidv4(), cWeatherId, "rainfall", "Rainfall", "mm", "cloud-rain", 0, 500, "#6366F1", 7]);

  // Dynamic Fields for Soil
  await client.query(insertField, [uuidv4(), cSoilId, "soil_moisture", "Soil Moisture", "%", "droplets", 0, 100, "#10B981", 1]);
  await client.query(insertField, [uuidv4(), cSoilId, "soil_temp", "Soil Temperature", "?C", "thermometer", 0, 50, "#F97316", 2]);
  await client.query(insertField, [uuidv4(), cSoilId, "nitrogen", "Nitrogen (N)", "mg/kg", "flask", 0, 300, "#8B5CF6", 3]);
  await client.query(insertField, [uuidv4(), cSoilId, "phosphorus", "Phosphorus (P)", "mg/kg", "flask", 0, 200, "#EC4899", 4]);
  await client.query(insertField, [uuidv4(), cSoilId, "potassium", "Potassium (K)", "mg/kg", "flask", 0, 300, "#3B82F6", 5]);

  // Dynamic Fields for Water
  await client.query(insertField, [uuidv4(), cWaterId, "ph", "pH Level", "pH", "activity", 0, 14, "#8B5CF6", 1]);
  await client.query(insertField, [uuidv4(), cWaterId, "tds", "TDS", "ppm", "filter", 0, 2000, "#06B6D4", 2]);
  await client.query(insertField, [uuidv4(), cWaterId, "water_level", "Water Level", "%", "bar-chart-2", 0, 100, "#3B82F6", 3]);
  await client.query(insertField, [uuidv4(), cWaterId, "water_temp", "Water Temp", "?C", "thermometer", 0, 50, "#EF4444", 4]);
  await client.query(insertField, [uuidv4(), cWaterId, "ec", "Electrical Cond.", "?S/cm", "zap", 0, 4000, "#F59E0B", 5]);

  // 5. Devices
  const dev1Id = uuidv4();
  const dev2Id = uuidv4();
  const dev3Id = uuidv4();

  const insertDev = `
    INSERT INTO devices (
      id, user_id, channel_id, device_id_code, name, device_type, api_key, device_secret,
      status, last_seen, ip_address, wifi_rssi, firmware_version, battery_level, latitude, longitude, location_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, $13, $14, $15, $16)
  `;

  await client.query(insertDev, [
    dev1Id, userId, cWeatherId, "ESP32-001", "ESP32 Weather Station", "ESP32",
    "AGX_DEV_ESP32_001_SECRET", "sec_esp32_001_xyz99",
    "online", "192.168.1.105", -58, "v2.1.4-agro", 88.5, 23.8103, 90.4125, "Field A - Weather Mast"
  ]);

  await client.query(insertDev, [
    dev2Id, userId, cSoilId, "ESP32-002", "ESP32 Soil & NPK Station", "ESP32",
    "AGX_DEV_ESP32_002_SECRET", "sec_esp32_002_xyz99",
    "online", "192.168.1.106", -64, "v2.0.1-soil", 94.0, 23.8115, 90.4138, "Greenhouse Sector 1"
  ]);

  await client.query(insertDev, [
    dev3Id, userId, cWaterId, "ESP8266-003", "ESP8266 Water Sensor", "ESP8266",
    "AGX_DEV_ESP8266_003_SECRET", "sec_esp8266_003_xyz99",
    "online", "192.168.1.107", -72, "v1.8.0-aqua", 45.0, 23.8090, 90.4110, "Reservoir Main Tank"
  ]);

  // 6. Actuators
  const actPumpId = uuidv4();
  const actFanId = uuidv4();
  const actLightId = uuidv4();
  const actValveId = uuidv4();

  const insertAct = `INSERT INTO actuators (id, channel_id, device_id, name, actuator_key, actuator_type, state, icon) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
  await client.query(insertAct, [actPumpId, cWaterId, dev3Id, "Irrigation Water Pump", "water_pump", "switch", "0", "droplet"]);
  await client.query(insertAct, [actFanId, cWeatherId, dev1Id, "Greenhouse Cooling Fan", "cooling_fan", "switch", "1", "wind"]);
  await client.query(insertAct, [actLightId, cWeatherId, dev1Id, "Grow Light Panel", "grow_light", "switch", "0", "sun"]);
  await client.query(insertAct, [actValveId, cSoilId, dev2Id, "Drip Solenoid Valve #1", "solenoid_valve_1", "switch", "0", "sliders"]);

  // 7. Calculated Fields
  await client.query(`
    INSERT INTO calculated_fields (id, channel_id, name, target_field_key, formula, unit, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, 1)
  `, [uuidv4(), cWeatherId, "Heat Index", "heat_index", "temperature + 0.33 * (humidity / 100 * 6.105 * exp(17.27 * temperature / (237.7 + temperature))) - 4.0", "?C"]);

  // 8. Calibration
  await client.query(`
    INSERT INTO sensor_calibrations (id, channel_id, field_key, points_json, slope, intercept, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, 1)
  `, [
    uuidv4(),
    cWaterId,
    "ph",
    JSON.stringify([
      { buffer: 4.0, reading: 4.12 },
      { buffer: 7.0, reading: 7.18 },
      { buffer: 10.0, reading: 9.85 }
    ]),
    0.985,
    -0.08
  ]);

  // 9. Automation Rules
  const insertRule = `INSERT INTO automation_rules (id, channel_id, name, description, conditions_json, actions_json, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
  await client.query(insertRule, [
    uuidv4(),
    cWeatherId,
    "High Temperature Auto Fan",
    "Turn ON Cooling Fan when temperature exceeds 35?C",
    JSON.stringify([{ field_key: "temperature", operator: ">", value: 35, logical_op: "AND" }]),
    JSON.stringify([
      { action_type: "ACTUATOR", target_id: actFanId, target_value: "1", message: "Turn ON Greenhouse Cooling Fan" },
      { action_type: "ALERT", target_id: "system", severity: "warning", message: "Temperature exceeded 35?C. Cooling fan activated." }
    ]),
    1
  ]);

  await client.query(insertRule, [
    uuidv4(),
    cWaterId,
    "Low Water Level Emergency Alert",
    "Trigger alert and stop pump if water level drops below 20%",
    JSON.stringify([{ field_key: "water_level", operator: "<", value: 20, logical_op: "AND" }]),
    JSON.stringify([
      { action_type: "ACTUATOR", target_id: actPumpId, target_value: "0", message: "Turn OFF Water Pump to protect motor" },
      { action_type: "ALERT", target_id: "system", severity: "critical", message: "Critical: Water Level < 20% (Low Water Alert)!" }
    ]),
    1
  ]);

  // 10. Scheduled Rules
  await client.query(`
    INSERT INTO scheduled_rules (id, channel_id, name, time_schedule, days_of_week, action_type, target_actuator_id, target_value, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
  `, [uuidv4(), cWaterId, "Morning Farm Irrigation Cycle", "08:00", "ALL", "ACTUATOR", actPumpId, "1"]);

  // 11. Dashboard Widgets
  const insertWid = `INSERT INTO dashboard_widgets (id, channel_id, title, widget_type, field_key, chart_type, config_json, grid_x, grid_y, grid_w, grid_h) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
  await client.query(insertWid, [uuidv4(), cWeatherId, "Temperature Live Gauge", "gauge", "temperature", "gauge", JSON.stringify({ min: 0, max: 50, unit: "?C" }), 0, 0, 4, 4]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "Humidity Radial", "gauge", "humidity", "gauge", JSON.stringify({ min: 0, max: 100, unit: "%" }), 4, 0, 4, 4]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "CO? Concentration", "number", "co2", "number", JSON.stringify({ unit: "ppm", threshold: 1000 }), 8, 0, 4, 4]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "Temperature & Humidity History", "chart", "temperature", "line", JSON.stringify({ multiFields: ["temperature", "humidity"] }), 0, 4, 8, 5]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "Cooling Fan Actuator", "switch", "cooling_fan", "switch", JSON.stringify({ actuator_id: actFanId }), 8, 4, 4, 2]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "Grow Lights Relay", "switch", "grow_light", "switch", JSON.stringify({ actuator_id: actLightId }), 8, 6, 4, 2]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "Weather Station Map Location", "map", "device_location", "map", JSON.stringify({ device_id: dev1Id }), 0, 9, 12, 4]);
  await client.query(insertWid, [uuidv4(), cWeatherId, "Recent Telemetry Feed", "table", "all", "table", JSON.stringify({ pageSize: 10 }), 0, 13, 12, 5]);

  // 12. Seed Historical Telemetry Data in Cloud
  const insertData = `INSERT INTO telemetry_data (channel_id, device_id, data_json, timestamp) VALUES ($1, $2, $3, NOW() - ($4 || ' minutes')::interval)`;

  for (let i = 48; i >= 0; i--) {
    const minsAgo = String(i * 30);
    const tempVal = +(27.0 + 6.5 * Math.sin((48 - i) / 5) + (Math.random() * 0.8 - 0.4)).toFixed(1);
    const humVal = +(70 - 15 * Math.sin((48 - i) / 5) + (Math.random() * 2 - 1)).toFixed(1);
    const co2Val = Math.round(580 + 120 * Math.sin((48 - i) / 7) + (Math.random() * 20 - 10));
    const pressVal = +(1012.5 + (Math.random() * 2 - 1)).toFixed(1);
    const lightVal = Math.max(0, Math.round(850 * Math.sin((48 - i) / 6)));
    const windVal = +(8.5 + (Math.random() * 4 - 2)).toFixed(1);

    const payload = {
      temperature: tempVal,
      humidity: humVal,
      pressure: pressVal,
      co2: co2Val,
      light_intensity: lightVal,
      wind_speed: windVal,
      rainfall: 0.0
    };

    await client.query(insertData, [cWeatherId, dev1Id, JSON.stringify(payload), minsAgo]);
  }

  // 13. Activity Logs
  const insertLog = `INSERT INTO activity_logs (id, user_id, channel_id, device_id, event_type, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' hours')::interval)`;
  await client.query(insertLog, [uuidv4(), userId, cWeatherId, dev1Id, "SYSTEM_INIT", "AgroNexus IoT Core Cloud Connected via Neon PostgreSQL", "2"]);
  await client.query(insertLog, [uuidv4(), userId, cWeatherId, dev1Id, "DEVICE_CONNECT", "ESP32 Weather Station connected via Wi-Fi (IP 192.168.1.105)", "1"]);

  // 14. Alerts
  const insertAlert = `INSERT INTO alerts (id, user_id, channel_id, device_id, severity, title, message, is_read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW() - ($8 || ' minutes')::interval)`;
  await client.query(insertAlert, [uuidv4(), userId, cWeatherId, dev1Id, "info", "Weather Station Online", "ESP32-001 connected to Neon Cloud telemetry stream", "45"]);

  console.log("? AgroNexus IoT Neon PostgreSQL Database populated with ANAMI-001!");
}
