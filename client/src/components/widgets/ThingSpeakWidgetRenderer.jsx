import React, { useMemo } from "react";
import { useSocket } from "../../context/SocketContext";
import { ExternalLink, MessageSquare, Edit3, X } from "lucide-react";

export function ThingSpeakWidgetRenderer({ widget, channel, currentValues = {}, onEdit, onDelete }) {
  const { latestTelemetry = {} } = useSocket();

  // Helper to extract clean numeric value from any telemetry source (NEVER NaN)
  function extractNumericValue(source) {
    if (!source || typeof source !== "object") return null;

    // 1. Direct field_key match
    if (widget.field_key && source[widget.field_key] !== undefined && source[widget.field_key] !== null) {
      const v = Number(source[widget.field_key]);
      if (!isNaN(v)) return v;
    }

    // 2. Field index match (e.g. "field1", "field2")
    const match = widget.field_key ? widget.field_key.match(/\d+/) : null;
    const fIdxKey = match ? `field${match[0]}` : null;
    if (fIdxKey && source[fIdxKey] !== undefined && source[fIdxKey] !== null) {
      const v = Number(source[fIdxKey]);
      if (!isNaN(v)) return v;
    }

    // 3. Match by field order / position
    const fOrderKey = `field${widget.field_order || 1}`;
    if (source[fOrderKey] !== undefined && source[fOrderKey] !== null) {
      const v = Number(source[fOrderKey]);
      if (!isNaN(v)) return v;
    }

    // 4. Case-insensitive key match
    if (widget.field_key) {
      const lowerKey = widget.field_key.toLowerCase();
      for (const k of Object.keys(source)) {
        if (k.toLowerCase() === lowerKey) {
          const v = Number(source[k]);
          if (!isNaN(v)) return v;
        }
      }
    }

    return null;
  }

  let rawVal = extractNumericValue(latestTelemetry?.[channel?.id]);
  if (rawVal === null) {
    rawVal = extractNumericValue(currentValues);
  }
  const hasData = rawVal !== null && !isNaN(rawVal);
  const num = hasData ? rawVal : 0;

  const config = typeof widget.config === "string"
    ? JSON.parse(widget.config || "{}")
    : (widget.config || (widget.config_json ? (typeof widget.config_json === "string" ? JSON.parse(widget.config_json) : widget.config_json) : {}));

  const userMin = config.min !== undefined && config.min !== "" ? Number(config.min) : 0;
  const userMax = config.max !== undefined && config.max !== "" ? Number(config.max) : 100;
  const autoScale = config.autoScale !== undefined ? Boolean(config.autoScale) : true;
  const unit = config.units || config.unit || "";
  const displayValue = config.displayValue !== undefined ? config.displayValue : true;

  // Smart Dynamic Gauge Scale (automatically adapts dial from 0-100 to 0-1000, 0-2000, etc.)
  const { min, max, span, ticks } = useMemo(() => {
    let targetMin = userMin;
    let targetMax = userMax;

    // When auto-scaling is enabled (default) or when sensor reading exceeds configured max or is below min:
    if (autoScale || num > targetMax || num < targetMin) {
      const absVal = Math.abs(num);

      // Determine standard adaptive tier based on the incoming sensor value:
      // 0-100 -> dial max 100
      // 101-250 -> dial max 250
      // 251-500 -> dial max 500
      // 501-1000 -> dial max 1000
      // 1001-2000 -> dial max 2000
      // 2001-3000 -> dial max 3000
      // 3001-5000 -> dial max 5000
      // 5001-10000 -> dial max 10000
      let dynamicMax = 100;
      if (absVal <= 100) dynamicMax = 100;
      else if (absVal <= 250) dynamicMax = 250;
      else if (absVal <= 500) dynamicMax = 500;
      else if (absVal <= 1000) dynamicMax = 1000;
      else if (absVal <= 2000) dynamicMax = 2000;
      else if (absVal <= 3000) dynamicMax = 3000;
      else if (absVal <= 5000) dynamicMax = 5000;
      else if (absVal <= 10000) dynamicMax = 10000;
      else {
        const exp = Math.floor(Math.log10(absVal));
        const base = Math.pow(10, exp);
        dynamicMax = Math.ceil(absVal / base) * base;
      }

      // If user explicitly configured a higher max, preserve user's setting, otherwise adapt to dynamicMax
      targetMax = Math.max(userMax, dynamicMax);

      if (num < 0 && num < targetMin) {
        targetMin = Math.floor(num / 10) * 10;
      }
    }

    const calculatedSpan = targetMax - targetMin > 0 ? targetMax - targetMin : 100;

    // Calculate clean step to generate ~10 readable tick markers
    let step = calculatedSpan / 10;
    if (step >= 100) {
      step = Math.round(step / 50) * 50;
    } else if (step >= 10) {
      step = Math.round(step / 5) * 5;
    }
    if (step <= 0) step = 10;

    const tickList = [];
    for (let v = targetMin; v <= targetMax; v += step) {
      tickList.push(Math.round(v * 10) / 10);
    }
    if (tickList[tickList.length - 1] < targetMax) {
      tickList.push(targetMax);
    }

    return {
      min: targetMin,
      max: targetMax,
      span: calculatedSpan,
      ticks: tickList
    };
  }, [num, userMin, userMax, autoScale]);

  const rawRanges = Array.isArray(config.ranges) && config.ranges.length > 0
    ? config.ranges
    : [{ from: 90, to: 100, color: "#d62020" }];

  // Proportional scaling for warning/danger sector if max changes from default 100
  const ranges = rawRanges.map((r) => {
    if (r.from === 90 && r.to === 100 && max !== 100) {
      return {
        ...r,
        from: Math.round(min + span * 0.9),
        to: max
      };
    }
    return r;
  });

  // Render Gauge (Exact clone of media_1788288005556.png)
  function renderGauge() {
    const clamped = Math.max(min, Math.min(max, num));
    // Until sensor data is received, fraction is 0 so needle rests motionless at starting position
    const fraction = hasData ? (clamped - min) / span : 0;

    // Angle conventions: 0deg is at 12 o'clock (top)
    // Scale starts at 225deg (or -135deg) at bottom-left and sweeps 270deg clockwise to 135deg at bottom-right
    const startAngle = -135;
    const totalSweep = 270;
    const needleAngle = startAngle + fraction * totalSweep;

    const cx = 100;
    const cy = 100;
    const scaleR = 66;
    const outerR = 78;
    const innerR = 54;

    // Helpers to compute x, y given angle from 12 o'clock
    function getCoords(angleDeg, radius) {
      const rad = angleDeg * (Math.PI / 180);
      return {
        x: cx + radius * Math.sin(rad),
        y: cy - radius * Math.cos(rad)
      };
    }

    // Arc path for the main scale
    const pStart = getCoords(startAngle, scaleR);
    const pEnd = getCoords(startAngle + totalSweep, scaleR);
    const scaleArcPath = `M ${pStart.x} ${pStart.y} A ${scaleR} ${scaleR} 0 1 1 ${pEnd.x} ${pEnd.y}`;

    // Outer faint bezel arc
    const oStart = getCoords(startAngle, outerR);
    const oEnd = getCoords(startAngle + totalSweep, outerR);
    const outerArcPath = `M ${oStart.x} ${oStart.y} A ${outerR} ${outerR} 0 1 1 ${oEnd.x} ${oEnd.y}`;

    return (
      <div className="flex flex-col items-center justify-center p-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full select-none">
            {/* Outer faint bezel outline */}
            <path
              d={outerArcPath}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />

            {/* Main dial scale arc */}
            <path
              d={scaleArcPath}
              fill="none"
              stroke="#4b5563"
              strokeWidth="2.5"
            />

            {/* Range Color Bands (e.g. 90 to 100 red curved sector matching image) */}
            {ranges.map((r, idx) => {
              const rFrom = Number(r.from) !== undefined ? Number(r.from) : min;
              const rTo = Number(r.to) !== undefined ? Number(r.to) : max;

              const fromFrac = Math.max(0, Math.min(1, (rFrom - min) / span));
              const toFrac = Math.max(0, Math.min(1, (rTo - min) / span));

              const a1 = startAngle + fromFrac * totalSweep;
              const a2 = startAngle + toFrac * totalSweep;

              const p1Outer = getCoords(a1, scaleR);
              const p2Outer = getCoords(a2, scaleR);
              const p2Inner = getCoords(a2, innerR);
              const p1Inner = getCoords(a1, innerR);

              const largeArc = (a2 - a1) > 180 ? 1 : 0;

              const sectorPath = `
                M ${p1Outer.x} ${p1Outer.y}
                A ${scaleR} ${scaleR} 0 ${largeArc} 1 ${p2Outer.x} ${p2Outer.y}
                L ${p2Inner.x} ${p2Inner.y}
                A ${innerR} ${innerR} 0 ${largeArc} 0 ${p1Inner.x} ${p1Inner.y}
                Z
              `;

              return (
                <path
                  key={idx}
                  d={sectorPath}
                  fill={r.color || "#d62020"}
                  stroke="#374151"
                  strokeWidth="1"
                />
              );
            })}

            {/* Tick Marks & Numbers (0, 10, 20 ... 100) */}
            {ticks.map((t, idx) => {
              const frac = (t - min) / span;
              const a = startAngle + frac * totalSweep;

              const pOut = getCoords(a, scaleR);
              const pIn = getCoords(a, scaleR - 8);
              const pText = getCoords(a, scaleR - 18);

              return (
                <g key={idx}>
                  <line
                    x1={pIn.x}
                    y1={pIn.y}
                    x2={pOut.x}
                    y2={pOut.y}
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <text
                    x={pText.x}
                    y={pText.y + 3.5}
                    fontSize={max >= 1000 ? "7.5" : "9.5"}
                    fill="#1e293b"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontWeight={max >= 1000 ? "600" : "500"}
                  >
                    {t}
                  </text>
                </g>
              );
            })}

            {/* Center Red Dot Pivot (Matches image) */}
            <circle cx={cx} cy={cy} r="6" fill="#d62020" />

            {/* Needle Pointer */}
            <g
              transform={`rotate(${needleAngle} ${cx} ${cy})`}
              className="transition-transform duration-500 ease-out"
            >
              {/* Pointer Needle Body */}
              <polygon points="98,100 102,100 100.5,38 99.5,38" fill="#1e293b" />
              <line x1="100" y1="100" x2="100" y2="38" stroke="#d62020" strokeWidth="2" strokeLinecap="round" />
              <circle cx={cx} cy={cy} r="5" fill="#d62020" />
            </g>
          </svg>
        </div>

        {/* Digital Readout below dial (Only shows reading when sensor data arrives) */}
        {displayValue && (
          <div className="text-center font-sans font-semibold text-base text-slate-800 dark:text-white -mt-2">
            {hasData ? (
              <>
                <span>{Number(num.toFixed(1))}</span>
                {unit && <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>}
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-mono text-xs tracking-wider" title="Awaiting real sensor data">
                ---
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render Numeric Display
  function renderNumeric() {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg px-6 py-3 shadow-inner">
          <span className="font-mono text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-wider">
            {hasData ? Number(num.toFixed(1)) : "---"}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest font-semibold">
          {hasData ? (unit || "Value") : "Awaiting Sensor Data"}
        </span>
      </div>
    );
  }

  // Render Lamp Indicator
  function renderLamp() {
    let isLit = false;
    if (hasData) {
      const thresh = config.lampThreshold || 50;
      if (config.lampCondition === "gt") isLit = num > thresh;
      else if (config.lampCondition === "lt") isLit = num < thresh;
      else if (config.lampCondition === "eq") isLit = num === thresh;
      else isLit = num > 0;
    }

    return (
      <div className="flex flex-col items-center justify-center p-3">
        <div
          className={`w-20 h-20 rounded-full border-4 transition-all duration-500 flex items-center justify-center shadow-lg ${
            isLit
              ? "border-emerald-400 bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 shadow-emerald-500/50"
              : "border-slate-300 dark:border-slate-700 bg-gradient-to-b from-white via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full border transition-all ${
              isLit
                ? "border-emerald-200 bg-white/40 animate-pulse"
                : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
            }`}
          />
        </div>
        <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Status:{" "}
          <span className={isLit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
            {!hasData ? "NO SENSOR DATA" : isLit ? "ON / ACTIVE" : "OFF / IDLE"}
          </span>
        </div>
      </div>
    );
  }

  // Render Image Display
  function renderImage() {
    const src = config.imageUrl || "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&auto=format&fit=crop&q=80";
    return (
      <div className="p-2 flex flex-col items-center justify-center">
        <img
          src={src}
          alt={widget.title}
          className="max-h-36 rounded border border-slate-200 dark:border-slate-800 object-cover shadow-sm"
        />
        <div className="mt-1 text-[10px] font-mono text-slate-500">Live Channel Stream</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-sm overflow-hidden flex flex-col h-[275px] transition-colors">
      {/* Widget Top Header Banner (Matches media_1788288005556.png) */}
      <div className="bg-[#2a75a0] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold select-none shrink-0">
        <span className="truncate">{widget.title || "Field 1 Gauge"}</span>
        <div className="flex items-center gap-2 text-white/90">
          <button
            onClick={() => window.open(`/dashboard/public/${channel.public_slug || channel.id}`, "_blank")}
            title="Open in new window"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alert(`Widget: ${widget.title}\nField: ${widget.field_key || "field1"}`)}
            title="Widget Information"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(widget)}
              title="Edit Widget Options"
              className="hover:text-white transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(widget.id)}
              title="Delete Widget"
              className="hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content Body */}
      <div className="bg-white dark:bg-slate-900 flex-1 flex items-center justify-center min-h-0">
        {widget.widget_type === "gauge" && renderGauge()}
        {widget.widget_type === "numeric" && renderNumeric()}
        {widget.widget_type === "lamp" && renderLamp()}
        {widget.widget_type === "image" && renderImage()}
      </div>

      {/* AgroNexus.io Watermark Footer */}
      <div className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <span>Field: {widget.field_key || "field1"}</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">AgroNexus.io</span>
      </div>
    </div>
  );
}
