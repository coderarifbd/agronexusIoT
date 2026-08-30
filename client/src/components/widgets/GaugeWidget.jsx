import React from "react";

export function GaugeWidget({ title, value, unit = "°C", min = 0, max = 100, color = "#10B981" }) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  const clamped = Math.max(min, Math.min(max, num));
  const fraction = (clamped - min) / (max - min);

  // Semicircle gauge: 180 degrees
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - fraction * circumference;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden h-full">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </div>

      <div className="relative flex items-center justify-center my-1">
        <svg height={radius * 1.5} width={radius * 2.2} className="overflow-visible">
          {/* Background Arc */}
          <path
            d={`M ${stroke} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke} ${radius}`}
            fill="none"
            stroke="#1f293d"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <path
            d={`M ${stroke} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke} ${radius}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Value in Center */}
        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-2xl font-extrabold text-white font-mono">{num}</span>
          <span className="text-xs text-slate-400 font-semibold">{unit}</span>
        </div>
      </div>

      <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-mono px-4">
        <span>{min}</span>
        <span className="text-emerald-400">Live Telemetry</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
