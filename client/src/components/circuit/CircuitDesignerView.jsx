import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  CircuitBoard,
  Cpu,
  Zap,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Code,
  Sparkles,
  Layers,
  Check,
  Copy,
  Info,
  Sliders,
  Maximize2
} from "lucide-react";

// ============================================================================
// COMPONENT LIBRARY DEFINITIONS
// ============================================================================

export const COMPONENT_CATALOG = [
  // Microcontrollers
  {
    type: "esp32",
    category: "Microcontrollers",
    name: "ESP32 DevKit V1",
    subtitle: "30-Pin Dual-Core Wi-Fi & BLE MCU",
    color: "#10b981",
    width: 220,
    height: 310,
    pins: [
      { id: "3v3", name: "3V3", type: "power", color: "#ef4444", side: "left" },
      { id: "gnd1", name: "GND", type: "gnd", color: "#1e293b", side: "left" },
      { id: "d15", name: "D15", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d2", name: "D2", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d4", name: "D4", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "rx2", name: "RX2", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "tx2", name: "TX2", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d5", name: "D5", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d18", name: "D18", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d19", name: "D19", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d21", name: "D21 (SDA)", type: "i2c", color: "#8b5cf6", side: "left" },
      { id: "rx0", name: "RX0", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "tx0", name: "TX0", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d22", name: "D22 (SCL)", type: "i2c", color: "#06b6d4", side: "left" },
      { id: "d23", name: "D23", type: "gpio", color: "#3b82f6", side: "left" },

      { id: "vin", name: "VIN (5V)", type: "power", color: "#ef4444", side: "right" },
      { id: "gnd2", name: "GND", type: "gnd", color: "#1e293b", side: "right" },
      { id: "d13", name: "D13", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d12", name: "D12", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d14", name: "D14", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d27", name: "D27", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d26", name: "D26", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d25", name: "D25", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d33", name: "D33", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d32", name: "D32", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d35", name: "D35 (ADC)", type: "adc", color: "#f59e0b", side: "right" },
      { id: "d34", name: "D34 (ADC)", type: "adc", color: "#f59e0b", side: "right" },
      { id: "vn", name: "VN (D39)", type: "adc", color: "#f59e0b", side: "right" },
      { id: "vp", name: "VP (D36)", type: "adc", color: "#f59e0b", side: "right" },
      { id: "en", name: "EN", type: "power", color: "#ef4444", side: "right" }
    ]
  },
  {
    type: "arduino_uno",
    category: "Microcontrollers",
    name: "Arduino Uno R3",
    subtitle: "ATmega328P Development Board",
    color: "#0284c7",
    width: 230,
    height: 310,
    pins: [
      { id: "5v", name: "5V", type: "power", color: "#ef4444", side: "left" },
      { id: "3v3", name: "3.3V", type: "power", color: "#ef4444", side: "left" },
      { id: "gnd1", name: "GND", type: "gnd", color: "#1e293b", side: "left" },
      { id: "gnd2", name: "GND", type: "gnd", color: "#1e293b", side: "left" },
      { id: "vin", name: "VIN", type: "power", color: "#ef4444", side: "left" },
      { id: "a0", name: "A0 (ADC)", type: "adc", color: "#f59e0b", side: "left" },
      { id: "a1", name: "A1 (ADC)", type: "adc", color: "#f59e0b", side: "left" },
      { id: "a2", name: "A2 (ADC)", type: "adc", color: "#f59e0b", side: "left" },
      { id: "a3", name: "A3 (ADC)", type: "adc", color: "#f59e0b", side: "left" },
      { id: "a4", name: "A4 (SDA)", type: "i2c", color: "#8b5cf6", side: "left" },
      { id: "a5", name: "A5 (SCL)", type: "i2c", color: "#06b6d4", side: "left" },

      { id: "d13", name: "D13 (SCK)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d12", name: "D12 (MISO)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d11", name: "D11 (MOSI)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d10", name: "D10 (SS)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d9", name: "D9 (PWM)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d8", name: "D8", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d7", name: "D7", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d6", name: "D6 (PWM)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d5", name: "D5 (PWM)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d4", name: "D4", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d3", name: "D3 (INT1)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d2", name: "D2 (INT0)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d1", name: "D1 (TX)", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d0", name: "D0 (RX)", type: "gpio", color: "#3b82f6", side: "right" }
    ]
  },
  {
    type: "esp8266",
    category: "Microcontrollers",
    name: "ESP8266 NodeMCU",
    subtitle: "Wi-Fi Enabled Microcontroller",
    color: "#6366f1",
    width: 210,
    height: 270,
    pins: [
      { id: "3v3_1", name: "3V3", type: "power", color: "#ef4444", side: "left" },
      { id: "gnd_1", name: "GND", type: "gnd", color: "#1e293b", side: "left" },
      { id: "d1", name: "D1 (SCL)", type: "i2c", color: "#06b6d4", side: "left" },
      { id: "d2", name: "D2 (SDA)", type: "i2c", color: "#8b5cf6", side: "left" },
      { id: "d3", name: "D3", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "d4", name: "D4", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "3v3_2", name: "3V3", type: "power", color: "#ef4444", side: "left" },

      { id: "vin", name: "VIN (5V)", type: "power", color: "#ef4444", side: "right" },
      { id: "gnd_2", name: "GND", type: "gnd", color: "#1e293b", side: "right" },
      { id: "d5", name: "D5", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d6", name: "D6", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d7", name: "D7", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "d8", name: "D8", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "a0", name: "A0 (ADC)", type: "adc", color: "#f59e0b", side: "right" }
    ]
  },

  // Sensors
  {
    type: "soil_moisture",
    category: "Sensors",
    name: "Soil Moisture Sensor",
    subtitle: "Capacitive / Resistive Sensor",
    color: "#b45309",
    width: 170,
    height: 140,
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" },
      { id: "aout", name: "AOUT (Analog)", type: "adc", color: "#f59e0b", side: "bottom" }
    ]
  },
  {
    type: "dht22",
    category: "Sensors",
    name: "DHT22 / DHT11",
    subtitle: "Temperature & Humidity Sensor",
    color: "#059669",
    width: 170,
    height: 140,
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "data", name: "DATA (Signal)", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    type: "ds18b20",
    category: "Sensors",
    name: "DS18B20 Temp Probe",
    subtitle: "Waterproof 1-Wire Digital Probe",
    color: "#dc2626",
    width: 170,
    height: 140,
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "data", name: "DATA (1-Wire)", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    type: "ultrasonic",
    category: "Sensors",
    name: "HC-SR04 Ultrasonic",
    subtitle: "Distance / Tank Level Sensor",
    color: "#2563eb",
    width: 190,
    height: 150,
    pins: [
      { id: "vcc", name: "VCC (5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "trig", name: "TRIG", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "echo", name: "ECHO", type: "gpio", color: "#10b981", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    type: "ldr",
    category: "Sensors",
    name: "LDR Light Sensor",
    subtitle: "Photoresistor Module",
    color: "#d97706",
    width: 160,
    height: 140,
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" },
      { id: "ao", name: "AO (Analog)", type: "adc", color: "#f59e0b", side: "bottom" }
    ]
  },

  // Actuators & Displays
  {
    type: "relay",
    category: "Actuators & Relays",
    name: "5V Relay Module",
    subtitle: "High Power Pump / Fan Switch",
    color: "#7c3aed",
    width: 170,
    height: 140,
    pins: [
      { id: "vcc", name: "VCC (5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" },
      { id: "in", name: "IN (Signal)", type: "gpio", color: "#3b82f6", side: "bottom" }
    ]
  },
  {
    type: "oled",
    category: "Displays",
    name: "0.96\" OLED Display",
    subtitle: "I2C 128x64 SSD1306 Screen",
    color: "#475569",
    width: 170,
    height: 140,
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" },
      { id: "scl", name: "SCL", type: "i2c", color: "#06b6d4", side: "bottom" },
      { id: "sda", name: "SDA", type: "i2c", color: "#8b5cf6", side: "bottom" }
    ]
  }
];



