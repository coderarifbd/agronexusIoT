// Code Generation Engine for AgroNexus IoT Platform
import { SENSORS } from "../data/sensors.js";
import { BOARDS } from "../data/boards.js";

/**
 * Validates selected sensors and pin assignments for conflicts.
 */
export function validateConfiguration(boardId, selectedSensors) {
  const errors = [];
  const warnings = [];
  const board = BOARDS[boardId];

  if (!board) {
    errors.push("Invalid board selected.");
    return { valid: false, errors, warnings };
  }

  if (!selectedSensors || selectedSensors.length === 0) {
    errors.push("At least one sensor must be selected.");
    return { valid: false, errors, warnings };
  }

  const assignedPins = new Map(); // pin -> [sensorName]

  for (const s of selectedSensors) {
    const meta = SENSORS[s.sensorId];
    if (!meta) continue;

    // Check board support
    if (!meta.supported_boards.includes(boardId)) {
      errors.push(`${meta.name} is not officially supported on ${board.name}.`);
    }

    // Check pin conflicts
    if (s.pins) {
      for (const [pinRole, pinVal] of Object.entries(s.pins)) {
        if (pinVal === undefined || pinVal === null || pinVal === "") {
          errors.push(`Please assign a pin for ${meta.shortName} (${pinRole}).`);
          continue;
        }

        // I2C pins can be shared among multiple I2C devices!
        if (meta.interface === "i2c") {
          continue;
        }

        const pinKey = String(pinVal);
        if (assignedPins.has(pinKey)) {
          const prev = assignedPins.get(pinKey);
          errors.push(`GPIO Pin ${pinKey} is assigned to both "${prev}" and "${meta.shortName} (${pinRole})". Each digital/analog sensor must use a unique pin.`);
        } else {
          assignedPins.set(pinKey, `${meta.shortName} (${pinRole})`);
        }

        // ADC Pin validation for ESP32
        if (boardId === "esp32" && meta.interface === "analog") {
          const numPin = Number(pinVal);
          if ([0, 2, 4, 12, 13, 14, 15, 25, 26, 27].includes(numPin)) {
            warnings.push(`Pin GPIO ${pinVal} is on ADC2. ADC2 cannot be used simultaneously with Wi-Fi on ESP32. We strongly recommend using ADC1 pins (GPIO 32, 33, 34, 35, 36, 39).`);
          }
        }

        // Input-only pin restriction for digital/bus sensors on ESP32
        if (boardId === "esp32" && meta.interface !== "analog") {
          const numPin = Number(pinVal);
          if ([34, 35, 36, 39].includes(numPin)) {
            errors.push(`GPIO ${pinVal} on ESP32 is an input-only pin without internal pull-ups or output drivers. It cannot be used for ${meta.shortName} (${pinRole}). Please select GPIO 4, 5, 12-27, 32, or 33.`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generates Arduino C++ code (.ino) for ESP32, ESP8266, Arduino Uno, Arduino Nano.
 */
export function generateArduinoCode({
  boardId,
  selectedSensors,
  wifi = {},
  server = {},
  credentials = {},
  intervalSeconds = 15
}) {
  const board = BOARDS[boardId] || BOARDS.esp32;
  const isEsp32 = boardId === "esp32";
  const isEsp8266 = boardId === "esp8266";
  const isArduino = boardId.startsWith("arduino");

  const ssid = wifi.ssid || "YOUR_WIFI_SSID";
  const password = wifi.password || "YOUR_WIFI_PASSWORD";
  const serverUrl = server.serverUrl || `http://${board.defaultServerHost}/api/data`;
  const deviceId = credentials.deviceId || "ESP32-GREENHOUSE-01";
  const apiKey = credentials.apiKey || credentials.writeKey || "AGX_DEV_SECRET_WRITE_KEY";
  const baudRate = isArduino ? 9600 : 115200;

  // 1. Collect and Deduplicate Libraries
  const includes = new Set();
  if (isEsp32) {
    includes.add("#include <WiFi.h>");
    includes.add("#include <HTTPClient.h>");
    includes.add("#include <ArduinoJson.h>");
  } else if (isEsp8266) {
    includes.add("#include <ESP8266WiFi.h>");
    includes.add("#include <ESP8266HTTPClient.h>");
    includes.add("#include <WiFiClient.h>");
    includes.add("#include <ArduinoJson.h>");
  } else if (isArduino) {
    includes.add("#include <SPI.h>");
    includes.add("#include <Ethernet.h>");
    includes.add("#include <ArduinoJson.h>");
  }

  for (const s of selectedSensors) {
    const meta = SENSORS[s.sensorId];
    if (meta && meta.required_libraries) {
      for (const lib of meta.required_libraries) {
        if (lib.header) includes.add(`#include <${lib.header}>`);
      }
    }
  }

  // 2. Global Definitions & Sensor Objects
  const globals = [];
  const setups = [];
  const readBlocks = [];
  const jsonPackets = [];

  selectedSensors.forEach((s, idx) => {
    const meta = SENSORS[s.sensorId];
    if (!meta) return;
    const inst = idx + 1;

    switch (s.sensorId) {
      case "dht22":
      case "dht11": {
        const pin = s.pins?.DATA ?? (isEsp8266 ? "D4" : 4);
        const type = s.sensorId === "dht22" ? "DHT22" : "DHT11";
        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`#define DHTPIN_${inst} ${pin}`);
        globals.push(`#define DHTTYPE_${inst} ${type}`);
        globals.push(`DHT dht_${inst}(DHTPIN_${inst}, DHTTYPE_${inst});`);

        setups.push(`  dht_${inst}.begin();`);

        readBlocks.push(`    // Read ${meta.shortName} #${inst}`);
        readBlocks.push(`    float temp_${inst} = dht_${inst}.readTemperature();`);
        readBlocks.push(`    float hum_${inst} = dht_${inst}.readHumidity();`);
        readBlocks.push(`    if (isnan(temp_${inst}) || isnan(hum_${inst})) {`);
        readBlocks.push(`      Serial.println(F("[ERROR] Failed to read from ${meta.shortName} #${inst}!"));`);
        readBlocks.push(`    } else {`);
        readBlocks.push(`      Serial.print(F("Temperature: ")); Serial.print(temp_${inst}); Serial.println(F(" °C"));`);
        readBlocks.push(`      Serial.print(F("Humidity: ")); Serial.print(hum_${inst}); Serial.println(F(" %"));`);
        readBlocks.push(`      float t_${inst} = round(temp_${inst} * 10.0f) / 10.0f;`);
        readBlocks.push(`      float h_${inst} = round(hum_${inst} * 10.0f) / 10.0f;`);
        readBlocks.push(`      dataObj["${s.fields?.temperature || "temperature"}"] = t_${inst};`);
        readBlocks.push(`      dataObj["${s.fields?.humidity || "humidity"}"] = h_${inst};`);
        if ((s.fields?.temperature || "temperature") !== "temperature") {
          readBlocks.push(`      dataObj["temperature"] = t_${inst};`);
        }
        if ((s.fields?.humidity || "humidity") !== "humidity") {
          readBlocks.push(`      dataObj["humidity"] = h_${inst};`);
        }
        readBlocks.push(`    }`);
        break;
      }

      case "soil_moisture": {
        const pin = s.pins?.AOUT ?? (isEsp8266 ? "A0" : isArduino ? "A0" : 34);
        const dryVal = s.calibration?.dryVal ?? (isEsp32 ? 3200 : isEsp8266 ? 820 : 650);
        const wetVal = s.calibration?.wetVal ?? (isEsp32 ? 1400 : isEsp8266 ? 340 : 280);

        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`const int SOIL_PIN_${inst} = ${pin};`);
        globals.push(`const int SOIL_DRY_${inst} = ${dryVal}; // ADC reading in dry air`);
        globals.push(`const int SOIL_WET_${inst} = ${wetVal}; // ADC reading submerged in water`);

        setups.push(`  pinMode(SOIL_PIN_${inst}, INPUT);`);

        readBlocks.push(`    // Read Soil Moisture Sensor #${inst}`);
        readBlocks.push(`    long soilSum_${inst} = 0;`);
        readBlocks.push(`    for (int i = 0; i < 10; i++) {`);
        readBlocks.push(`      soilSum_${inst} += analogRead(SOIL_PIN_${inst});`);
        readBlocks.push(`      delay(10);`);
        readBlocks.push(`    }`);
        readBlocks.push(`    int rawSoil_${inst} = soilSum_${inst} / 10;`);
        readBlocks.push(`    // Map calibrated dry and wet values to 0.0 - 100.0% moisture`);
        readBlocks.push(`    float soilMoisture_${inst} = map(rawSoil_${inst}, SOIL_DRY_${inst}, SOIL_WET_${inst}, 0, 100);`);
        readBlocks.push(`    soilMoisture_${inst} = constrain(soilMoisture_${inst}, 0.0, 100.0);`);
        readBlocks.push(`    float m_${inst} = round(soilMoisture_${inst} * 10.0f) / 10.0f;`);
        readBlocks.push(`    Serial.print(F("Soil Moisture: ")); Serial.print(m_${inst}); Serial.println(F(" %"));`);
        readBlocks.push(`    dataObj["${s.fields?.soil_moisture || "soil_moisture"}"] = m_${inst};`);
        if ((s.fields?.soil_moisture || "soil_moisture") !== "soil_moisture") {
          readBlocks.push(`    dataObj["soil_moisture"] = m_${inst};`);
        }
        break;
      }

      case "ph_sensor": {
        const pin = s.pins?.PO ?? (isEsp8266 ? "A0" : isArduino ? "A1" : 35);
        const vNeutral = s.calibration?.neutralVoltage ?? (isArduino ? 2.50 : 1.50);
        const vAcid = s.calibration?.acidVoltage ?? (isArduino ? 3.05 : 2.03);
        const adcMax = isEsp32 ? 4095.0 : 1023.0;
        const vRef = isArduino ? 5.0 : 3.3;

        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`const int PH_PIN_${inst} = ${pin};`);
        globals.push(`const float PH_NEUTRAL_V_${inst} = ${Number(vNeutral).toFixed(2)}; // Calibrated pH 7.0 buffer voltage`);
        globals.push(`const float PH_ACID_V_${inst} = ${Number(vAcid).toFixed(2)};    // Calibrated pH 4.0 buffer voltage`);

        setups.push(`  pinMode(PH_PIN_${inst}, INPUT);`);

        readBlocks.push(`    // Read pH Sensor #${inst}`);
        readBlocks.push(`    long phSum_${inst} = 0;`);
        readBlocks.push(`    for (int i = 0; i < 20; i++) {`);
        readBlocks.push(`      phSum_${inst} += analogRead(PH_PIN_${inst});`);
        readBlocks.push(`      delay(5);`);
        readBlocks.push(`    }`);
        readBlocks.push(`    float phVoltage_${inst} = ((float)phSum_${inst} / 20.0) * (${vRef} / ${adcMax});`);
        readBlocks.push(`    // Two-point calibration slope calculation`);
        readBlocks.push(`    float phSlope_${inst} = (7.0 - 4.0) / (PH_NEUTRAL_V_${inst} - PH_ACID_V_${inst});`);
        readBlocks.push(`    float phVal_${inst} = 7.0 + phSlope_${inst} * (phVoltage_${inst} - PH_NEUTRAL_V_${inst});`);
        readBlocks.push(`    phVal_${inst} = constrain(phVal_${inst}, 0.0, 14.0);`);
        readBlocks.push(`    float phFinal_${inst} = round(phVal_${inst} * 100.0f) / 100.0f;`);
        readBlocks.push(`    Serial.print(F("pH Reading: ")); Serial.print(phFinal_${inst}); Serial.println(F(" pH"));`);
        readBlocks.push(`    dataObj["${s.fields?.ph || "ph"}"] = phFinal_${inst};`);
        if ((s.fields?.ph || "ph") !== "ph") {
          readBlocks.push(`    dataObj["ph"] = phFinal_${inst};`);
        }
        break;
      }

      case "tds_sensor": {
        const pin = s.pins?.AOUT ?? (isEsp8266 ? "A0" : isArduino ? "A2" : 32);
        const factor = s.calibration?.tdsFactor ?? 0.5;
        const assumedTemp = s.calibration?.assumedTemp ?? 25.0;
        const adcMax = isEsp32 ? 4095.0 : 1023.0;
        const vRef = isArduino ? 5.0 : 3.3;

        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`const int TDS_PIN_${inst} = ${pin};`);
        globals.push(`const float TDS_FACTOR_${inst} = ${Number(factor).toFixed(2)};`);
        globals.push(`const float TDS_TEMP_COMP_${inst} = ${Number(assumedTemp).toFixed(1)}; // Reference water temp °C`);

        setups.push(`  pinMode(TDS_PIN_${inst}, INPUT);`);

        readBlocks.push(`    // Read TDS / EC Sensor #${inst}`);
        readBlocks.push(`    long tdsSum_${inst} = 0;`);
        readBlocks.push(`    for (int i = 0; i < 20; i++) {`);
        readBlocks.push(`      tdsSum_${inst} += analogRead(TDS_PIN_${inst});`);
        readBlocks.push(`      delay(5);`);
        readBlocks.push(`    }`);
        readBlocks.push(`    float tdsVoltage_${inst} = ((float)tdsSum_${inst} / 20.0) * (${vRef} / ${adcMax});`);
        readBlocks.push(`    // Temperature compensation factor`);
        readBlocks.push(`    float compensationCoeff_${inst} = 1.0 + 0.02 * (TDS_TEMP_COMP_${inst} - 25.0);`);
        readBlocks.push(`    float compVoltage_${inst} = tdsVoltage_${inst} / compensationCoeff_${inst};`);
        readBlocks.push(`    // Conversion curve to PPM`);
        readBlocks.push(`    float tdsValue_${inst} = (133.42 * compVoltage_${inst} * compVoltage_${inst} * compVoltage_${inst} - 255.86 * compVoltage_${inst} * compVoltage_${inst} + 857.39 * compVoltage_${inst}) * 0.5 * TDS_FACTOR_${inst};`);
        readBlocks.push(`    tdsValue_${inst} = max(0.0f, tdsValue_${inst});`);
        readBlocks.push(`    float tdsFinal_${inst} = round(tdsValue_${inst} * 10.0f) / 10.0f;`);
        readBlocks.push(`    Serial.print(F("TDS Value: ")); Serial.print(tdsFinal_${inst}); Serial.println(F(" ppm"));`);
        readBlocks.push(`    dataObj["${s.fields?.tds || "tds"}"] = tdsFinal_${inst};`);
        if ((s.fields?.tds || "tds") !== "tds") {
          readBlocks.push(`    dataObj["tds"] = tdsFinal_${inst};`);
        }
        break;
      }

      case "bh1750": {
        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`BH1750 lightMeter_${inst};`);

        setups.push(`  Wire.begin();`);
        setups.push(`  if (lightMeter_${inst}.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {`);
        setups.push(`    Serial.println(F("[OK] BH1750 Light Sensor #${inst} initialized."));`);
        setups.push(`  } else {`);
        setups.push(`    Serial.println(F("[ERROR] BH1750 Light Sensor #${inst} not found on I2C bus!"));`);
        setups.push(`  }`);

        readBlocks.push(`    // Read BH1750 Light #${inst}`);
        readBlocks.push(`    float lux_${inst} = lightMeter_${inst}.readLightLevel();`);
        readBlocks.push(`    if (lux_${inst} < 0) {`);
        readBlocks.push(`      Serial.println(F("[ERROR] Failed to read BH1750 light level!"));`);
        readBlocks.push(`    } else {`);
        readBlocks.push(`      float luxFinal_${inst} = round(lux_${inst} * 10.0f) / 10.0f;`);
        readBlocks.push(`      Serial.print(F("Light Intensity: ")); Serial.print(luxFinal_${inst}); Serial.println(F(" lx"));`);
        readBlocks.push(`      dataObj["${s.fields?.lux || "lux"}"] = luxFinal_${inst};`);
        if ((s.fields?.lux || "lux") !== "lux") {
          readBlocks.push(`      dataObj["lux"] = luxFinal_${inst};`);
        }
        readBlocks.push(`    }`);
        break;
      }

      case "ds18b20": {
        const pin = s.pins?.DATA ?? (isEsp8266 ? "D3" : isArduino ? 2 : 15);
        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`const int ONE_WIRE_BUS_${inst} = ${pin};`);
        globals.push(`OneWire oneWire_${inst}(ONE_WIRE_BUS_${inst});`);
        globals.push(`DallasTemperature ds18b20_${inst}(&oneWire_${inst});`);

        setups.push(`  ds18b20_${inst}.begin();`);

        readBlocks.push(`    // Read DS18B20 1-Wire Probe #${inst}`);
        readBlocks.push(`    ds18b20_${inst}.requestTemperatures();`);
        readBlocks.push(`    float probeTemp_${inst} = ds18b20_${inst}.getTempCByIndex(0);`);
        readBlocks.push(`    if (probeTemp_${inst} == DEVICE_DISCONNECTED_C || probeTemp_${inst} < -55.0) {`);
        readBlocks.push(`      Serial.println(F("[ERROR] DS18B20 Probe #${inst} disconnected or read error!"));`);
        readBlocks.push(`    } else {`);
        readBlocks.push(`      float probeFinal_${inst} = round(probeTemp_${inst} * 10.0f) / 10.0f;`);
        readBlocks.push(`      Serial.print(F("Water/Soil Probe: ")); Serial.print(probeFinal_${inst}); Serial.println(F(" °C"));`);
        readBlocks.push(`      dataObj["${s.fields?.temperature || "temperature"}"] = probeFinal_${inst};`);
        if ((s.fields?.temperature || "temperature") !== "temperature") {
          readBlocks.push(`      dataObj["temperature"] = probeFinal_${inst};`);
        }
        readBlocks.push(`    }`);
        break;
      }

      case "bme280": {
        globals.push(`// --- ${meta.name} (Unit #${inst}) ---`);
        globals.push(`Adafruit_BME280 bme_${inst};`);

        setups.push(`  Wire.begin();`);
        setups.push(`  if (!bme_${inst}.begin(0x76)) {`);
        setups.push(`    if (!bme_${inst}.begin(0x77)) {`);
        setups.push(`      Serial.println(F("[ERROR] Could not find valid BME280 sensor, check wiring!"));`);
        setups.push(`    }`);
        setups.push(`  }`);

        readBlocks.push(`    // Read BME280 Sensor #${inst}`);
        readBlocks.push(`    float bmeTemp_${inst} = round(bme_${inst}.readTemperature() * 10.0f) / 10.0f;`);
        readBlocks.push(`    float bmeHum_${inst} = round(bme_${inst}.readHumidity() * 10.0f) / 10.0f;`);
        readBlocks.push(`    float bmePress_${inst} = round((bme_${inst}.readPressure() / 100.0F) * 10.0f) / 10.0f;`);
        readBlocks.push(`    Serial.print(F("BME Temp: ")); Serial.print(bmeTemp_${inst}); Serial.println(F(" °C"));`);
        readBlocks.push(`    Serial.print(F("BME Hum: ")); Serial.print(bmeHum_${inst}); Serial.println(F(" %"));`);
        readBlocks.push(`    Serial.print(F("BME Pressure: ")); Serial.print(bmePress_${inst}); Serial.println(F(" hPa"));`);
        readBlocks.push(`    dataObj["${s.fields?.temperature || "temperature"}"] = bmeTemp_${inst};`);
        readBlocks.push(`    dataObj["${s.fields?.humidity || "humidity"}"] = bmeHum_${inst};`);
        readBlocks.push(`    dataObj["${s.fields?.pressure || "pressure"}"] = bmePress_${inst};`);
        if ((s.fields?.temperature || "temperature") !== "temperature") {
          readBlocks.push(`    dataObj["temperature"] = bmeTemp_${inst};`);
        }
        if ((s.fields?.humidity || "humidity") !== "humidity") {
          readBlocks.push(`    dataObj["humidity"] = bmeHum_${inst};`);
        }
        if ((s.fields?.pressure || "pressure") !== "pressure") {
          readBlocks.push(`    dataObj["pressure"] = bmePress_${inst};`);
        }
        break;
      }

      default:
        break;
    }
  });

  // 3. Assemble Complete Sketch
  let sketch = `/**
 * AgroNexus IoT - Automatic Firmware Sketch
 * Target Board: ${board.name}
 * Generated: ${new Date().toISOString()}
 * Device ID: ${deviceId}
 *
 * NOTE: Keep device credentials private.
 */

${Array.from(includes).join("\n")}

// ===================== USER CONFIGURATION =====================
${board.hasWifi ? `const char* WIFI_SSID     = "${ssid}";
const char* WIFI_PASSWORD = "${password}";` : `// Ethernet Configuration (Standard W5100/W5500 Shield)
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
EthernetClient ethClient;`}

const char* SERVER_URL    = "${serverUrl}";
const char* DEVICE_ID     = "${deviceId}";
const char* API_KEY       = "${apiKey}";

// Telemetry interval in milliseconds
const unsigned long POST_INTERVAL_MS = ${intervalSeconds * 1000}UL;
unsigned long lastPostTime = 0;

// ===================== SENSOR DEFINITIONS =====================
${globals.join("\n")}

// ===================== SETUP ROUTINE =====================
void setup() {
  Serial.begin(${baudRate});
  delay(1000);
  Serial.println(F("\\n=========================================="));
  Serial.println(F("   AgroNexus IoT Node Starting..."));
  Serial.println(F("=========================================="));

${board.hasWifi ? `  // Connect to Local Wi-Fi
  Serial.print(F("Connecting to Wi-Fi SSID: "));
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\\n[OK] Wi-Fi Connected!"));
    Serial.print(F("IP Address: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("Signal Strength (RSSI): "));
    Serial.print(WiFi.RSSI());
    Serial.println(F(" dBm"));
  } else {
    Serial.println(F("\\n[WARN] Wi-Fi connection timed out. Will retry in main loop."));
  }` : `  // Initialize Ethernet Shield
  Serial.println(F("Initializing Ethernet via DHCP..."));
  if (Ethernet.begin(mac) == 0) {
    Serial.println(F("[ERROR] Failed to configure Ethernet using DHCP"));
  } else {
    Serial.print(F("[OK] Ethernet configured. IP: "));
    Serial.println(Ethernet.localIP());
  }`}

  // Sensor Inits
${setups.join("\n")}

  Serial.println(F("[OK] All sensors initialized."));
  Serial.println(F("Entering measurement loop...\\n"));
}

// ===================== MAIN LOOP =====================
void loop() {
  // Check telemetry transmission interval
  if (millis() - lastPostTime >= POST_INTERVAL_MS || lastPostTime == 0) {
    lastPostTime = millis();
    transmitSensorTelemetry();
  }

  delay(50); // Yield to background tasks
}

// ===================== SENSOR SAMPLING & INGESTION =====================
void transmitSensorTelemetry() {
  Serial.println(F("\\n------------------------------------------"));
  Serial.println(F("[SAMPLING] Reading all active sensors..."));

  // Prepare JSON Document (Compatible with ArduinoJson v6 & v7)
#if defined(ARDUINOJSON_VERSION_MAJOR) && ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  JsonObject dataObj = doc["data"].to<JsonObject>();
#else
  StaticJsonDocument<768> doc;
  JsonObject dataObj = doc.createNestedObject("data");
#endif
  doc["device_id"] = DEVICE_ID;
  doc["api_key"]   = API_KEY;

${readBlocks.join("\n\n")}

  // Serialize Payload
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print(F("[PAYLOAD] Generated JSON: "));
  Serial.println(jsonPayload);

${isEsp32 || isEsp8266 ? `  // Verify Wi-Fi Status before transmitting
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WARN] Wi-Fi lost! Reconnecting..."));
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  ${isEsp8266 ? "WiFiClient wifiClient;\n  http.begin(wifiClient, SERVER_URL);" : "http.begin(SERVER_URL);"}
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(8000); // 8-second timeout

  Serial.print(F("[HTTP] Transmitting POST to: "));
  Serial.println(SERVER_URL);

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.print(F("[HTTP] Server Response Code: "));
    Serial.println(httpCode);
    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      Serial.println(F("[SUCCESS] Telemetry successfully ingested into AgroNexus cloud!"));
      String response = http.getString();
      Serial.print(F("[RESPONSE] ")); Serial.println(response);
    } else {
      Serial.print(F("[SERVER ERROR] Code: "));
      Serial.println(httpCode);
    }
  } else {
    Serial.print(F("[HTTP ERROR] Failed to connect: "));
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();` : `  // Arduino Uno / Nano Ingest via Ethernet / Network
  Serial.print(F("[NETWORK] Sending payload to: "));
  Serial.println(SERVER_URL);

  // Parse host and port from URL (e.g. http://192.168.1.9:5050/api/data)
  // For basic Arduino EthernetClient:
  if (ethClient.connect("192.168.1.9", 5050)) {
    ethClient.println(F("POST /api/data HTTP/1.1"));
    ethClient.println(F("Host: 192.168.1.9:5050"));
    ethClient.println(F("Content-Type: application/json"));
    ethClient.print(F("Content-Length: "));
    ethClient.println(jsonPayload.length());
    ethClient.println();
    ethClient.println(jsonPayload);
    Serial.println(F("[SUCCESS] Data dispatched via Ethernet."));
    ethClient.stop();
  } else {
    Serial.println(F("[ERROR] Connection to AgroNexus server failed."));
  }`}
}
`;

  return sketch;
}

