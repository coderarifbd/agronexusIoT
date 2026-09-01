import React from "react";
import {
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Sun,
  Activity,
  Zap
} from "lucide-react";

export function MetricCard({ field, value, unit, color = "#10B981", min = 0, max = 100 }) {
  const numVal = typeof value === "number" ? value : parseFloat(value) || 0;
  const percentage = Math.min(100, Math.max(0, ((numVal - min) / (max - min)) * 100));

  const getIcon = (key) => {
    switch (key?.toLowerCase()) {
      case "temperature":
      case "soil_temp":
      case "water_temp":
        return <Thermometer className="w-5 h-5" />;
      case "humidity":
      case "soil_moisture":
        return <Droplets className="w-5 h-5" />;
      case "pressure":
        return <Gauge className="w-5 h-5" />;
      case "co2":
      case "wind_speed":
        return <Wind className="w-5 h-5" />;
      case "light_intensity":
        return <Sun className="w-5 h-5" />;
      case "power":
      case "ec":
      case "voltage":
        return <Zap className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-md relative overflow-hidden group">
      {/* Background Accent Gradient */}
      <div
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-15 transition-opacity group-hover:opacity-25 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {field?.name || field}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {getIcon(field?.field_key || field)}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
          {value !== undefined && value !== null ? value : "--"}
        </span>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{unit || field?.unit || ""}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <span>Min: {min}</span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
}
