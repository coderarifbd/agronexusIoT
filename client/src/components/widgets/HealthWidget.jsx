import React from "react";
import { Battery, Wifi, Cpu } from "lucide-react";

export function HealthWidget({ device }) {
  if (!device) return null;

  const isOnline = device.status === "online";
  const battery = device.battery_level || 85;
  const isLowBattery = battery < 20;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full shadow-sm dark:shadow-md transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{device.name}</h4>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">{device.device_id_code}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
          <span className={`text-xs font-semibold uppercase ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
            {device.status}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* Battery */}
        <div className={`p-2.5 rounded-xl border ${isLowBattery ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-300" : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"}`}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5" />
              <span>Battery</span>
            </span>
            <span className="font-bold font-mono">{battery}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${isLowBattery ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}
              style={{ width: `${battery}%` }}
            />
          </div>
        </div>

        {/* Wi-Fi RSSI */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" />
              <span>Wi-Fi Signal</span>
            </span>
            <span className="font-bold font-mono">{device.wifi_rssi || -58} dBm</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Signal: Excellent</div>
        </div>
      </div>

      {/* Firmware & Uptime Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <span>FW: {device.firmware_version || "v2.1.0"}</span>
        <span>Last Seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : "Just now"}</span>
      </div>
    </div>
  );
}
