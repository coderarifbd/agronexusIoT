// Automated Verification Test for AgroNexus IoT Code Generator
import {
  generateArduinoCode,
  generatePythonCode,
  generateWiringGuide,
  validateConfiguration
} from "../client/src/components/codegen/engine/codeGeneratorEngine.js";

async function runTests() {
  console.log("==================================================");
  console.log("  AgroNexus IoT Code Generator - Verification Test");
  console.log("==================================================\n");

  const testCases = [
    {
      id: 1,
      name: "ESP32 + DHT22",
      boardId: "esp32",
      sensors: [
        {
          sensorId: "dht22",
          pins: { DATA: 4 },
          fields: { temperature: "temperature", humidity: "humidity" }
        }
      ],
      expectedIncludes: ["<WiFi.h>", "<HTTPClient.h>", "<ArduinoJson.h>", "<DHT.h>"]
    },
    {
      id: 2,
      name: "ESP32 + Soil Moisture",
      boardId: "esp32",
      sensors: [
        {
          sensorId: "soil_moisture",
          pins: { AOUT: 34 },
          calibration: { dryVal: 3200, wetVal: 1400 },
          fields: { soil_moisture: "soil_moisture" }
        }
      ],
      expectedIncludes: ["<WiFi.h>", "<HTTPClient.h>", "<ArduinoJson.h>"]
    },
    {
      id: 3,
      name: "ESP32 + DHT22 + Soil Moisture",
      boardId: "esp32",
      sensors: [
        {
          sensorId: "dht22",
          pins: { DATA: 4 },
          fields: { temperature: "temperature", humidity: "humidity" }
        },
        {
          sensorId: "soil_moisture",
          pins: { AOUT: 34 },
          calibration: { dryVal: 3200, wetVal: 1400 },
          fields: { soil_moisture: "soil_moisture" }
        }
      ],
      expectedIncludes: ["<WiFi.h>", "<HTTPClient.h>", "<ArduinoJson.h>", "<DHT.h>"]
    },
    {
      id: 4,
      name: "ESP32 + DHT22 + pH + TDS",
      boardId: "esp32",
      sensors: [
        {
          sensorId: "dht22",
          pins: { DATA: 4 },
          fields: { temperature: "temperature", humidity: "humidity" }
        },
        {
          sensorId: "ph_sensor",
          pins: { PO: 35 },
          calibration: { neutralVoltage: 1.50, acidVoltage: 2.03 },
          fields: { ph: "ph" }
        },
        {
          sensorId: "tds_sensor",
          pins: { AOUT: 32 },
          calibration: { tdsFactor: 0.5, assumedTemp: 25.0 },
          fields: { tds: "tds" }
        }
      ],
      expectedIncludes: ["<WiFi.h>", "<HTTPClient.h>", "<ArduinoJson.h>", "<DHT.h>"]
    },
    {
      id: 5,
      name: "ESP32 + BH1750",
      boardId: "esp32",
      sensors: [
        {
          sensorId: "bh1750",
          pins: { SDA: 21, SCL: 22 },
          fields: { lux: "lux" }
        }
      ],
      expectedIncludes: ["<WiFi.h>", "<HTTPClient.h>", "<ArduinoJson.h>", "<BH1750.h>", "<Wire.h>"]
    },
    {
      id: 6,
      name: "ESP32 + DS18B20",
      boardId: "esp32",
      sensors: [
        {
          sensorId: "ds18b20",
          pins: { DATA: 15 },
          fields: { temperature: "temperature" }
        }
      ],
      expectedIncludes: ["<WiFi.h>", "<HTTPClient.h>", "<ArduinoJson.h>", "<OneWire.h>", "<DallasTemperature.h>"]
    },
    {
      id: 7,
      name: "Arduino Uno + Soil Moisture",
      boardId: "arduino_uno",
      sensors: [
        {
          sensorId: "soil_moisture",
          pins: { AOUT: "A0" },
          calibration: { dryVal: 650, wetVal: 280 },
          fields: { soil_moisture: "soil_moisture" }
        }
      ],
      expectedIncludes: ["<SPI.h>", "<Ethernet.h>", "<ArduinoJson.h>"]
    },
    {
      id: 8,
      name: "Raspberry Pi + DHT22",
      boardId: "raspberry_pi",
      sensors: [
        {
          sensorId: "dht22",
          pins: { DATA: 4 },
          fields: { temperature: "temperature", humidity: "humidity" }
        }
      ],
      expectedPython: true
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    process.stdout.write(`Testing [${tc.id}/8] ${tc.name}... `);

    // 1. Validation
    const valRes = validateConfiguration(tc.boardId, tc.sensors);
    if (!valRes.valid) {
      console.log(`FAILED Validation: ${valRes.errors.join(", ")}`);
      continue;
    }

    // 2. Wiring Guide Generation
    const wiring = generateWiringGuide(tc.boardId, tc.sensors);
    if (!wiring || wiring.length === 0) {
      console.log(`FAILED: Wiring guide empty!`);
      continue;
    }

    // 3. Code Generation
    let code = "";
    if (tc.expectedPython) {
      code = generatePythonCode({
        selectedSensors: tc.sensors,
        server: { serverUrl: "http://localhost:5050/api/data" },
        credentials: { deviceId: "RPI-TEST-01", apiKey: "TEST_KEY_SECRET" },
        intervalSeconds: 15
      });

      if (!code.includes("adafruit_dht.DHT22") || !code.includes("requests.post")) {
        console.log(`FAILED: Python code missing expected structures!`);
        continue;
      }
    } else {
      code = generateArduinoCode({
        boardId: tc.boardId,
        selectedSensors: tc.sensors,
        wifi: { ssid: "TestWiFi", password: "Password123" },
        server: { serverUrl: "http://localhost:5050/api/data" },
        credentials: { deviceId: "TEST-DEV-01", apiKey: "TEST_KEY_SECRET" },
        intervalSeconds: 15
      });

      let missingInc = false;
      for (const inc of tc.expectedIncludes) {
        if (!code.includes(inc)) {
          console.log(`FAILED: Missing include ${inc}!`);
          missingInc = true;
          break;
        }
      }
      if (missingInc) continue;

      if (!code.includes("void setup()") || !code.includes("void loop()") || !code.includes("doc")) {
        console.log(`FAILED: Missing setup/loop/json in Arduino code!`);
        continue;
      }
    }

    console.log("PASSED ✓");
    passed++;
  }

  console.log(`\n==================================================`);
  console.log(`  Tests Passed: ${passed} / ${testCases.length}`);
  console.log(`==================================================\n`);

  // 4. Test Live Data Ingestion with Generated Schema into Neon Cloud
  console.log("Testing live server ingestion with Channel Write Key...");
  try {
    const { db } = await import("./src/db.js");
    const ch = await db.get("SELECT id, api_write_key FROM channels LIMIT 1");

    const testPayload = {
      device_id: "ESP32-MOISTURE-01",
      api_key: ch ? ch.api_write_key : "AGX_WR_3FFD5BF2D099",
      data: {
        field1: 42.5,
        temperature: 27.6,
        humidity: 68.2,
        soil_moisture: 55.0
      }
    };

    const res = await fetch("http://localhost:5050/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    const json = await res.json();
    console.log("Ingestion HTTP Status:", res.status);
    console.log("Server Response:", json);

    if (res.status === 200 && json.success) {
      console.log("Channel Write Key Ingestion: PASSED ✓");
    } else {
      console.log("Channel Write Key Ingestion: FAILED", json);
    }

    // 5. Test Live Ingestion via Registered Device Credentials
    console.log("\nTesting live server ingestion using Device Credentials...");
    const dev = await db.get("SELECT id, device_id_code, api_key, channel_id FROM devices LIMIT 1");
    if (dev) {
      const devPayload = {
        device_id: dev.device_id_code,
        api_key: dev.api_key,
        data: {
          field1: 58.0,
          temperature: 29.1,
          humidity: 62.4
        }
      };

      const devRes = await fetch("http://localhost:5050/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(devPayload)
      });

      const devJson = await devRes.json();
      console.log("Device Ingestion HTTP Status:", devRes.status);
      console.log("Device Response:", devJson);

      if (devRes.status === 200 && devJson.success) {
        console.log("Device Credentials Ingestion: PASSED ✓");
      } else {
        console.log("Device Credentials Ingestion: FAILED", devJson);
      }
    }

    // 6. Verify Data is Stored in Neon Database
    console.log("\nVerifying telemetry storage in Neon Cloud PostgreSQL...");
    const latestFeed = await db.get(
      "SELECT id, channel_id, data_json, timestamp FROM telemetry_data WHERE channel_id = $1 ORDER BY timestamp DESC LIMIT 1",
      [ch.id]
    );

    if (latestFeed && latestFeed.data_json) {
      console.log("Latest Database Telemetry Record:", latestFeed);
      console.log("Database Persistence Verification: PASSED ✓");
    } else {
      console.log("Database Persistence Verification: FAILED (No record found)");
    }
  } catch (err) {
    console.log("Ingestion test error:", err.message);
  }

  process.exit(0);
}

runTests();
