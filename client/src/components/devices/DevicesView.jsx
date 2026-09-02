import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../../services/api";
import {
  Cpu,
  Plus,
  Wifi,
  Battery,
  Copy,
  Check,
  Trash2,
  Code,
  ArrowLeft,
  X,
  Sparkles,
  Terminal
} from "lucide-react";

export function DevicesView({ onBack, onNavigateToDashboard, onNavigateToCodeGen }) {
  const handleBack = onBack || onNavigateToDashboard;
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  // Register Form State
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("ESP32");
  const [locationName, setLocationName] = useState("Field Sector 1");

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      setLoading(true);
      const res = await api.getDevices();
      setDevices(res.devices);
      if (res.devices.length > 0 && !selectedDevice) {
        setSelectedDevice(res.devices[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!deviceName) return;
    try {
      await api.createDevice({
        name: deviceName,
        device_type: deviceType,
        location_name: locationName
      });
      setDeviceName("");
      setShowRegisterModal(false);
      loadDevices();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteDevice(id) {
    if (!window.confirm("Are you sure you want to remove this IoT device?")) return;
    try {
      await api.deleteDevice(id);
      loadDevices();
    } catch (e) {
      console.error(e);
    }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(""), 2500);
  }

  const sampleCurl = `curl -X POST http://localhost:5050/api/data \\
  -H "Content-Type: application/json" \\
  -d '{
    "device_id": "${selectedDevice?.device_id_code || "ESP32-001"}",
    "api_key": "${selectedDevice?.api_key || "AGX_DEV_ESP32_001_SECRET"}",
    "temperature": 29.5,
    "humidity": 72,
    "co2": 610,
    "battery": 88
  }'`;

  const sampleArduinoCode = `// ESP32 AgroNexus HTTP Ingestion Example
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:5050/api/data";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["device_id"] = "${selectedDevice?.device_id_code || "ESP32-001"}";
    doc["api_key"] = "${selectedDevice?.api_key || "AGX_DEV_KEY"}";
    doc["temperature"] = 28.5; // readDHT()
    doc["humidity"] = 65.0;

    String jsonStr;
    serializeJson(doc, jsonStr);
    int httpResponseCode = http.POST(jsonStr);
    http.end();
  }
  delay(5000);
}`;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            IoT Microcontroller Fleet & Device Keys
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage ESP32, ESP8266, Arduino microcontrollers, generate device secrets and view live health.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register New Device</span>
        </button>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((dev) => {
          const isSelected = selectedDevice?.id === dev.id;
          const isOnline = dev.status === "online";

          return (
            <div
              key={dev.id}
              onClick={() => setSelectedDevice(dev)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                isSelected
                  ? "bg-emerald-50/50 dark:bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/40"
                  : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dev.name}</h4>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{dev.device_id_code}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
                  <span className={`text-[11px] font-bold uppercase ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                    {dev.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Battery className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{dev.battery_level || 85}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Wifi className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>{dev.wifi_rssi || -58} dBm</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Type: {dev.device_type}</span>
                <span>FW: {dev.firmware_version}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Device Code Snippet & Credentials Hub */}
      {selectedDevice && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                  {selectedDevice.device_id_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedDevice.name}</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Location: {selectedDevice.location_name} • IP: {selectedDevice.ip_address || "192.168.1.105"}
              </p>
            </div>

            <button
              onClick={() => handleDeleteDevice(selectedDevice.id)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Device</span>
            </button>
          </div>

          {/* Automatic IoT Code Generator Callout */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-xl border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Automatic Firmware Code Generator
                </span>
                <span className="text-[10px] uppercase font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                  NEW
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Generate ready-to-flash C++ or Python firmware customized for this {selectedDevice.device_type} with sensors, WiFi, and live ingestion.
              </p>
            </div>

            {onNavigateToCodeGen && (
              <button
                type="button"
                onClick={() =>
                  onNavigateToCodeGen({
                    boardId: selectedDevice.device_type?.toLowerCase() === "esp8266" ? "esp8266" : selectedDevice.device_type?.toLowerCase() === "raspberrypi" ? "raspberry_pi" : selectedDevice.device_type?.toLowerCase() === "arduino" ? "arduino_uno" : "esp32",
                    deviceId: selectedDevice.device_id_code,
                    apiKey: selectedDevice.api_key
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Launch Code Generator</span>
              </button>
            )}
          </div>

          {/* Credentials Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Device Secret API Key
              </label>
              <div className="flex items-center justify-between font-mono text-xs text-emerald-600 dark:text-emerald-400 break-all">
                <span>{selectedDevice.api_key}</span>
                <button
                  onClick={() => handleCopy(selectedDevice.api_key, "apikey")}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {copiedKey === "apikey" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Device Auth Secret Token
              </label>
              <div className="flex items-center justify-between font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                <span>{selectedDevice.device_secret}</span>
                <button
                  onClick={() => handleCopy(selectedDevice.device_secret, "secret")}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {copiedKey === "secret" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Code Integration Tabs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Instant Hardware Integration Code
            </h4>

            <div className="space-y-4">
              {/* cURL */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-900/90 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <span>REST API POST /api/data</span>
                  <button
                    onClick={() => handleCopy(sampleCurl, "curl")}
                    className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    {copiedKey === "curl" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                  {sampleCurl}
                </pre>
              </div>

              {/* Arduino ESP32 */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-900/90 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <span>ESP32 Arduino Sketch (.ino)</span>
                  <button
                    onClick={() => handleCopy(sampleArduinoCode, "arduino")}
                    className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    {copiedKey === "arduino" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-56">
                  {sampleArduinoCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Device Modal (Portaled to document.body for 100% responsive centered overlay) */}
      {showRegisterModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Register IoT Microcontroller</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. ESP32 Greenhouse Node #4"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Device Architecture</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="ESP32">ESP32 (Wi-Fi + BLE)</option>
                  <option value="ESP8266">ESP8266 (NodeMCU)</option>
                  <option value="RaspberryPi">Raspberry Pi Gateway</option>
                  <option value="Arduino">Arduino UNO / Mega + W5500</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Deployment Location</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Nursery Hydroponics Rack"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