export function CircuitDesignerView({ onNavigateToCodeGen }) {
  // Mode: 'home' (matching user reference image) or 'workspace' (active canvas)
  const [viewMode, setViewMode] = useState("home");
  const [activeProjectName, setActiveProjectName] = useState("Untitled Circuit");

  // Canvas State
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedWire, setSelectedWire] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  // Wire Drafting State (connecting from pin A to pin B)
  const [pendingPin, setPendingPin] = useState(null); // { compId, pinId, pinName, type }

  // Dragging State
  const [draggingCompId, setDraggingCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Canvas Zoom
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);

  // Wire Color Palette
  const [activeWireColor, setActiveWireColor] = useState("#3b82f6");

  // --------------------------------------------------------------------------
  // HOME ACTIONS
  // --------------------------------------------------------------------------
  function handleStartFromScratch() {
    setActiveProjectName("Untitled Circuit Project");
    setComponents([]);
    setWires([]);
    setPendingPin(null);
    setViewMode("workspace");
  }

  // --------------------------------------------------------------------------
  // CANVAS ACTIONS
  // --------------------------------------------------------------------------
  function handleAddComponent(catalogItem) {
    const newId = `${catalogItem.type}_${Date.now().toString().slice(-4)}`;
    // Spread placement
    const count = components.length;
    const newComp = {
      instanceId: newId,
      type: catalogItem.type,
      x: 200 + (count % 3) * 60,
      y: 120 + (count % 3) * 60,
      label: catalogItem.name
    };
    setComponents([...components, newComp]);
    setSelectedComponentId(newId);
  }

  function handleRemoveComponent(instanceId) {
    setComponents(components.filter(c => c.instanceId !== instanceId));
    setWires(wires.filter(w => w.fromComp !== instanceId && w.toComp !== instanceId));
    if (selectedComponentId === instanceId) setSelectedComponentId(null);
  }

  // --------------------------------------------------------------------------
  // DRAGGING SYSTEM
  // --------------------------------------------------------------------------
  function handleMouseDown(e, comp) {
    e.stopPropagation();
    setDraggingCompId(comp.instanceId);
    setSelectedComponentId(comp.instanceId);
    setDragOffset({
      x: e.clientX / zoom - comp.x,
      y: e.clientY / zoom - comp.y
    });
  }

  function handleMouseMove(e) {
    if (!draggingCompId) return;
    const newX = Math.max(20, Math.round((e.clientX / zoom - dragOffset.x) / 10) * 10);
    const newY = Math.max(20, Math.round((e.clientY / zoom - dragOffset.y) / 10) * 10);

    setComponents(prev =>
      prev.map(c => (c.instanceId === draggingCompId ? { ...c, x: newX, y: newY } : c))
    );
  }

  function handleMouseUp() {
    setDraggingCompId(null);
  }

  // --------------------------------------------------------------------------
  // PIN CONNECTION SYSTEM
  // --------------------------------------------------------------------------
  function handlePinClick(e, comp, pin) {
    e.stopPropagation();

    if (!pendingPin) {
      // Start wire drafting
      setPendingPin({
        compId: comp.instanceId,
        compName: comp.label,
        pinId: pin.id,
        pinName: pin.name,
        pinType: pin.type,
        pinColor: pin.color
      });
    } else {
      // Finish wire drafting
      if (pendingPin.compId === comp.instanceId && pendingPin.pinId === pin.id) {
        // Cancel if clicked on same pin
        setPendingPin(null);
        return;
      }

      // Automatically determine appropriate wire color
      let color = activeWireColor;
      if (pendingPin.pinType === "power" || pin.type === "power") color = "#ef4444";
      else if (pendingPin.pinType === "gnd" || pin.type === "gnd") color = "#1e293b";
      else if (pendingPin.pinType === "i2c" || pin.type === "i2c") color = "#8b5cf6";
      else if (pendingPin.pinType === "adc" || pin.type === "adc") color = "#f59e0b";

      const newWire = {
        id: `w_${Date.now()}`,
        fromComp: pendingPin.compId,
        fromPin: pendingPin.pinId,
        toComp: comp.instanceId,
        toPin: pin.id,
        color
      };

      setWires([...wires, newWire]);
      setPendingPin(null);
    }
  }

  function handleRemoveWire(wireId) {
    setWires(wires.filter(w => w.id !== wireId));
    setSelectedWire(null);
  }

  // Compute absolute coordinate for any pin on canvas
  function getPinCoordinates(compId, pinId) {
    const comp = components.find(c => c.instanceId === compId);
    if (!comp) return { x: 0, y: 0 };

    const def = COMPONENT_CATALOG.find(d => d.type === comp.type);
    if (!def) return { x: comp.x, y: comp.y };

    const pin = def.pins.find(p => p.id === pinId);
    if (!pin) return { x: comp.x, y: comp.y };

    // Layout coordinate calculation
    if (pin.side === "left") {
      const pinIndex = def.pins.filter(p => p.side === "left").indexOf(pin);
      return {
        x: comp.x + 8,
        y: comp.y + 42 + pinIndex * 17
      };
    } else if (pin.side === "right") {
      const pinIndex = def.pins.filter(p => p.side === "right").indexOf(pin);
      return {
        x: comp.x + def.width - 8,
        y: comp.y + 42 + pinIndex * 17
      };
    } else {
      // Bottom pins
      const bottomPins = def.pins.filter(p => p.side === "bottom");
      const pinIndex = bottomPins.indexOf(pin);
      const spacing = def.width / (bottomPins.length + 1);
      return {
        x: comp.x + spacing * (pinIndex + 1),
        y: comp.y + def.height - 10
      };
    }
  }

  // Bridge to AgroNexus Code Generator
  function handleExportToCodeGen() {
    const mcu = components.find(c => ["esp32", "arduino_uno", "esp8266"].includes(c.type));
    const boardId = mcu?.type === "esp32" ? "esp32" : mcu?.type === "arduino_uno" ? "arduino_uno" : "esp8266";

    // Detect placed sensors
    const sensorComps = components.filter(c => ["soil_moisture", "dht22", "ds18b20", "ultrasonic", "ldr"].includes(c.type));
    const sensorMap = {
      soil_moisture: "soil_moisture_analog",
      dht22: "dht22",
      ds18b20: "ds18b20",
      ultrasonic: "ultrasonic_hcsr04",
      ldr: "ldr_analog"
    };

    const sensors = sensorComps.map(s => sensorMap[s.type]).filter(Boolean);

    if (onNavigateToCodeGen) {
      onNavigateToCodeGen({
        boardId,
        sensors: sensors.length > 0 ? sensors : ["soil_moisture_analog", "dht22"]
      });
    }
  }

  // ==========================================================================
  // RENDER: VIEW MODE 1 — CIRKIT DESIGNER HOME (Exact Match to Reference Image)
  // ==========================================================================
  if (viewMode === "home") {
    return (
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Top Header matching reference image */}
        <div className="flex items-start gap-4">
          {/* Distinctive PCB Circuit Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
            <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7 stroke-current" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {/* Circuit traces */}
              <line x1="6" y1="30" x2="16" y2="20" />
              <circle cx="16" cy="20" r="2.5" fill="currentColor" />
              <line x1="12" y1="30" x2="24" y2="18" />
              <circle cx="24" cy="18" r="2.5" fill="currentColor" />
              <line x1="18" y1="30" x2="30" y2="18" />
              <line x1="30" y1="18" x2="30" y2="8" />
              <circle cx="30" cy="8" r="2.5" fill="currentColor" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Cirkit Designer
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Your all-in-one circuit design IDE
            </p>
          </div>
        </div>

        {/* Action Cards Container - Only Start From Scratch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Card: Start From Scratch */}
          <button
            onClick={handleStartFromScratch}
            className="group text-left p-8 bg-gradient-to-b from-[#f0f7ff] to-[#e6f1fe] dark:from-[#0d1829] dark:to-[#09121f] border border-[#d1e5ff] dark:border-[#1e3454] hover:border-indigo-400 dark:hover:border-indigo-500/80 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 mb-6">
              <Plus className="w-9 h-9 stroke-[2.8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Start From Scratch
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[200px] leading-relaxed">
              Create a new circuit from a blank canvas
            </p>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VIEW MODE 2 — INTERACTIVE CIRCUIT WORKSPACE IDE
  // ==========================================================================
  return (
    <div
      className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-[#080d16] select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top IDE Toolbar */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("home")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="h-5 w-px bg-slate-200 dark:border-slate-800" />

          {/* Editable Title */}
          <input
            type="text"
            value={activeProjectName}
            onChange={e => setActiveProjectName(e.target.value)}
            className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-1"
          />

          <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            {components.length} components • {wires.length} wires
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-slate-600 dark:text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(1.6, z + 0.1))}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Wire Color Selection */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 px-1 font-semibold">Wire:</span>
            {["#3b82f6", "#ef4444", "#1e293b", "#10b981", "#f59e0b", "#8b5cf6"].map(c => (
              <button
                key={c}
                onClick={() => setActiveWireColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform ${activeWireColor === c ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"}`}
              />
            ))}
          </div>

          {/* Clear Canvas */}
          <button
            onClick={() => {
              if (confirm("Clear all components and wires?")) {
                setComponents([]);
                setWires([]);
                setPendingPin(null);
              }
            }}
            className="p-2 text-slate-500 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Generate Code Bridge */}
          <button
            onClick={handleExportToCodeGen}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Generate Code</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Component Drawer + Grid Canvas + Connection Table) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Component Library Drawer */}
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Component Library
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{COMPONENT_CATALOG.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {["Microcontrollers", "Sensors", "Actuators & Relays", "Displays"].map(category => {
              const items = COMPONENT_CATALOG.filter(c => c.category === category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {category}
                  </div>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <button
                        key={item.type}
                        onClick={() => handleAddComponent(item)}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                            {item.subtitle}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Interactive Grid Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto relative cursor-crosshair"
          style={{
            backgroundImage: "radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px"
          }}
          onClick={() => {
            setSelectedWire(null);
            setPendingPin(null);
          }}
        >
          {/* Wire Drafting Banner */}
          {pendingPin && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 z-30 animate-bounce">
              <Zap className="w-4 h-4" />
              Connecting from [{pendingPin.compName}] Pin: {pendingPin.pinName} — Click target pin to connect
            </div>
          )}

          {/* Scalable Canvas Content */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              minWidth: "2200px",
              minHeight: "1600px",
              position: "relative"
            }}
          >
            {/* SVG Layer for Drawing Wires */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {wires.map(wire => {
                const p1 = getPinCoordinates(wire.fromComp, wire.fromPin);
                const p2 = getPinCoordinates(wire.toComp, wire.toPin);

                // Calculate smooth Bezier curve
                const dx = Math.abs(p2.x - p1.x);
                const dy = Math.abs(p2.y - p1.y);
                const cx1 = p1.x + Math.min(dx * 0.5, 80);
                const cy1 = p1.y;
                const cx2 = p2.x - Math.min(dx * 0.5, 80);
                const cy2 = p2.y;

                const pathData = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

                return (
                  <g key={wire.id}>
                    {/* Shadow / outline */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth="5"
                    />
                    {/* Main wire line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={wire.color}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      className="pointer-events-auto cursor-pointer hover:stroke-rose-500 hover:stroke-[5] transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Remove this wire connection?")) {
                          handleRemoveWire(wire.id);
                        }
                      }}
                    />
                    {/* End dots */}
                    <circle cx={p1.x} cy={p1.y} r="4" fill={wire.color} />
                    <circle cx={p2.x} cy={p2.y} r="4" fill={wire.color} />
                  </g>
                );
              })}
            </svg>

            {/* Render Draggable Components */}
            {components.map(comp => {
              const def = COMPONENT_CATALOG.find(d => d.type === comp.type);
              if (!def) return null;

              const isSelected = selectedComponentId === comp.instanceId;

              const leftPins = def.pins.filter(p => p.side === "left");
              const rightPins = def.pins.filter(p => p.side === "right");
              const bottomPins = def.pins.filter(p => p.side === "bottom");

              return (
                <div
                  key={comp.instanceId}
                  style={{
                    left: `${comp.x}px`,
                    top: `${comp.y}px`,
                    width: `${def.width}px`
                  }}
                  onMouseDown={e => handleMouseDown(e, comp)}
                  className={`absolute bg-white dark:bg-slate-900 rounded-2xl shadow-lg border transition-shadow z-10 ${
                    isSelected
                      ? "ring-2 ring-indigo-500 border-indigo-400 shadow-xl"
                      : "border-slate-300 dark:border-slate-800 hover:border-slate-400"
                  }`}
                >
                  {/* Component Header Bar */}
                  <div
                    style={{ backgroundColor: def.color }}
                    className="px-3 py-2 text-white font-bold text-xs rounded-t-2xl flex items-center justify-between cursor-move"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Cpu className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{comp.label}</span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveComponent(comp.instanceId);
                      }}
                      className="text-white/70 hover:text-white p-0.5 rounded"
                      title="Remove Component"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Component Body with Pins */}
                  <div className="p-2 text-[10px] font-mono relative">
                    {/* Left & Right Pins Layout */}
                    <div className="flex justify-between gap-1">
                      {/* Left Pins */}
                      <div className="space-y-1">
                        {leftPins.map(pin => {
                          const isPinActive = pendingPin?.compId === comp.instanceId && pendingPin?.pinId === pin.id;
                          return (
                            <div
                              key={pin.id}
                              onClick={e => handlePinClick(e, comp, pin)}
                              className={`flex items-center gap-1.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                                isPinActive ? "bg-indigo-100 dark:bg-indigo-950/80 ring-1 ring-indigo-500" : ""
                              }`}
                            >
                              <div
                                style={{ backgroundColor: pin.color }}
                                className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0 hover:scale-125 transition-transform"
                                title={`Pin ${pin.name} (${pin.type})`}
                              />
                              <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[70px]">
                                {pin.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Pins */}
                      <div className="space-y-1 text-right">
                        {rightPins.map(pin => {
                          const isPinActive = pendingPin?.compId === comp.instanceId && pendingPin?.pinId === pin.id;
                          return (
                            <div
                              key={pin.id}
                              onClick={e => handlePinClick(e, comp, pin)}
                              className={`flex items-center justify-end gap-1.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                                isPinActive ? "bg-indigo-100 dark:bg-indigo-950/80 ring-1 ring-indigo-500" : ""
                              }`}
                            >
                              <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[70px]">
                                {pin.name}
                              </span>
                              <div
                                style={{ backgroundColor: pin.color }}
                                className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0 hover:scale-125 transition-transform"
                                title={`Pin ${pin.name} (${pin.type})`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Pins (e.g. Sensors, Relays, OLED) */}
                    {bottomPins.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-around items-center">
                        {bottomPins.map(pin => {
                          const isPinActive = pendingPin?.compId === comp.instanceId && pendingPin?.pinId === pin.id;
                          return (
                            <div
                              key={pin.id}
                              onClick={e => handlePinClick(e, comp, pin)}
                              className={`flex flex-col items-center gap-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                                isPinActive ? "bg-indigo-100 dark:bg-indigo-950/80 ring-1 ring-indigo-500" : ""
                              }`}
                            >
                              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-semibold">
                                {pin.name}
                              </span>
                              <div
                                style={{ backgroundColor: pin.color }}
                                className="w-3 h-3 rounded-full border border-white shadow-sm hover:scale-125 transition-transform"
                                title={`Pin ${pin.name} (${pin.type})`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Inspector & Live Wiring Table Drawer */}
        <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10 text-xs">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Hardware Wiring Guide</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {wires.length} Connections
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {wires.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <CircuitBoard className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p>No wire connections yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click on any pin connector dot and then click on a destination pin to draw a wire.
                </p>
              </div>
            ) : (
              wires.map((w, idx) => {
                const fromC = components.find(c => c.instanceId === w.fromComp);
                const toC = components.find(c => c.instanceId === w.toComp);
                return (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300">#{idx + 1}</span>
                      <button
                        onClick={() => handleRemoveWire(w.id)}
                        className="text-slate-400 hover:text-rose-500"
                        title="Delete Wire"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div style={{ backgroundColor: w.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {fromC?.label || w.fromComp}: {w.fromPin}
                      </span>
                    </div>
                    <div className="text-slate-400 pl-4">└──&gt; {toC?.label || w.toComp}: {w.toPin}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => {
                const text = wires.map((w, i) => {
                  const fromC = components.find(c => c.instanceId === w.fromComp);
                  const toC = components.find(c => c.instanceId === w.toComp);
                  return `${i + 1}. [${fromC?.label || w.fromComp}] ${w.fromPin} <---> [${toC?.label || w.toComp}] ${w.toPin}`;
                }).join("\n");
                navigator.clipboard.writeText(text);
                alert("Wiring list copied to clipboard!");
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Wiring List
            </button>
            <button
              onClick={handleExportToCodeGen}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              Flash via Code Generator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
