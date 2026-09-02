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

      if (!code.includes("void setup()") || !code.includes("void loop()") || !code.includes("StaticJsonDocument")) {
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
  console.log("Testing live server ingestion with generated nested schema...");
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
      console.log("End-to-end data ingestion verification: PASSED ✓");
    } else {
      console.log("End-to-end data ingestion verification: FAILED", json);
    }
  } catch (err) {
    console.log("Ingestion network error:", err.message);
  }

  process.exit(0);
}

runTests();
