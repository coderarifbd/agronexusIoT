import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
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
  RotateCw,
  Download,
  Code,
  Sparkles,
  Layers,
  Check,
  Copy,
  Info,
  Sliders,
  Maximize2,
  Search,
  Grid,
  List,
  Folder,
  Star,
  User,
  Share2,
  Play,
  Square,
  Type,
  Maximize,
  Moon,
  Sun,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileCode,
  Terminal,
  Activity,
  X
} from "lucide-react";

// ============================================================================
// COMPONENT LIBRARY DEFINITIONS WITH GRAPHIC ICONS & PINOUTS
// ============================================================================

export const CIRKIT_PARTS = [
  {
    id: "half_breadboard",
    name: "Half Breadboard",
    category: "Prototyping",
    width: 260,
    height: 180,
    color: "#f8fafc",
    border: "#cbd5e1",
    renderGraphic: (
      <svg viewBox="0 0 70 50" className="w-12 h-10 mx-auto">
        <rect x="2" y="2" width="66" height="46" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Red & Blue power bus lines */}
        <line x1="8" y1="8" x2="62" y2="8" stroke="#ef4444" strokeWidth="1.2" />
        <line x1="8" y1="12" x2="62" y2="12" stroke="#3b82f6" strokeWidth="1.2" />
        <line x1="8" y1="38" x2="62" y2="38" stroke="#3b82f6" strokeWidth="1.2" />
        <line x1="8" y1="42" x2="62" y2="42" stroke="#ef4444" strokeWidth="1.2" />
        {/* Breadboard pin holes */}
        {[18, 22, 26, 30, 34].map(y =>
          [10, 16, 22, 28, 34, 40, 46, 52, 58].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#94a3b8" />
          ))
        )}
        {/* Center divider channel */}
        <rect x="5" y="24" width="60" height="2" fill="#e2e8f0" />
      </svg>
    ),
    pins: [
      { id: "vcc_top", name: "+ (Top)", type: "power", color: "#ef4444", side: "top" },
      { id: "gnd_top", name: "- (Top)", type: "gnd", color: "#1e293b", side: "top" },
      { id: "t1", name: "Row 1-5", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "t2", name: "Row 6-10", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "vcc_bot", name: "+ (Bot)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd_bot", name: "- (Bot)", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    id: "full_breadboard",
    name: "Full Breadboard",
    category: "Prototyping",
    width: 320,
    height: 180,
    color: "#f8fafc",
    border: "#cbd5e1",
    renderGraphic: (
      <svg viewBox="0 0 85 50" className="w-14 h-10 mx-auto">
        <rect x="2" y="2" width="81" height="46" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="6" y1="7" x2="79" y2="7" stroke="#ef4444" strokeWidth="1.2" />
        <line x1="6" y1="11" x2="79" y2="11" stroke="#3b82f6" strokeWidth="1.2" />
        <line x1="6" y1="39" x2="79" y2="39" stroke="#3b82f6" strokeWidth="1.2" />
        <line x1="6" y1="43" x2="79" y2="43" stroke="#ef4444" strokeWidth="1.2" />
        {[18, 22, 28, 32].map(y =>
          [10, 18, 26, 34, 42, 50, 58, 66, 74].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill="#94a3b8" />
          ))
        )}
      </svg>
    ),
    pins: [
      { id: "vcc_top", name: "+ (Top)", type: "power", color: "#ef4444", side: "top" },
      { id: "gnd_top", name: "- (Top)", type: "gnd", color: "#1e293b", side: "top" },
      { id: "vcc_bot", name: "+ (Bot)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd_bot", name: "- (Bot)", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    id: "mini_breadboard",
    name: "Mini Breadboard",
    category: "Prototyping",
    width: 200,
    height: 160,
    color: "#f8fafc",
    border: "#cbd5e1",
    renderGraphic: (
      <svg viewBox="0 0 50 50" className="w-10 h-10 mx-auto">
        <rect x="4" y="4" width="42" height="42" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {[12, 18, 24, 30, 36].map(y =>
          [10, 16, 22, 28, 34, 40].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#94a3b8" />
          ))
        )}
      </svg>
    ),
    pins: [
      { id: "p1", name: "Row A", type: "gpio", color: "#3b82f6", side: "top" },
      { id: "p2", name: "Row B", type: "gpio", color: "#3b82f6", side: "bottom" }
    ]
  },
  {
    id: "electrolytic_cap",
    name: "Electrolytic Capacitor",
    category: "Passives",
    width: 140,
    height: 130,
    color: "#1e293b",
    border: "#475569",
    renderGraphic: (
      <svg viewBox="0 0 40 50" className="w-8 h-10 mx-auto">
        {/* Can cylinder */}
        <rect x="12" y="6" width="16" height="30" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        {/* Negative stripe */}
        <rect x="22" y="6" width="5" height="30" fill="#94a3b8" />
        <text x="24.5" y="22" fontSize="5" fill="#0f172a" fontWeight="bold" textAnchor="middle">-</text>
        {/* Downward metal wire leads */}
        <line x1="16" y1="36" x2="16" y2="47" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="36" x2="24" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    pins: [
      { id: "pos", name: "Positive (+)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "neg", name: "Negative (-)", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    id: "resistor",
    name: "Resistor",
    category: "Passives",
    width: 140,
    height: 110,
    color: "#e2e8f0",
    border: "#94a3b8",
    renderGraphic: (
      <svg viewBox="0 0 60 40" className="w-12 h-8 mx-auto">
        {/* Axial leads */}
        <line x1="4" y1="20" x2="16" y2="20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="44" y1="20" x2="56" y2="20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        {/* Resistor body */}
        <rect x="16" y="14" width="28" height="12" rx="4" fill="#d97706" stroke="#b45309" strokeWidth="1" />
        {/* Color bands */}
        <line x1="22" y1="14" x2="22" y2="26" stroke="#78350f" strokeWidth="2" />
        <line x1="27" y1="14" x2="27" y2="26" stroke="#000000" strokeWidth="2" />
        <line x1="32" y1="14" x2="32" y2="26" stroke="#ef4444" strokeWidth="2" />
        <line x1="38" y1="14" x2="38" y2="26" stroke="#eab308" strokeWidth="2" />
      </svg>
    ),
    pins: [
      { id: "pin1", name: "Lead 1", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "pin2", name: "Lead 2", type: "gpio", color: "#3b82f6", side: "right" }
    ]
  },
  {
    id: "pushbutton",
    name: "Pushbutton",
    category: "Inputs",
    width: 140,
    height: 120,
    color: "#334155",
    border: "#64748b",
    renderGraphic: (
      <svg viewBox="0 0 44 44" className="w-9 h-9 mx-auto">
        {/* Square metal casing */}
        <rect x="8" y="8" width="28" height="28" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Center round plunger */}
        <circle cx="22" cy="22" r="8" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
        {/* 4 bent solder legs */}
        <line x1="4" y1="14" x2="8" y2="14" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="30" x2="8" y2="30" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="14" x2="40" y2="14" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="30" x2="40" y2="30" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    pins: [
      { id: "p1a", name: "Pin 1A", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "p1b", name: "Pin 1B", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "p2a", name: "Pin 2A", type: "gpio", color: "#3b82f6", side: "right" },
      { id: "p2b", name: "Pin 2B", type: "gpio", color: "#3b82f6", side: "right" }
    ]
  },
  {
    id: "ceramic_cap",
    name: "Ceramic Capacitor",
    category: "Passives",
    width: 130,
    height: 120,
    color: "#0284c7",
    border: "#38bdf8",
    renderGraphic: (
      <svg viewBox="0 0 40 44" className="w-8 h-9 mx-auto">
        {/* Blue ceramic disc */}
        <circle cx="20" cy="16" r="11" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <text x="20" y="18" fontSize="4.5" fill="#ffffff" fontWeight="bold" textAnchor="middle">104</text>
        {/* Leads */}
        <line x1="16" y1="27" x2="16" y2="40" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="27" x2="24" y2="40" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    pins: [
      { id: "lead1", name: "Lead 1", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "lead2", name: "Lead 2", type: "gpio", color: "#3b82f6", side: "bottom" }
    ]
  },
  {
    id: "esp32",
    name: "ESP32 (30 pin)",
    category: "Microcontrollers",
    width: 220,
    height: 310,
    color: "#1e293b",
    border: "#475569",
    renderGraphic: (
      <svg viewBox="0 0 48 64" className="w-9 h-12 mx-auto">
        {/* Black PCB */}
        <rect x="4" y="2" width="40" height="60" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        {/* Metal RF Shield */}
        <rect x="10" y="8" width="28" height="24" rx="1.5" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
        <text x="24" y="22" fontSize="4.5" fill="#1e293b" fontWeight="bold" textAnchor="middle">ESP-WROOM-32</text>
        {/* PCB antenna traces at top */}
        <path d="M 14 6 L 14 4 L 34 4 L 34 6" fill="none" stroke="#eab308" strokeWidth="1" />
        {/* Pin header rows */}
        <line x1="6" y1="8" x2="6" y2="56" stroke="#eab308" strokeWidth="2" strokeDasharray="1.5 2" />
        <line x1="42" y1="8" x2="42" y2="56" stroke="#eab308" strokeWidth="2" strokeDasharray="1.5 2" />
        {/* Micro USB port */}
        <rect x="18" y="56" width="12" height="6" rx="1" fill="#cbd5e1" />
      </svg>
    ),
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
      { id: "d34", name: "D34 (ADC)", type: "adc", color: "#f59e0b", side: "right" }
    ]
  },
  {
    id: "diode",
    name: "Diode",
    category: "Semiconductors",
    width: 140,
    height: 110,
    color: "#0f172a",
    border: "#475569",
    renderGraphic: (
      <svg viewBox="0 0 60 36" className="w-12 h-7 mx-auto">
        <line x1="4" y1="18" x2="18" y2="18" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="18" x2="56" y2="18" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <rect x="18" y="12" width="24" height="12" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        {/* Silver cathode band */}
        <rect x="36" y="12" width="4" height="12" fill="#cbd5e1" />
      </svg>
    ),
    pins: [
      { id: "anode", name: "Anode (+)", type: "gpio", color: "#3b82f6", side: "left" },
      { id: "cathode", name: "Cathode (-)", type: "gnd", color: "#1e293b", side: "right" }
    ]
  },
  {
    id: "npn_transistor",
    name: "NPN Transistor (EBC)",
    category: "Semiconductors",
    width: 150,
    height: 130,
    color: "#1e293b",
    border: "#475569",
    renderGraphic: (
      <svg viewBox="0 0 40 46" className="w-8 h-9 mx-auto">
        {/* TO-92 plastic package */}
        <path d="M 10 20 C 10 10 30 10 30 20 L 30 24 L 10 24 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        {/* 3 metal leads: E, B, C */}
        <line x1="14" y1="24" x2="14" y2="42" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="24" x2="20" y2="42" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="24" x2="26" y2="42" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    pins: [
      { id: "e", name: "Emitter (E)", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "b", name: "Base (B)", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "c", name: "Collector (C)", type: "gpio", color: "#3b82f6", side: "bottom" }
    ]
  },
  {
    id: "soil_moisture",
    name: "Soil Moisture Sensor",
    category: "Sensors",
    width: 170,
    height: 140,
    color: "#b45309",
    border: "#d97706",
    renderGraphic: (
      <svg viewBox="0 0 44 54" className="w-9 h-11 mx-auto">
        <rect x="8" y="2" width="28" height="20" rx="2" fill="#15803d" stroke="#166534" strokeWidth="1" />
        {/* Sensor PCB prongs */}
        <path d="M 12 22 L 12 50 L 16 50 L 16 22 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
        <path d="M 28 22 L 28 50 L 32 50 L 32 22 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
        <circle cx="22" cy="10" r="2.5" fill="#3b82f6" />
      </svg>
    ),
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" },
      { id: "aout", name: "AOUT (Analog)", type: "adc", color: "#f59e0b", side: "bottom" }
    ]
  },
  {
    id: "dht11",
    name: "DHT11 Humidity & Temp",
    category: "Sensors",
    width: 170,
    height: 140,
    color: "#0284c7",
    border: "#38bdf8",
    renderGraphic: (
      <svg viewBox="0 0 40 50" className="w-8 h-10 mx-auto">
        {/* Sky-blue sensor grid casing */}
        <rect x="6" y="4" width="28" height="32" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        {/* Mesh holes */}
        {[10, 16, 22, 28].map(y =>
          [12, 18, 24, 28].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill="#0369a1" rx="0.5" />
          ))
        )}
        {/* 3 pins */}
        <line x1="12" y1="36" x2="12" y2="46" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="20" y1="36" x2="20" y2="46" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="28" y1="36" x2="28" y2="46" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "data", name: "DATA (Signal)", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  },
  {
    id: "relay_module",
    name: "5V Relay Module",
    category: "Actuators",
    width: 180,
    height: 150,
    color: "#2563eb",
    border: "#1d4ed8",
    renderGraphic: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto">
        <rect x="4" y="4" width="40" height="40" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        {/* Blue Songle relay cube */}
        <rect x="8" y="8" width="32" height="24" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
        <text x="24" y="22" fontSize="5" fill="#ffffff" fontWeight="bold" textAnchor="middle">SONGLE</text>
        {/* Green terminal block */}
        <rect x="8" y="34" width="32" height="8" rx="1.5" fill="#15803d" />
      </svg>
    ),
    pins: [
      { id: "vcc", name: "VCC (5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" },
      { id: "in", name: "IN (Signal)", type: "gpio", color: "#3b82f6", side: "bottom" }
    ]
  },
  {
    id: "oled_display",
    name: "0.96\" OLED Display",
    category: "Displays",
    width: 180,
    height: 150,
    color: "#0f172a",
    border: "#334155",
    renderGraphic: (
      <svg viewBox="0 0 50 44" className="w-11 h-9 mx-auto">
        <rect x="2" y="2" width="46" height="40" rx="3" fill="#1e3a8a" stroke="#1e40af" strokeWidth="1" />
        <rect x="6" y="10" width="38" height="26" rx="1" fill="#020617" stroke="#38bdf8" strokeWidth="0.8" />
        <text x="25" y="25" fontSize="4.5" fill="#38bdf8" fontFamily="monospace" textAnchor="middle">AgroNexus</text>
      </svg>
    ),
    pins: [
      { id: "vcc", name: "VCC (3.3V-5V)", type: "power", color: "#ef4444", side: "top" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "top" },
      { id: "scl", name: "SCL (I2C)", type: "i2c", color: "#06b6d4", side: "top" },
      { id: "sda", name: "SDA (I2C)", type: "i2c", color: "#8b5cf6", side: "top" }
    ]
  },
  {
    id: "ultrasonic",
    name: "HC-SR04 Ultrasonic",
    category: "Sensors",
    width: 190,
    height: 150,
    color: "#1e3a8a",
    border: "#3b82f6",
    renderGraphic: (
      <svg viewBox="0 0 56 40" className="w-12 h-9 mx-auto">
        <rect x="2" y="4" width="52" height="32" rx="3" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1" />
        {/* 2 silver transducer barrels */}
        <circle cx="16" cy="20" r="10" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="40" cy="20" r="10" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="16" cy="20" r="5" fill="#64748b" />
        <circle cx="40" cy="20" r="5" fill="#64748b" />
      </svg>
    ),
    pins: [
      { id: "vcc", name: "VCC (5V)", type: "power", color: "#ef4444", side: "bottom" },
      { id: "trig", name: "TRIG", type: "gpio", color: "#3b82f6", side: "bottom" },
      { id: "echo", name: "ECHO", type: "gpio", color: "#10b981", side: "bottom" },
      { id: "gnd", name: "GND", type: "gnd", color: "#1e293b", side: "bottom" }
    ]
  }
];

