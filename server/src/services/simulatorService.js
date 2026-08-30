import { db } from "../db.js";
import { applySensorCalibration } from "./calibrationEngine.js";
import { evaluateCalculatedFields } from "./formulaEvaluator.js";
import { evaluateAutomationRules } from "./ruleEngine.js";
import { wsHub } from "./websocket.js";

class SimulatorService {
  constructor() {
    this.interval = null;
    this.isRunning = true;
    this.step = 0;
  }

  start() {
    if (this.interval) clearInterval(this.interval);
    this.isRunning = true;
    this.interval = setInterval(() => this.tick(), 4000);
    console.log("? Virtual IoT Device Simulator active (4s interval)");
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.isRunning = false;
  }

  async tick() {
    if (!this.isRunning) return;
    this.step += 1;

    try {
      // 1. Weather Channel (ESP32-001)
      const weatherChannel = await db.get("SELECT id FROM channels WHERE name LIKE '%Weather%' LIMIT 1");
      const devWeather = await db.get("SELECT id FROM devices WHERE device_id_code = 'ESP32-001'");

      if (weatherChannel && devWeather) {
        const baseTemp = 28.5 + 4.0 * Math.sin(this.step / 10);
        const tempNoise = +(Math.random() * 0.6 - 0.3).toFixed(1);
        const temp = +(baseTemp + tempNoise).toFixed(1);
        const hum = Math.round(70 - 15 * Math.sin(this.step / 10) + Math.random() * 2);
        const co2 = Math.round(610 + 40 * Math.sin(this.step / 8) + (Math.random() * 10 - 5));
        const press = +(1012.0 + Math.random() * 0.8).toFixed(1);
        const light = Math.max(0, Math.round(850 + 200 * Math.sin(this.step / 6)));
        const wind = +(7.5 + Math.random() * 3).toFixed(1);

        let rawPayload = {
          temperature: temp,
          humidity: hum,
          pressure: press,
          co2: co2,
          light_intensity: light,
          wind_speed: wind,
          rainfall: 0.0
        };

        let finalPayload = await applySensorCalibration(weatherChannel.id, rawPayload);
        finalPayload = await evaluateCalculatedFields(weatherChannel.id, finalPayload);

        await db.run(`
          INSERT INTO telemetry_data (channel_id, device_id, data_json, timestamp)
          VALUES ($1, $2, $3, NOW())
        `, [weatherChannel.id, devWeather.id, JSON.stringify(finalPayload)]);

        await db.run("UPDATE devices SET last_seen = NOW(), status = 'online' WHERE id = $1", [devWeather.id]);

        wsHub.broadcastTelemetry(weatherChannel.id, finalPayload, devWeather.id);
        await evaluateAutomationRules(weatherChannel.id, finalPayload, devWeather.id);
      }

      // 2. Soil Channel (ESP32-002)
      const soilChannel = await db.get("SELECT id FROM channels WHERE name LIKE '%Soil%' LIMIT 1");
      const devSoil = await db.get("SELECT id FROM devices WHERE device_id_code = 'ESP32-002'");

      if (soilChannel && devSoil) {
        const soilMoisture = +(43.0 + 3.0 * Math.cos(this.step / 12) + (Math.random() * 0.4 - 0.2)).toFixed(1);
        const soilTemp = +(24.8 + Math.sin(this.step / 15)).toFixed(1);

        const soilPayload = {
          soil_moisture: soilMoisture,
          soil_temp: soilTemp,
          nitrogen: 148,
          phosphorus: 64,
          potassium: 182
        };

        await db.run(`
          INSERT INTO telemetry_data (channel_id, device_id, data_json, timestamp)
          VALUES ($1, $2, $3, NOW())
        `, [soilChannel.id, devSoil.id, JSON.stringify(soilPayload)]);

        wsHub.broadcastTelemetry(soilChannel.id, soilPayload, devSoil.id);
      }
    } catch (err) {
      console.error("Simulator tick error:", err);
    }
  }
}

export const simulator = new SimulatorService();
