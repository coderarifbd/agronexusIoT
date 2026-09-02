import React, { useState, useEffect, useMemo } from "react";
import JSZip from "jszip";
import { BOARDS } from "./data/boards.js";
import { SENSORS } from "./data/sensors.js";
import {
  generateArduinoCode,
  generatePythonCode,
  generateWiringGuide,
  generateReadmeContent,
  validateConfiguration
} from "./engine/codeGeneratorEngine.js";
import {
  Cpu,
  Check,
  Copy,
  Download,
  FileCode,
  AlertTriangle,
  HelpCircle,
  Eye,
  EyeOff,
  Wifi,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  Settings2,
  Terminal,
  Server,
  Zap,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

export function CodeGeneratorView({ prefill = null, onNavigateToDevices, onNavigateToChannels }) {
  // Wizard active step (1: Board, 2: Sensors, 3: Pins, 4: Calibration, 5: Network & Interval, 6: Code & Wiring)
  const [activeStep, setActiveStep] = useState(1);

  // 1. Board Selection
  const [selectedBoardId, setSelectedBoardId] = useState(prefill?.boardId || "esp32");

  // 2. Selected Sensors List: [{ instanceId, sensorId, pins: {}, calibration: {}, fields: {} }]
  const [selectedSensors, setSelectedSensors] = useState(() => {
    if (prefill?.sensors && prefill.sensors.length > 0) return prefill.sensors;
    return [
      {
        instanceId: "dht22_1",
        sensorId: "dht22",
        pins: { DATA: 4 },
        calibration: {},
        fields: { temperature: "temperature", humidity: "humidity" }
      },
      {
        instanceId: "soil_moisture_1",
        sensorId: "soil_moisture",
        pins: { AOUT: 34 },
        calibration: { dryVal: 3200, wetVal: 1400 },
        fields: { soil_moisture: "soil_moisture" }
      }
    ];
  });

  // 3. Network & Credentials State
  const [wifiSsid, setWifiSsid] = useState("AgroFarm_WiFi");
  const [wifiPassword, setWifiPassword] = useState("irrigation@2026");
  const [serverUrl, setServerUrl] = useState(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "localhost";
      return `http://${hostname}:5050/api/data`;
    }
    return "http://localhost:5050/api/data";
  });

  const [deviceId, setDeviceId] = useState(prefill?.deviceId || "ESP32-GREENHOUSE-01");
  const [apiKey, setApiKey] = useState(prefill?.apiKey || "AGX_DEV_B8E920AC3F");
  const [maskApiKey, setMaskApiKey] = useState(true);

  // 4. Data Interval
  const [intervalOption, setIntervalOption] = useState("15"); // '1', '5', '10', '15', '30', '60', '300', 'custom'
  const [customInterval, setCustomInterval] = useState(15);

  // 5. Code Viewer State
  const [copied, setCopied] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState("code"); // 'code' | 'wiring' | 'readme'

  // Apply prefill updates if passed
  useEffect(() => {
    if (prefill) {
      if (prefill.boardId && BOARDS[prefill.boardId]) setSelectedBoardId(prefill.boardId);
      if (prefill.deviceId) setDeviceId(prefill.deviceId);
      if (prefill.apiKey) setApiKey(prefill.apiKey);
      if (prefill.serverUrl) setServerUrl(prefill.serverUrl);
    }
  }, [prefill]);

  // Derived transmission interval in seconds
  const intervalSeconds = useMemo(() => {
    if (intervalOption === "custom") return Math.max(1, Number(customInterval) || 15);
    return Number(intervalOption) || 15;
  }, [intervalOption, customInterval]);

  // Current Board Metadata
  const currentBoard = BOARDS[selectedBoardId] || BOARDS.esp32;

  // Add Sensor to Configuration
  function handleAddSensor(sensorId) {
    const meta = SENSORS[sensorId];
    if (!meta) return;

    const existingCount = selectedSensors.filter((s) => s.sensorId === sensorId).length;
    const instanceId = `${sensorId}_${existingCount + 1}`;

    // Compute default pins based on board
    const defaultPins = {};
    if (meta.pin_requirements) {
      meta.pin_requirements.forEach((p) => {
        const boardPin = p.defaultPin?.[selectedBoardId];
        defaultPins[p.name] = boardPin !== undefined ? boardPin : (selectedBoardId === "esp32" ? 4 : 2);
      });
    }

    // Compute default calibration
    const defaultCalib = {};
    if (meta.calibration_config) {
      meta.calibration_config.forEach((c) => {
        const val = typeof c.default === "object" ? c.default[selectedBoardId] : c.default;
        defaultCalib[c.key] = val !== undefined ? val : 0;
      });
    }

    // Default field mappings
    const defaultFields = {};
    meta.fields.forEach((f) => {
      defaultFields[f.key] = f.key;
    });

    setSelectedSensors([
      ...selectedSensors,
      {
        instanceId,
        sensorId,
        pins: defaultPins,
        calibration: defaultCalib,
        fields: defaultFields
      }
    ]);
  }

  // Remove Sensor
  function handleRemoveSensor(index) {
    setSelectedSensors(selectedSensors.filter((_, i) => i !== index));
  }

  // Update Sensor Pin
  function handlePinChange(index, pinKey, newPinValue) {
    const updated = [...selectedSensors];
    updated[index].pins = {
      ...updated[index].pins,
      [pinKey]: isNaN(Number(newPinValue)) ? newPinValue : Number(newPinValue)
    };
    setSelectedSensors(updated);
  }

  // Update Calibration Field
  function handleCalibChange(index, calibKey, newVal) {
    const updated = [...selectedSensors];
    updated[index].calibration = {
      ...updated[index].calibration,
      [calibKey]: Number(newVal)
    };
    setSelectedSensors(updated);
  }

  // Validation Result
  const validation = useMemo(() => {
    return validateConfiguration(selectedBoardId, selectedSensors);
  }, [selectedBoardId, selectedSensors]);

  // Generate Code Live
  const generatedCode = useMemo(() => {
    if (currentBoard.platform === "python") {
      return generatePythonCode({
        selectedSensors,
        server: { serverUrl },
        credentials: { deviceId, apiKey },
        intervalSeconds
      });
    } else {
      return generateArduinoCode({
        boardId: selectedBoardId,
        selectedSensors,
        wifi: { ssid: wifiSsid, password: wifiPassword },
        server: { serverUrl },
        credentials: { deviceId, apiKey },
        intervalSeconds
      });
    }
  }, [selectedBoardId, selectedSensors, wifiSsid, wifiPassword, serverUrl, deviceId, apiKey, intervalSeconds, currentBoard]);

  // Wiring Guide
  const wiringGuide = useMemo(() => {
    return generateWiringGuide(selectedBoardId, selectedSensors);
  }, [selectedBoardId, selectedSensors]);

  // Readme Content
  const readmeContent = useMemo(() => {
    return generateReadmeContent({
      boardId: selectedBoardId,
      selectedSensors,
      wifi: { ssid: wifiSsid, password: wifiPassword },
      server: { serverUrl },
      credentials: { deviceId, apiKey },
      intervalSeconds
    });
  }, [selectedBoardId, selectedSensors, wifiSsid, wifiPassword, serverUrl, deviceId, apiKey, intervalSeconds]);

  // Copy Code to Clipboard
  function handleCopyCode() {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Download Single File (.ino or .py)
  function handleDownloadFile() {
    const filename = `AgroNexus_${deviceId.replace(/[^a-zA-Z0-9_-]/g, "_")}.${currentBoard.fileExtension}`;
    const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Download Full ZIP Archive (with Sketch, Wiring Guide README, and Config)
  async function handleDownloadZip() {
    try {
      const zip = new JSZip();
      const folderName = `AgroNexus_${deviceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      const folder = zip.folder(folderName);

      // 1. Sketch file
      folder.file(`${folderName}.${currentBoard.fileExtension}`, generatedCode);

      // 2. Comprehensive README
      folder.file("README.md", readmeContent);

      // 3. Configuration Snapshot
      folder.file(
        "config.json",
        JSON.stringify(
          {
            board: selectedBoardId,
            deviceId,
            sensors: selectedSensors,
            intervalSeconds,
            generatedAt: new Date().toISOString()
          },
          null,
          2
        )
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folderName}_Firmware_Package.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to package zip:", err);
      alert("Error creating ZIP archive: " + err.message);
    }
  }

  // Categories of sensors for filtering
  const [sensorCategory, setSensorCategory] = useState("all");
  const categories = ["all", "Climate & Air", "Soil & Agriculture", "Water Quality", "Light & Solar"];

  const filteredSensors = useMemo(() => {
    return Object.values(SENSORS).filter((s) => {
      if (sensorCategory === "all") return true;
      return s.category === sensorCategory;
    });
  }, [sensorCategory]);

  return (
    <div className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 animate-fadeIn transition-colors text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              Developer Studio
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">v2.4 Production Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Automatic IoT Firmware Code Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate compile-ready, production firmware sketches for ESP32, ESP8266, Arduino, and Raspberry Pi with dynamic sensor drivers & telemetry ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToDevices && (
            <button
              onClick={onNavigateToDevices}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Device Fleet
            </button>
          )}
          {onNavigateToChannels && (
            <button
              onClick={onNavigateToChannels}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              My Channels
            </button>
          )}
        </div>
      </div>

      {/* Interactive Step Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-medium text-xs">
        {[
          { step: 1, title: "1. Select Board", icon: Cpu },
          { step: 2, title: `2. Sensors (${selectedSensors.length})`, icon: Layers },
          { step: 3, title: "3. Pin Config", icon: Settings2 },
          { step: 4, title: "4. Calibration", icon: Zap },
          { step: 5, title: "5. Network & Timing", icon: Clock },
          { step: 6, title: "6. Code & Wiring", icon: Terminal }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Validation Warnings (if any) */}
      {!validation.valid && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Configuration Notice:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            Hardware Warning:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            {validation.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================== STEP 1: SELECT BOARD ==================== */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Step 1: Choose Target Microcontroller / Board</span>
            </h2>
            <span className="text-xs text-slate-400">Selected: {currentBoard.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(BOARDS).map((board) => {
              const isSelected = selectedBoardId === board.id;
              return (
                <div
                  key={board.id}
                  onClick={() => setSelectedBoardId(board.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {board.shortName}
                      </span>
                      {board.hasWifi ? (
                        <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                          <Wifi className="w-3 h-3" /> Wi-Fi Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Ethernet / External
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{board.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{board.category}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono text-slate-600 dark:text-slate-400">
                      <div>Logic Level: <span className="font-bold text-slate-800 dark:text-slate-200">{board.voltage}</span></div>
                      <div>Language: <span className="font-bold text-slate-800 dark:text-slate-200">{board.language === "cpp" ? "Arduino C++ (.ino)" : "Python 3 (.py)"}</span></div>
                      <div>ADCs Available: <span className="font-bold text-slate-800 dark:text-slate-200">{board.adcPins.length} pins</span></div>
                    </div>
                  </div>

                  <div className="mt-5 pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {isSelected ? "Active Target" : "Click to Select"}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <span>Next: Select Sensors</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: SELECT SENSORS ==================== */}
      {activeStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Step 2: Choose Attached Sensors
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can select multiple sensors. Each will be assigned pins and telemetry fields automatically.
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSensorCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    sensorCategory === cat
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {cat === "all" ? "All Sensors" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Currently Selected Sensors Pills */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Active Sensors on this Device ({selectedSensors.length})
              </span>
              {selectedSensors.length === 0 && (
                <span className="text-xs text-rose-500 font-semibold">Please add at least one sensor</span>
              )}
            </div>

            {selectedSensors.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">
                No sensors added yet. Browse the catalog below and click "+ Add Sensor" to attach one.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedSensors.map((s, idx) => {
                  const meta = SENSORS[s.sensorId];
                  if (!meta) return null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {meta.shortName} #{idx + 1}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                            {meta.interface.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {meta.measurements.join(", ")}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveSensor(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Remove Sensor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sensor Catalog Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((sensor) => {
              const isSupported = sensor.supported_boards.includes(selectedBoardId);
              const countAdded = selectedSensors.filter((s) => s.sensorId === sensor.sensor_id).length;

              return (
                <div
                  key={sensor.sensor_id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    isSupported
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {sensor.category}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {sensor.interface}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {sensor.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {sensor.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-1">
                      {sensor.fields.map((f) => (
                        <span
                          key={f.key}
                          className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20"
                        >
                          {f.name} ({f.unit})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {countAdded > 0 ? `${countAdded} added` : "Not added"}
                    </span>
                    <button
                      type="button"
                      disabled={!isSupported}
                      onClick={() => handleAddSensor(sensor.sensor_id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isSupported
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Sensor</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Board</span>
            </button>
            <button
              disabled={selectedSensors.length === 0}
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <span>Next: Pin Configuration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: CONFIGURE PINS ==================== */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 3: Configure Hardware Pins & Interfaces
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign microcontroller GPIO pins for each sensor. The system validates against hardware capabilities and alerts if conflicts exist.
            </p>
          </div>

          <div className="space-y-4">
            {selectedSensors.map((s, idx) => {
              const meta = SENSORS[s.sensorId];
              if (!meta) return null;

              return (
                <div
                  key={idx}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {meta.name} (Unit #{idx + 1})
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        {meta.interface.toUpperCase()} Interface
                      </span>
                    </div>
                  </div>

                  {/* Pin Selection Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {meta.pin_requirements?.map((req) => {
                      const currentVal = s.pins?.[req.name];
                      const isAdc = req.type === "adc";
                      const availablePins = isAdc ? currentBoard.adcPins : currentBoard.digitalPins;

                      return (
                        <div key={req.name} className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {req.label || req.name}
                          </label>

                          {meta.interface === "i2c" ? (
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
                              {req.name === "SDA"
                                ? `I2C SDA: ${currentBoard.i2c?.sda}`
                                : `I2C SCL: ${currentBoard.i2c?.scl}`}
                              <span className="block text-[10px] text-slate-400 mt-0.5">Shared hardware I2C bus</span>
                            </div>
                          ) : (
                            <select
                              value={currentVal !== undefined ? currentVal : ""}
                              onChange={(e) => handlePinChange(idx, req.name, e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                            >
                              {availablePins.map((p) => (
                                <option key={p.pin} value={p.pin}>
                                  {p.label || `GPIO ${p.pin}`} {p.recommended ? "★ (Recommended)" : ""}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}

                    {/* Field Keys Mapping */}
                    {meta.fields.map((f) => (
                      <div key={f.key} className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          JSON Payload Key for {f.name}
                        </label>
                        <input
                          type="text"
                          value={s.fields?.[f.key] || f.key}
                          onChange={(e) => {
                            const updated = [...selectedSensors];
                            updated[idx].fields = {
                              ...updated[idx].fields,
                              [f.key]: e.target.value
                            };
                            setSelectedSensors(updated);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                          placeholder="e.g. temperature"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Sensors</span>
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <span>Next: Sensor Calibration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 4: CONFIGURE CALIBRATION ==================== */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 4: Sensor Settings & Calibration Curves
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set reference points for analog sensors. The code generator injects mathematical slope and normalization equations directly into firmware.
            </p>
          </div>

          {selectedSensors.filter((s) => SENSORS[s.sensorId]?.calibration_required).length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                No Calibration Required for Selected Sensors
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                All of your selected sensors (e.g. DHT22, BH1750, DS18B20) are pre-calibrated digital transducers with factory laser-trimmed accuracy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSensors.map((s, idx) => {
                const meta = SENSORS[s.sensorId];
                if (!meta || !meta.calibration_required) return null;

                return (
                  <div
                    key={idx}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {meta.name} (Unit #{idx + 1})
                      </span>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                        {meta.interface.toUpperCase()} Calibration
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {meta.calibration_config?.map((calib) => {
                        const currentVal = s.calibration?.[calib.key];
                        return (
                          <div key={calib.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {calib.label}
                              </label>
                              <span className="text-xs font-mono font-bold text-emerald-600">
                                {currentVal !== undefined ? currentVal : ""}
                              </span>
                            </div>
                            <input
                              type="number"
                              step="any"
                              value={currentVal !== undefined ? currentVal : ""}
                              onChange={(e) => handleCalibChange(idx, calib.key, e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                            />
                            <p className="text-[11px] text-slate-400">{calib.help}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Pins</span>
            </button>
            <button
              onClick={() => setActiveStep(5)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <span>Next: Network & Interval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 5: CONFIGURE NETWORK & INTERVAL ==================== */}
      {activeStep === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 5: Network Connectivity & Ingestion Timing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure your local network parameters and telemetry transmission frequency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wi-Fi Credentials */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>Wi-Fi Network Configuration</span>
              </h3>

              {currentBoard.hasWifi ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wi-Fi SSID (Network Name)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                      placeholder="e.g. MyHomeWiFi_2.4G"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wi-Fi Password
                    </label>
                    <input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                      placeholder="WPA2 Pre-Shared Key"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {currentBoard.name} connects via Ethernet Shield (W5100/W5500) using DHCP. No Wi-Fi credentials needed.
                </p>
              )}
            </div>

            {/* Server Endpoint & Credentials */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>AgroNexus Server & Ingestion Key</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HTTP REST Telemetry Endpoint
                  </label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                    placeholder="http://192.168.1.9:5050/api/data"
                  />
                  <span className="text-[11px] text-slate-400">
                    Use your PC/server's LAN IP address so the hardware can reach it over your router.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Device Identifier
                    </label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Write API Key</span>
                      <button
                        type="button"
                        onClick={() => setMaskApiKey(!maskApiKey)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        {maskApiKey ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </label>
                    <input
                      type={maskApiKey ? "password" : "text"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Interval Selector */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Data Transmission Interval</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { label: "1 Second", val: "1" },
                { label: "5 Seconds", val: "5" },
                { label: "10 Seconds", val: "10" },
                { label: "15 Seconds", val: "15" },
                { label: "30 Seconds", val: "30" },
                { label: "1 Minute", val: "60" },
                { label: "5 Minutes", val: "300" }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setIntervalOption(opt.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                    intervalOption === opt.val
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Or Custom Interval:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="86400"
                  value={customInterval}
                  onChange={(e) => {
                    setCustomInterval(e.target.value);
                    setIntervalOption("custom");
                  }}
                  className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400 font-mono">seconds</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Calibration</span>
            </button>
            <button
              onClick={() => setActiveStep(6)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Code & Wiring Guide</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 6: CODE & WIRING GUIDE ==================== */}
      {activeStep === 6 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Review Bar & Action Buttons */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {currentBoard.shortName} • {selectedSensors.length} Sensor(s)
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-xs font-mono text-slate-500">
                  Every {intervalSeconds}s
                </span>
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white mt-0.5">
                Compile-Ready Firmware Generated
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .{currentBoard.fileExtension}</span>
              </button>

              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#137f3a] hover:bg-[#0f682f] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
                title="Download ZIP with Sketch, README Wiring Guide and Config"
              >
                <FileCode className="w-4 h-4" />
                <span>Download Full ZIP Package</span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>
                <strong>Security Notice:</strong> This firmware contains your device write credentials. Keep the code private and do not commit to public repositories.
              </span>
            </span>
            <button
              onClick={() => setActiveStep(5)}
              className="text-xs font-bold underline hover:text-amber-900 dark:hover:text-white cursor-pointer ml-4"
            >
              Change Key
            </button>
          </div>

          {/* Navigation Output Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveOutputTab("code")}
              className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
                activeOutputTab === "code"
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Firmware Code ({currentBoard.fileExtension.toUpperCase()})</span>
            </button>

            <button
              onClick={() => setActiveOutputTab("wiring")}
              className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
                activeOutputTab === "wiring"
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Hardware Wiring Guide</span>
            </button>

            <button
              onClick={() => setActiveOutputTab("readme")}
              className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
                activeOutputTab === "readme"
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Deployment README</span>
            </button>
          </div>

          {/* TAB 1: CODE EDITOR VIEW */}
          {activeOutputTab === "code" && (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
              <div className="px-4 py-2.5 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-slate-200 text-xs font-sans font-bold">
                    AgroNexus_{deviceId}.{currentBoard.fileExtension}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {currentBoard.platform === "python" ? "Python 3" : "C++ / Arduino IDE"}
                </span>
              </div>

              <pre className="p-5 text-emerald-400 overflow-x-auto max-h-[580px] leading-relaxed select-all">
                {generatedCode}
              </pre>
            </div>
          )}

          {/* TAB 2: HARDWARE WIRING GUIDE */}
          {activeOutputTab === "wiring" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <span>Physical Breadboard & Wiring Instructions</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Board: {currentBoard.name} ({currentBoard.voltage})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono">
                      <th className="py-2.5 px-3">Sensor / Module</th>
                      <th className="py-2.5 px-3">Sensor Pin</th>
                      <th className="py-2.5 px-3">Connect To ({currentBoard.shortName})</th>
                      <th className="py-2.5 px-3">Hardware & Safety Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {wiringGuide.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white font-sans">
                          {item.sensorName}
                        </td>
                        <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">
                          {item.sensorPin}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {item.boardPin}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-sans text-xs">
                          {item.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white block">Board Specific Notes:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {currentBoard.notes?.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOYMENT README */}
          {activeOutputTab === "readme" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {readmeContent}
              </pre>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveStep(5)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Network & Timing</span>
            </button>

            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start New Configuration</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