/**
 * Generates Python 3 code (.py) for Raspberry Pi (Linux).
 */
export function generatePythonCode({
  selectedSensors,
  server = {},
  credentials = {},
  intervalSeconds = 15
}) {
  const serverUrl = server.serverUrl || "http://192.168.1.9:5050/api/data";
  const deviceId = credentials.deviceId || "RPI-GATEWAY-01";
  const apiKey = credentials.apiKey || credentials.writeKey || "AGX_DEV_SECRET_WRITE_KEY";

  const pythonImports = new Set(["import time", "import json", "import requests", "from datetime import datetime"]);
  const sensorInits = [];
  const readBlocks = [];

  selectedSensors.forEach((s, idx) => {
    const meta = SENSORS[s.sensorId];
    if (!meta) return;
    const inst = idx + 1;

    switch (s.sensorId) {
      case "dht22":
      case "dht11": {
        pythonImports.add("import board");
        pythonImports.add("import adafruit_dht");
        const pin = s.pins?.DATA ?? 4;
        const dhtClass = s.sensorId === "dht22" ? "DHT22" : "DHT11";
        sensorInits.push(`dht_sensor_${inst} = adafruit_dht.${dhtClass}(board.D${pin})`);

        readBlocks.push(`        # Read ${meta.shortName} #${inst}`);
        readBlocks.push(`        try:`);
        readBlocks.push(`            temp_${inst} = dht_sensor_${inst}.temperature`);
        readBlocks.push(`            hum_${inst} = dht_sensor_${inst}.humidity`);
        readBlocks.push(`            if temp_${inst} is not None and hum_${inst} is not None:`);
        readBlocks.push(`                data_payload["${s.fields?.temperature || "temperature"}"] = round(temp_${inst}, 1)`);
        readBlocks.push(`                data_payload["${s.fields?.humidity || "humidity"}"] = round(hum_${inst}, 1)`);
        readBlocks.push(`                if "${s.fields?.temperature || "temperature"}" != "temperature":`);
        readBlocks.push(`                    data_payload["temperature"] = round(temp_${inst}, 1)`);
        readBlocks.push(`                if "${s.fields?.humidity || "humidity"}" != "humidity":`);
        readBlocks.push(`                    data_payload["humidity"] = round(hum_${inst}, 1)`);
        readBlocks.push(`                print(f"[DHT22] Temp: {temp_${inst}}°C, Humidity: {hum_${inst}}%")`);
        readBlocks.push(`        except RuntimeError as e:`);
        readBlocks.push(`            print(f"[WARN] DHT read error (retrying next cycle): {e}")`);
        break;
      }

      case "bh1750": {
        pythonImports.add("import smbus2");
        sensorInits.push(`# BH1750 Light Sensor on I2C-1 (Bus 1, Addr 0x23)`);
        sensorInits.push(`i2c_bus = smbus2.SMBus(1)`);
        sensorInits.push(`BH1750_ADDR = 0x23`);

        readBlocks.push(`        # Read BH1750 Light`);
        readBlocks.push(`        try:`);
        readBlocks.push(`            raw_light = i2c_bus.read_i2c_block_data(BH1750_ADDR, 0x20, 2)`);
        readBlocks.push(`            lux = round(((raw_light[0] << 8) + raw_light[1]) / 1.2, 1)`);
        readBlocks.push(`            data_payload["${s.fields?.lux || "lux"}"] = lux`);
        readBlocks.push(`            if "${s.fields?.lux || "lux"}" != "lux":`);
        readBlocks.push(`                data_payload["lux"] = lux`);
        readBlocks.push(`            print(f"[BH1750] Light: {lux} lx")`);
        readBlocks.push(`        except Exception as e:`);
        readBlocks.push(`            print(f"[ERROR] BH1750 I2C error: {e}")`);
        break;
      }

      case "ds18b20": {
        pythonImports.add("from w1thermsensor import W1ThermSensor, Sensor");
        sensorInits.push(`ds18b20_sensor = W1ThermSensor()`);

        readBlocks.push(`        # Read DS18B20 Temperature Probe`);
        readBlocks.push(`        try:`);
        readBlocks.push(`            probe_temp = round(ds18b20_sensor.get_temperature(), 2)`);
        readBlocks.push(`            data_payload["${s.fields?.temperature || "temperature"}"] = probe_temp`);
        readBlocks.push(`            if "${s.fields?.temperature || "temperature"}" != "temperature":`);
        readBlocks.push(`                data_payload["temperature"] = probe_temp`);
        readBlocks.push(`            print(f"[DS18B20] Probe Temp: {probe_temp}°C")`);
        readBlocks.push(`        except Exception as e:`);
        readBlocks.push(`            print(f"[ERROR] DS18B20 1-Wire error: {e}")`);
        break;
      }

      case "bme280": {
        pythonImports.add("import board");
        pythonImports.add("import busio");
        pythonImports.add("import adafruit_bme280");
        sensorInits.push(`i2c = busio.I2C(board.SCL, board.SDA)`);
        sensorInits.push(`bme280_sensor = adafruit_bme280.Adafruit_BME280_I2C(i2c, address=0x76)`);

        readBlocks.push(`        # Read BME280 Environmental`);
        readBlocks.push(`        try:`);
        readBlocks.push(`            t_val = round(bme280_sensor.temperature, 1)`);
        readBlocks.push(`            h_val = round(bme280_sensor.humidity, 1)`);
        readBlocks.push(`            p_val = round(bme280_sensor.pressure, 1)`);
        readBlocks.push(`            data_payload["${s.fields?.temperature || "temperature"}"] = t_val`);
        readBlocks.push(`            data_payload["${s.fields?.humidity || "humidity"}"] = h_val`);
        readBlocks.push(`            data_payload["${s.fields?.pressure || "pressure"}"] = p_val`);
        readBlocks.push(`            if "${s.fields?.temperature || "temperature"}" != "temperature":`);
        readBlocks.push(`                data_payload["temperature"] = t_val`);
        readBlocks.push(`            if "${s.fields?.humidity || "humidity"}" != "humidity":`);
        readBlocks.push(`                data_payload["humidity"] = h_val`);
        readBlocks.push(`            if "${s.fields?.pressure || "pressure"}" != "pressure":`);
        readBlocks.push(`                data_payload["pressure"] = p_val`);
        readBlocks.push(`            print(f"[BME280] T: {t_val}°C, H: {h_val}%, P: {p_val}hPa")`);
        readBlocks.push(`        except Exception as e:`);
        readBlocks.push(`            print(f"[ERROR] BME280 error: {e}")`);
        break;
      }

      default:
        break;
    }
  });

  return `#!/usr/bin/env python3
"""
AgroNexus IoT - Python Gateway Agent
Target Platform: Raspberry Pi (Linux)
Generated: ${new Date().toISOString()}
Device ID: ${deviceId}
"""

${Array.from(pythonImports).join("\n")}

# ===================== CONFIGURATION =====================
SERVER_URL = "${serverUrl}"
DEVICE_ID  = "${deviceId}"
API_KEY    = "${apiKey}"
INTERVAL   = ${intervalSeconds}  # Transmission cycle in seconds

# ===================== SENSOR INITIALIZATIONS =====================
${sensorInits.join("\n")}

def read_and_transmit():
    print(f"\\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Sampling sensors...")
    data_payload = {}

    try:
${readBlocks.join("\n")}
    except Exception as e:
        print(f"[ERROR] Sensor acquisition fault: {e}")

    # Construct AgroNexus Unified Payload
    packet = {
        "device_id": DEVICE_ID,
        "api_key": API_KEY,
        "data": data_payload
    }

    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }

    print(f"[HTTP] Transmitting POST -> {SERVER_URL}")
    print(f"[PAYLOAD] {json.dumps(packet)}")

    try:
        response = requests.post(SERVER_URL, json=packet, headers=headers, timeout=10)
        print(f"[HTTP RESPONSE] Code: {response.status_code}")
        if response.status_code in [200, 201]:
            print(f"[SUCCESS] Telemetry stored in Neon Cloud successfully! -> {response.text}")
        else:
            print(f"[WARN] Server returned non-200 status: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network transmission failed: {e}")

def main():
    print("==================================================")
    print(f"  AgroNexus IoT Gateway Agent [{DEVICE_ID}]")
    print(f"  Destination: {SERVER_URL}")
    print(f"  Sampling Interval: {INTERVAL} seconds")
    print("==================================================")

    while True:
        read_and_transmit()
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
`;
}