// ============================================================================
// MAIN CIRKIT DESIGNER WORKSPACE COMPONENT
// ============================================================================

export function CircuitDesignerView({ onNavigateToCodeGen, onOpenAI }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Mode tabs: 'design' (default), 'code', 'simulate', 'upload'
  const [activeTab, setActiveTab] = useState("design");
  const [projectName, setProjectName] = useState("Untitled circuit design");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Left vertical navigation bar active item
  const [activeNav, setActiveNav] = useState("parts");

  // Parts filter: 'diagramming' or 'simulation'
  const [partsMode, setPartsMode] = useState("diagramming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  // Canvas State
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [selectedWireId, setSelectedWireId] = useState(null);

  // Wire Drafting State
  const [pendingPin, setPendingPin] = useState(null);

  // Dragging State
  const [draggingCompId, setDraggingCompId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);

  // Canvas Viewport Controls
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [wireRoutingMode, setWireRoutingMode] = useState("bezier"); // 'bezier' or 'orthogonal'
  const canvasRef = useRef(null);

  // Filtered Parts
  const filteredParts = useMemo(() => {
    return CIRKIT_PARTS.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle Add Component to Canvas
  function handleAddComponent(part) {
    const newId = `${part.id}_${Date.now().toString().slice(-4)}`;
    const offset = components.length;
    const newComp = {
      instanceId: newId,
      partId: part.id,
      name: part.name,
      x: 180 + (offset % 3) * 60,
      y: 120 + (offset % 3) * 60
    };
    setComponents(prev => [...prev, newComp]);
    setSelectedCompId(newId);
  }

  // Handle Dragging
  function handleMouseDown(e, comp) {
    e.stopPropagation();
    setDraggingCompId(comp.instanceId);
    setSelectedCompId(comp.instanceId);
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

  // Handle Pin Wiring
  function handlePinClick(e, comp, pin) {
    e.stopPropagation();

    if (!pendingPin) {
      setPendingPin({
        compId: comp.instanceId,
        compName: comp.name,
        pinId: pin.id,
        pinName: pin.name,
        pinType: pin.type,
        pinColor: pin.color
      });
    } else {
      if (pendingPin.compId === comp.instanceId && pendingPin.pinId === pin.id) {
        setPendingPin(null);
        return;
      }

      let wireColor = "#3b82f6";
      if (pendingPin.pinType === "power" || pin.type === "power") wireColor = "#ef4444";
      else if (pendingPin.pinType === "gnd" || pin.type === "gnd") wireColor = "#1e293b";
      else if (pendingPin.pinType === "i2c" || pin.type === "i2c") wireColor = "#8b5cf6";
      else if (pendingPin.pinType === "adc" || pin.type === "adc") wireColor = "#f59e0b";

      const newWire = {
        id: `w_${Date.now()}`,
        fromComp: pendingPin.compId,
        fromPin: pendingPin.pinId,
        toComp: comp.instanceId,
        toPin: pin.id,
        color: wireColor
      };

      setWires(prev => [...prev, newWire]);
      setPendingPin(null);
    }
  }

  // Compute absolute pin coordinates
  function getPinCoordinates(compId, pinId) {
    const comp = components.find(c => c.instanceId === compId);
    if (!comp) return { x: 0, y: 0 };
    const def = CIRKIT_PARTS.find(p => p.id === comp.partId);
    if (!def) return { x: comp.x, y: comp.y };

    const pin = def.pins.find(p => p.id === pinId);
    if (!pin) return { x: comp.x, y: comp.y };

    if (pin.side === "left") {
      const pinsOnSide = def.pins.filter(p => p.side === "left");
      const idx = pinsOnSide.indexOf(pin);
      return { x: comp.x + 8, y: comp.y + 40 + idx * 18 };
    } else if (pin.side === "right") {
      const pinsOnSide = def.pins.filter(p => p.side === "right");
      const idx = pinsOnSide.indexOf(pin);
      return { x: comp.x + def.width - 8, y: comp.y + 40 + idx * 18 };
    } else if (pin.side === "top") {
      const pinsOnSide = def.pins.filter(p => p.side === "top");
      const idx = pinsOnSide.indexOf(pin);
      const spacing = def.width / (pinsOnSide.length + 1);
      return { x: comp.x + spacing * (idx + 1), y: comp.y + 12 };
    } else {
      const pinsOnSide = def.pins.filter(p => p.side === "bottom");
      const idx = pinsOnSide.indexOf(pin);
      const spacing = def.width / (pinsOnSide.length + 1);
      return { x: comp.x + spacing * (idx + 1), y: comp.y + def.height - 12 };
    }
  }

  // Generate Arduino C++ Firmware based on canvas components
  const generatedCode = useMemo(() => {
    const hasEsp32 = components.some(c => c.partId === "esp32");
    const hasDht = components.some(c => c.partId === "dht11");
    const hasSoil = components.some(c => c.partId === "soil_moisture");
    const hasRelay = components.some(c => c.partId === "relay_module");
    const hasOled = components.some(c => c.partId === "oled_display");

    return `// ============================================================================
// AgroNexus IoT — Generated Firmware for ${projectName}
// Target Microcontroller: ${hasEsp32 ? "ESP32 DevKit V1" : "Arduino Compatible"}
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
${hasDht ? '#include <DHT.h>\n#define DHTPIN 4\n#define DHTTYPE DHT11\nDHT dht(DHTPIN, DHTTYPE);' : ''}
${hasOled ? '#include <Wire.h>\n#include <Adafruit_SSD1306.h>\nAdafruit_SSD1306 display(128, 64, &Wire, -1);' : ''}

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://api.agronexus.io/api/telemetry/update";
const char* writeApiKey = "YOUR_CHANNEL_WRITE_API_KEY";

${hasSoil ? 'const int SOIL_PIN = 34;' : ''}
${hasRelay ? 'const int RELAY_PIN = 5;' : ''}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("[AgroNexus] Initializing Hardware...");

  ${hasDht ? 'dht.begin();' : ''}
  ${hasRelay ? 'pinMode(RELAY_PIN, OUTPUT);\ndigitalWrite(RELAY_PIN, LOW);' : ''}
  ${hasSoil ? 'pinMode(SOIL_PIN, INPUT);' : ''}

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n[WiFi] Connected successfully!");
}

void loop() {
  ${hasDht ? 'float temperature = dht.readTemperature();\n  float humidity = dht.readHumidity();' : 'float temperature = 26.5;'}
  ${hasSoil ? 'int soilRaw = analogRead(SOIL_PIN);\n  int soilPercent = map(soilRaw, 4095, 1200, 0, 100);' : ''}

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverUrl) + "?api_key=" + writeApiKey;
    ${hasSoil ? 'url += "&field1=" + String(soilPercent);' : ''}
    ${hasDht ? 'url += "&field2=" + String(temperature);\n    url += "&field3=" + String(humidity);' : ''}

    http.begin(url);
    int httpCode = http.GET();
    Serial.printf("[HTTP] Telemetry post status: %d\\n", httpCode);
    http.end();
  }

  delay(15000); // 15-second update interval
}
`;
  }, [components, projectName]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-[#f3f4f6] dark:bg-[#070b12] select-none text-slate-800 dark:text-slate-200 font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ==================================================================== */}
      {/* 1. TOP HEADER BAR (Exact Replica of Reference Image) */}
      {/* ==================================================================== */}
      <div className="h-14 bg-white dark:bg-[#0c121d] border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-30 shadow-xs">
        
        {/* Left: Circuit Logo & Editable Project Title with File/Edit/Help menus */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 36 36" fill="none" className="w-5 h-5 stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="30" x2="16" y2="20" />
              <circle cx="16" cy="20" r="2.5" fill="currentColor" />
              <line x1="12" y1="30" x2="24" y2="18" />
              <circle cx="24" cy="18" r="2.5" fill="currentColor" />
              <line x1="18" y1="30" x2="30" y2="18" />
              <line x1="30" y1="18" x2="30" y2="8" />
              <circle cx="30" cy="8" r="2.5" fill="currentColor" />
            </svg>
          </div>

          <div className="flex flex-col">
            {isEditingTitle ? (
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={e => e.key === "Enter" && setIsEditingTitle(false)}
                autoFocus
                className="text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-indigo-400 rounded px-1.5 py-0.5 outline-none"
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[200px]"
                title="Click to rename"
              >
                {projectName}
              </span>
            )}

            {/* Menu Row */}
            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
              <span
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                onClick={() => {
                  if (confirm("Create a new blank circuit canvas?")) {
                    setComponents([]);
                    setWires([]);
                    setPendingPin(null);
                  }
                }}
              >
                File
              </span>
              <span
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                onClick={() => {
                  if (selectedCompId) {
                    setComponents(prev => prev.filter(c => c.instanceId !== selectedCompId));
                    setSelectedCompId(null);
                  }
                }}
              >
                Edit
              </span>
              <span
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                onClick={() => alert("Cirkit Designer IDE:\n• Click pins to draw wires.\n• Click 'Code' to export firmware.\n• Click 'Simulate' to test logic.")}
              >
                Help
              </span>
            </div>
          </div>
        </div>

        {/* Center: Segmented Navigation Tabs (Design | Code | Simulate | Upload) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("design")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "design"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Check className="w-3 h-3 text-emerald-500" />
            Design
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "code"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => {
              setActiveTab("simulate");
              setIsSimulating(true);
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "simulate"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Simulate
          </button>
          <button
            onClick={() => {
              if (onNavigateToCodeGen) {
                onNavigateToCodeGen({ boardId: "esp32", sensors: ["soil_moisture_analog", "dht22"] });
              } else {
                alert("Upload sketch ready! Connect microcontroller via USB COM port.");
              }
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Upload
          </button>
        </div>

        {/* Right: Theme Toggle, Cirkit AI, Export, Share, and Profile Avatar (WITHOUT EMAIL) */}
        <div className="flex items-center gap-2">
          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Cirkit AI Pill Button */}
          <button
            onClick={onOpenAI}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 text-xs font-semibold rounded-full border border-sky-200 dark:border-sky-800/80 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cirkit AI</span>
          </button>

          {/* Export Dropdown Button */}
          <button
            onClick={() => {
              const exportJson = JSON.stringify({ projectName, components, wires }, null, 2);
              const blob = new Blob([exportJson], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${projectName.toLowerCase().replace(/\\s+/g, "_")}.json`;
              a.click();
            }}
            className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Share Button (Purple) */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Circuit design link copied to clipboard!");
            }}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </button>

          {/* User Profile Avatar ONLY (NO EMAIL, as requested) */}
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs cursor-pointer ml-1" title={user?.name || "User Profile"}>
            {user?.name?.[0] || "A"}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN WORKSPACE BODY (Left Nav + Component Drawer + Canvas / Code) */}
      {/* ==================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Leftmost Narrow Icon Navigation Strip (~52px) */}
        <div className="w-13 bg-slate-100 dark:bg-[#0a0f18] border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 space-y-4 shrink-0 select-none z-20">
          <button
            onClick={() => {
              setActiveNav("parts");
              setIsDrawerCollapsed(false);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer ${
              activeNav === "parts" ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CircuitBoard className="w-4 h-4" />
            <span>Parts</span>
          </button>

          <button
            onClick={() => {
              setActiveNav("custom");
              setIsDrawerCollapsed(false);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer ${
              activeNav === "custom" ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span className="text-center leading-tight">My Custom</span>
          </button>

          <button
            onClick={() => {
              setActiveNav("favorite");
              setIsDrawerCollapsed(false);
            }}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer ${
              activeNav === "favorite" ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Favorites</span>
          </button>

          <div className="w-8 h-px bg-slate-200 dark:border-slate-800 my-1" />

          <button
            onClick={() => setActiveNav("projects")}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer ${
              activeNav === "projects" ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Projects</span>
          </button>
        </div>

        {/* Component Library Drawer (Matching 3-Column Grid in Image) */}
        {!isDrawerCollapsed && (
          <div className="w-72 sm:w-80 bg-white dark:bg-[#0c121d] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20 shadow-xs relative animate-fadeIn">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Components"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
                />
                <button className="absolute right-2.5 text-slate-400 hover:text-slate-600">
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mode Pills: Diagramming Parts vs Simulation Parts */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setPartsMode("diagramming")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    partsMode === "diagramming"
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-400 dark:border-sky-700 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Diagramming Parts
                </button>
                <button
                  onClick={() => setPartsMode("simulation")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    partsMode === "simulation"
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-400 dark:border-sky-700 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Simulation Parts
                </button>
              </div>

              {/* Create Custom Component Button */}
              <button
                onClick={() => alert("Custom Component Wizard: You can define custom pin headers and footprints.")}
                className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⊕ Create Custom Component</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>
            </div>

            {/* Component Cards Grid (3 Columns, Exact Match to media_1788416567327.png) */}
            <div className="flex-1 overflow-y-auto p-2.5">
              <div className="grid grid-cols-3 gap-2">
                {filteredParts.map(part => (
                  <button
                    key={part.id}
                    onClick={() => handleAddComponent(part)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-md transition-all flex flex-col items-center justify-between text-center group cursor-pointer h-28"
                  >
                    <div className="flex-1 flex items-center justify-center w-full">
                      {part.renderGraphic}
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight line-clamp-2 mt-1">
                      {part.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Collapse Drawer Tab on Right Border */}
            <button
              onClick={() => setIsDrawerCollapsed(true)}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-r-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-xs cursor-pointer z-30"
              title="Collapse Parts Library"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collapsed Drawer Reopen Button */}
        {isDrawerCollapsed && (
          <button
            onClick={() => setIsDrawerCollapsed(false)}
            className="absolute left-13 top-1/2 -translate-y-1/2 w-4 h-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-r-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-xs cursor-pointer z-30"
            title="Open Parts Library"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ================================================================== */}
        {/* 3. CENTRAL WORKSPACE (Design Canvas / Code / Simulation) */}
        {/* ================================================================== */}
        {activeTab === "design" || activeTab === "simulate" ? (
          <div
            ref={canvasRef}
            className="flex-1 overflow-auto relative cursor-crosshair"
            style={{
              backgroundImage: gridVisible ? "radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)" : "none",
              backgroundSize: "20px 20px"
            }}
            onClick={() => {
              setSelectedCompId(null);
              setSelectedWireId(null);
              setPendingPin(null);
            }}
          >
            {/* Top-Right Floating Canvas Toolbar (Exact Replica of Reference Image) */}
            <div className="absolute top-4 right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg px-2 py-1.5 flex items-center gap-1.5 z-30">
              {/* Green Play Button */}
              <button
                onClick={() => {
                  setIsSimulating(!isSimulating);
                  if (!isSimulating) {
                    setSimulationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Simulation started: Circuit logic verified.`]);
                  }
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                  isSimulating ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
                title={isSimulating ? "Stop Simulation" : "Start Simulation"}
              >
                {isSimulating ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <div className="h-4 w-px bg-slate-200 dark:border-slate-700 mx-0.5" />

              {/* Text Tool */}
              <button
                onClick={() => {
                  const text = prompt("Enter text note on canvas:");
                  if (text) {
                    setComponents(prev => [...prev, {
                      instanceId: `note_${Date.now()}`,
                      partId: "note",
                      name: text,
                      x: 240,
                      y: 180
                    }]);
                  }
                }}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                title="Add Text Annotation"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* Wire Routing Tool */}
              <button
                onClick={() => setWireRoutingMode(m => (m === "bezier" ? "orthogonal" : "bezier"))}
                className={`p-1 rounded ${wireRoutingMode === "orthogonal" ? "text-indigo-600 bg-indigo-50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                title="Toggle Wire Routing Mode"
              >
                <Zap className="w-4 h-4" />
              </button>

              {/* Grid Toggle */}
              <button
                onClick={() => setGridVisible(!gridVisible)}
                className={`p-1 rounded ${gridVisible ? "text-indigo-600 bg-indigo-50" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                title="Toggle Dot Grid"
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* Undo */}
              <button
                onClick={() => {
                  if (wires.length > 0) setWires(prev => prev.slice(0, -1));
                }}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                title="Undo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Redo */}
              <button
                onClick={() => alert("Redo action")}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                title="Redo"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Fit to Screen */}
              <button
                onClick={() => setZoom(1)}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                title="Reset Zoom & Fit"
              >
                <Maximize className="w-4 h-4" />
              </button>

              {/* Zoom Out */}
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom In */}
              <button
                onClick={() => setZoom(z => Math.min(1.8, z + 0.1))}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  if (selectedCompId) {
                    setComponents(prev => prev.filter(c => c.instanceId !== selectedCompId));
                    setWires(prev => prev.filter(w => w.fromComp !== selectedCompId && w.toComp !== selectedCompId));
                    setSelectedCompId(null);
                  } else if (selectedWireId) {
                    setWires(prev => prev.filter(w => w.id !== selectedWireId));
                    setSelectedWireId(null);
                  }
                }}
                className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded"
                title="Delete Selected Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Wire Drafting Banner */}
            {pendingPin && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 z-30 animate-bounce">
                <Zap className="w-4 h-4" />
                Connecting [{pendingPin.compName}] Pin: {pendingPin.pinName} — Click target pin to complete wire
              </div>
            )}

            {/* Scalable Canvas Content */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                minWidth: "2600px",
                minHeight: "1800px",
                position: "relative"
              }}
            >
              {/* SVG Layer for Drawing Wires */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {wires.map(wire => {
                  const p1 = getPinCoordinates(wire.fromComp, wire.fromPin);
                  const p2 = getPinCoordinates(wire.toComp, wire.toPin);

                  const dx = Math.abs(p2.x - p1.x);
                  const dy = Math.abs(p2.y - p1.y);

                  let pathData;
                  if (wireRoutingMode === "orthogonal") {
                    const midX = p1.x + (p2.x - p1.x) / 2;
                    pathData = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
                  } else {
                    const cx1 = p1.x + Math.min(dx * 0.5, 90);
                    const cy1 = p1.y;
                    const cx2 = p2.x - Math.min(dx * 0.5, 90);
                    const cy2 = p2.y;
                    pathData = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
                  }

                  const isSelected = selectedWireId === wire.id;

                  return (
                    <g key={wire.id}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke="rgba(0,0,0,0.12)"
                        strokeWidth="5"
                      />
                      <path
                        d={pathData}
                        fill="none"
                        stroke={wire.color}
                        strokeWidth={isSelected ? "4.5" : "3"}
                        strokeLinecap="round"
                        className="pointer-events-auto cursor-pointer hover:stroke-rose-500 hover:stroke-[5] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWireId(wire.id);
                        }}
                      />
                      {/* Current flow simulation dots */}
                      {isSimulating && (
                        <circle cx={(p1.x + p2.x) / 2} cy={(p1.y + p2.y) / 2} r="3" fill="#facc15" className="animate-ping" />
                      )}
                      <circle cx={p1.x} cy={p1.y} r="4" fill={wire.color} />
                      <circle cx={p2.x} cy={p2.y} r="4" fill={wire.color} />
                    </g>
                  );
                })}
              </svg>

              {/* Render Placed Components on Canvas */}
              {components.map(comp => {
                const def = CIRKIT_PARTS.find(p => p.id === comp.partId);
                if (!def) return null;

                const isSelected = selectedCompId === comp.instanceId;

                const topPins = def.pins.filter(p => p.side === "top");
                const bottomPins = def.pins.filter(p => p.side === "bottom");
                const leftPins = def.pins.filter(p => p.side === "left");
                const rightPins = def.pins.filter(p => p.side === "right");

                return (
                  <div
                    key={comp.instanceId}
                    style={{
                      left: `${comp.x}px`,
                      top: `${comp.y}px`,
                      width: `${def.width}px`
                    }}
                    onMouseDown={e => handleMouseDown(e, comp)}
                    className={`absolute bg-white dark:bg-slate-900 rounded-xl shadow-md border transition-shadow z-10 ${
                      isSelected
                        ? "ring-2 ring-indigo-500 border-indigo-400 shadow-xl"
                        : "border-slate-300 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    {/* Component Header Bar */}
                    <div className="px-2.5 py-1.5 bg-slate-800 text-white font-semibold text-xs rounded-t-xl flex items-center justify-between cursor-move">
                      <div className="flex items-center gap-1.5 truncate">
                        <Cpu className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{comp.name}</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setComponents(prev => prev.filter(c => c.instanceId !== comp.instanceId));
                          setWires(prev => prev.filter(w => w.fromComp !== comp.instanceId && w.toComp !== comp.instanceId));
                        }}
                        className="text-white/60 hover:text-white p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Top Pins */}
                    {topPins.length > 0 && (
                      <div className="flex justify-around items-center px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                        {topPins.map(pin => (
                          <div
                            key={pin.id}
                            onClick={e => handlePinClick(e, comp, pin)}
                            className="flex flex-col items-center gap-0.5 cursor-pointer group"
                          >
                            <div
                              style={{ backgroundColor: pin.color }}
                              className="w-2.5 h-2.5 rounded-full border border-white group-hover:scale-125 transition-transform"
                              title={`${pin.name} (${pin.type})`}
                            />
                            <span className="text-[8px] font-mono text-slate-500">{pin.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Component Body & Side Pins */}
                    <div className="p-2 flex justify-between gap-2 text-[10px] font-mono">
                      {/* Left Pins */}
                      <div className="space-y-1">
                        {leftPins.map(pin => (
                          <div
                            key={pin.id}
                            onClick={e => handlePinClick(e, comp, pin)}
                            className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 rounded transition-colors group"
                          >
                            <div
                              style={{ backgroundColor: pin.color }}
                              className="w-2.5 h-2.5 rounded-full border border-white group-hover:scale-125 transition-transform"
                              title={`${pin.name} (${pin.type})`}
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{pin.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Graphic Preview */}
                      <div className="flex-1 flex items-center justify-center p-1">
                        {def.renderGraphic}
                      </div>

                      {/* Right Pins */}
                      <div className="space-y-1 text-right">
                        {rightPins.map(pin => (
                          <div
                            key={pin.id}
                            onClick={e => handlePinClick(e, comp, pin)}
                            className="flex items-center justify-end gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 rounded transition-colors group"
                          >
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{pin.name}</span>
                            <div
                              style={{ backgroundColor: pin.color }}
                              className="w-2.5 h-2.5 rounded-full border border-white group-hover:scale-125 transition-transform"
                              title={`${pin.name} (${pin.type})`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Pins */}
                    {bottomPins.length > 0 && (
                      <div className="flex justify-around items-center px-2 py-1 border-t border-slate-100 dark:border-slate-800">
                        {bottomPins.map(pin => (
                          <div
                            key={pin.id}
                            onClick={e => handlePinClick(e, comp, pin)}
                            className="flex flex-col items-center gap-0.5 cursor-pointer group"
                          >
                            <span className="text-[8px] font-mono text-slate-500">{pin.name}</span>
                            <div
                              style={{ backgroundColor: pin.color }}
                              className="w-2.5 h-2.5 rounded-full border border-white group-hover:scale-125 transition-transform"
                              title={`${pin.name} (${pin.type})`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom-Center Floating Cirkit AI Button (Exact Match to Image) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={onOpenAI}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Cirkit AI</span>
              </button>
            </div>

            {/* Simulation Log Console Drawer */}
            {isSimulating && (
              <div className="absolute bottom-0 inset-x-0 bg-slate-950 text-emerald-400 border-t border-slate-800 p-3 font-mono text-xs max-h-36 overflow-y-auto z-20">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-slate-400 text-[10px]">
                  <span>VIRTUAL HARDWARE SERIAL TERMINAL — 115200 BAUD</span>
                  <span className="text-emerald-400 font-bold">● ACTIVE</span>
                </div>
                {simulationLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div>[AgroNexus] Microcontroller logic running smoothly...</div>
              </div>
            )}
          </div>
        ) : (
          /* CODE TAB VIEW */
          <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 font-mono text-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                sketch.ino — Upload-Ready C++ Firmware
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    alert("Code copied to clipboard!");
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button
                  onClick={() => {
                    if (onNavigateToCodeGen) {
                      onNavigateToCodeGen({ boardId: "esp32", sensors: ["soil_moisture_analog", "dht22"] });
                    }
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" /> Open in Code Generator
                </button>
              </div>
            </div>
            <pre className="flex-1 p-4 overflow-auto text-emerald-300/90 leading-relaxed select-text font-mono">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
