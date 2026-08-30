# ?? AgroNexus IoT (MyIoT)

> **Enterprise IoT Telemetry, Device Control & Automation Platform** with real-time WebSockets, Neon PostgreSQL Cloud, Dynamic Channels/Sensor Fields, Rule Automation Engine, and AI Assistant.

---

## ?? Key Highlights

- **?? 2-Tier Master Passkey Authentication**: Unique User ID (`ANAMI-001`), bcrypt hashing, gated access for critical dashboards and actuator control.
- **?? Unlimited Projects & Channels**: Hierarchical architecture (*Smart Agriculture, Weather Station, Smart Home, Water Monitoring, Energy Monitoring*).
- **?? Dynamic Sensor Fields**: No 8-field limitation. Arbitrary dynamic fields per channel (*Temperature, Humidity, Pressure, CO?, Light, Soil NPK, pH, TDS, EC*).
- **?? Microcontroller Fleet & Simulator**: Manage ESP32, ESP8266, Arduino with battery, WiFi RSSI, firmware, and a built-in virtual telemetry simulator.
- **? Live Telemetry & Bidirectional Actuators**: High-throughput REST & WebSocket ingestion (`POST /api/data`), instant switch/relay synchronization.
- **?? Rule Engine & Time Scheduler**: Multi-condition IF-THEN triggers (e.g. *IF Temp > 35?C THEN Turn ON Fan AND Alert*) and daily cron schedules.
- **?? Calibration Studio & Calculated Formulas**: Multi-point linear calibration ($y = mx + c$) and dynamic formulas (e.g. $\text{Power} = \text{Voltage} \times \text{Current}$).
- **?? AI IoT Assistant**: Conversational assistant in Bangla & English (*"?? ? ???? temperature ??? ?????? ???? ????"*, *"Why did the pump turn on?"*), statistical $Z$-Score anomaly detection, and time-series forecasting.
- **?? Analytics, Reports & Public Dashboards**: CSV/JSON exports, automated monthly executive diagnostic reports, and password-protected shareable links.
- **?? Neon PostgreSQL Cloud**: Persistent high-availability cloud database syncing data across all platforms worldwide.

---

## ??? Architecture

```
                               ??????????????????????????
                               ?   IoT Hardware Layer   ?
                               ? (ESP32, ESP8266, etc.) ?
                               ??????????????????????????
                                           ?
                     HTTP POST /api/data   ?   MQTT / WebSocket
                    (API Key + Device ID)  ?
                                           ?
???????????????????????????????????????????????????????????????????????????????
?                          AgroNexus IoT Backend                              ?
?                                                                             ?
?   ? Auth & Master Passkey Gate (BCrypt, Rate Limiting)                      ?
?   ? Dynamic Telemetry Ingest & REST API                                     ?
?   ? Rule Engine & Automated Actuators                                       ?
?   ? Live WebSocket Broadcast Hub                                            ?
?   ? Multi-Point Calibration & Math Evaluator                                ?
?   ? AI Assistant & Anomaly Detection Engine                                 ?
?   ? Neon PostgreSQL Cloud Database (AWS Cluster)                            ?
???????????????????????????????????????????????????????????????????????????????
                                       ? WebSocket / REST API
                                       ?
???????????????????????????????????????????????????????????????????????????????
?                    AgroNexus Frontend (React + Vite)                        ?
?                                                                             ?
?   ? Real-Time Interactive Telemetry Dashboard                               ?
?   ? Custom Widget Builder (Gauges, Multi-Axis Charts, Maps, Tables)         ?
?   ? Actuator Toggle Panel (Pumps, Fans, Grow Lights, Locks)                 ?
?   ? Projects & Dynamic Channels Manager                                     ?
?   ? Calibration Studio & Formula Builder                                    ?
?   ? AI Chatbot Copilot (Bangla & English)                                   ?
?   ? Public Shareable Dashboards & Team Role-Based Access Control             ?
???????????????????????????????????????????????????????????????????????????????
```

---

## ?? Quick Start Guide

### 1. Installation
```bash
git clone https://github.com/coderarifbd/agronexusIoT.git
cd agronexusIoT
npm run install:all
```

### 2. Configure Environment
Create `server/.env`:
```env
DATABASE_URL=postgresql://neondb_owner:npg_2DFU0vpwIWgj@ep-green-snow-ae60fpd3-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=5050
JWT_SECRET=agronexus_super_secure_jwt_secret_2026_x99
```

### 3. Run the Platform
```bash
npm start
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: `http://localhost:5050`
- **WebSocket Stream**: `ws://localhost:5050/ws`

---

## ?? Default Demo Credentials

- **User ID**: `ANAMI-001` (or `tanni` / `tanni@agronexus.iot`)
- **Password**: `password123`
- **Master Passkey**: `passkey123`

---

## ?? Hardware Telemetry Ingest Example

Send data from ESP32 / curl:
```bash
curl -X POST http://localhost:5050/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32-001",
    "api_key": "AGX_DEV_ESP32_001_SECRET",
    "temperature": 29.5,
    "humidity": 72,
    "co2": 610,
    "battery": 88
  }'
```

---

## ?? License
MIT License. Built with ?? for smart agriculture and IoT developers.