/**
 * Builds the Hardware Wiring Guide table for chosen sensors and pins.
 */
export function generateWiringGuide(boardId, selectedSensors) {
  const board = BOARDS[boardId] || BOARDS.esp32;
  const guide = [];

  selectedSensors.forEach((s, idx) => {
    const meta = SENSORS[s.sensorId];
    if (!meta) return;
    const inst = idx + 1;

    meta.wiring_information.forEach((w) => {
      let resolvedBoardPin = w.boardPin;

      // Resolve dynamic pins
      if (w.sensorPin.includes("DATA") || w.sensorPin.includes("PO") || w.sensorPin.includes("AOUT")) {
        const pinKey = Object.keys(s.pins || {})[0];
        const assignedPin = s.pins?.[pinKey];
        if (assignedPin !== undefined) {
          resolvedBoardPin = `${board.shortName} Pin: ${assignedPin}`;
        }
      } else if (w.sensorPin.includes("SDA")) {
        resolvedBoardPin = `${board.shortName} SDA (${board.i2c?.sda || "Pin 21"})`;
      } else if (w.sensorPin.includes("SCL")) {
        resolvedBoardPin = `${board.shortName} SCL (${board.i2c?.scl || "Pin 22"})`;
      }

      guide.push({
        sensorName: `${meta.name} #${inst}`,
        sensorPin: w.sensorPin,
        boardPin: resolvedBoardPin,
        note: w.note
      });
    });
  });

  return guide;
}

/**
 * Generates README Markdown content for the downloadable ZIP bundle.
 */
export function generateReadmeContent({
  boardId,
  selectedSensors,
  wifi,
  server,
  credentials,
  intervalSeconds
}) {
  const board = BOARDS[boardId] || BOARDS.esp32;
  const wiring = generateWiringGuide(boardId, selectedSensors);

  const libraries = [];
  selectedSensors.forEach((s) => {
    const meta = SENSORS[s.sensorId];
    if (meta?.required_libraries) {
      meta.required_libraries.forEach((lib) => {
        if (lib.name && !libraries.includes(lib.name)) libraries.push(lib.name);
      });
    }
  });

  return `# AgroNexus IoT - Firmware Deployment Package

**Device ID:** \`${credentials.deviceId || "ESP32-001"}\`  
**Target Hardware:** ${board.name} (${board.category})  
**Telemetry Destination:** \`${server.serverUrl || "http://localhost:5050/api/data"}\`  
**Transmission Interval:** ${intervalSeconds} seconds  
**Generated At:** ${new Date().toLocaleString()}

---

## 1. Required Libraries (Arduino IDE Library Manager)

Before compiling the sketch, open **Arduino IDE -> Tools -> Manage Libraries...** and install:

${libraries.map((lib) => `- [x] **${lib}**`).join("\n") || "- [x] None (All built-in drivers)"}
- [x] **ArduinoJson** (by Benoit Blanchon - version 6 or 7)

${boardId === "raspberry_pi" ? `### Raspberry Pi Python Dependencies
\`\`\`bash
pip3 install requests smbus2 adafruit-circuitpython-dht w1thermsensor
\`\`\`
` : ""}

---

## 2. Hardware Wiring Reference

Connect your sensors according to this verified pin assignment:

| Sensor & Probe | Sensor Pin | ${board.shortName} Connection | Installation Notes |
| :--- | :--- | :--- | :--- |
${wiring.map((w) => `| ${w.sensorName} | \`${w.sensorPin}\` | **${w.boardPin}** | ${w.note} |`).join("\n")}

---

## 3. Flashing & Upload Instructions

1. Connect your **${board.name}** to your computer via micro-USB / USB-C cable.
2. Open \`firmware.${board.fileExtension}\` in your IDE.
3. Select your board from **Tools -> Board -> ${board.shortName}**.
4. Select the correct serial COM port under **Tools -> Port**.
5. Set Upload Speed to **115200** baud.
6. Click **Upload (Ctrl + U)**.
7. Open **Serial Monitor** at **${board.platform === "arduino" && !boardId.startsWith("arduino") ? "115200" : "9600"} baud** to observe live sensor telemetry transmission!

---

> **SECURITY NOTICE:** Keep your device Write API key private. Never commit firmware files containing production credentials to public GitHub repositories.
`;
}
