import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import { ExternalLink, MessageSquare, Edit3, X, RefreshCw, FileText, FileSpreadsheet, Activity } from "lucide-react";
import * as XLSX from "xlsx";
import { EditChartOptionsModal } from "./EditChartOptionsModal";

export function SingleFieldChart({
  channel,
  field,
  fieldIndex,
  onDelete
}) {
  const { isDark } = useTheme();
  const { latestTelemetry = {} } = useSocket();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Chart Custom Options (Configurable via Edit Modal)
  const [chartOptions, setChartOptions] = useState({
    title: "",
    xAxisLabel: "Date",
    yAxisLabel: field?.name || `Field Label ${fieldIndex + 1}`,
    color: field?.color || "#d62020",
    background: "#ffffff",
    chartType: "line",
    dynamic: true,
    days: "",
    results: 60,
    timescale: "",
    average: "",
    median: "",
    sum: "",
    rounding: "",
    dataMin: "",
    dataMax: "",
    yAxisMin: null,
    yAxisMax: null
  });

  useEffect(() => {
    if (channel?.id) {
      loadFieldData();
    }
  }, [channel?.id, field?.field_key, chartOptions.results]);

  // Append new incoming WebSocket telemetry live
  useEffect(() => {
    if (!chartOptions.dynamic) return;

    const stream = latestTelemetry?.[channel?.id];
    if (stream) {
      const fieldVal = stream[field.field_key] ?? stream[`field${fieldIndex + 1}`];
      if (fieldVal !== undefined && fieldVal !== null) {
        const parsed = Number(fieldVal);
        const pointVal = isNaN(parsed) ? 0 : parsed;
        const now = new Date(stream._timestamp || Date.now());
        const point = {
          timestamp: now.toISOString(),
          dateStr: now.toLocaleString(),
          time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }),
          value: pointVal
        };
        setData((prev) => [...prev.slice(-(chartOptions.results || 60)), point]);
      }
    }
  }, [latestTelemetry, channel?.id, field.field_key, chartOptions.dynamic, chartOptions.results]);

  async function loadFieldData() {
    try {
      setLoading(true);
      const res = await api.getTelemetry(channel.id, "24h");
      const records = res.data || [];

      const formatted = records.map((r) => {
        let valObj = {};
        try {
          valObj = typeof r.data_json === "string" ? JSON.parse(r.data_json) : r.data_json;
        } catch (e) {}

        const raw = valObj[field.field_key] ?? valObj[`field${fieldIndex + 1}`] ?? 0;
        const parsed = Number(raw);
        const val = isNaN(parsed) ? 0 : parsed;

        const d = new Date(r.timestamp);
        return {
          timestamp: d.toISOString(),
          dateStr: d.toLocaleString(),
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          value: val
        };
      });

      setData(formatted.slice(-(chartOptions.results || 60)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Export this individual sensor graph as CSV
  function handleExportCsv() {
    if (!data || data.length === 0) {
      alert("No sensor telemetry data available to export yet.");
      return;
    }

    const fieldName = field.name || `Field ${fieldIndex + 1}`;
    const unit = field.unit || "";
    const channelName = channel.name || `Channel_${channel.id}`;

    let csv = `Date and Time,Timestamp (ISO),Field Name,Field Key,Reading Value,Unit,Channel Name\n`;
    data.forEach((pt) => {
      const timeStr = pt.dateStr || pt.time || "";
      const isoStr = pt.timestamp || "";
      csv += `"${timeStr}","${isoStr}","${fieldName}","${field.field_key || `field${fieldIndex + 1}`}",${pt.value},"${unit}","${channelName}"\n`;
    });

    const filename = `${channelName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${fieldName.replace(/[^a-zA-Z0-9_-]/g, "_")}_data.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export this individual sensor graph as Excel (.xlsx)
  function handleExportExcel() {
    if (!data || data.length === 0) {
      alert("No sensor telemetry data available to export yet.");
      return;
    }

    const fieldName = field.name || `Field ${fieldIndex + 1}`;
    const unit = field.unit || "";
    const channelName = channel.name || `Channel_${channel.id}`;

    const rows = data.map((pt, idx) => ({
      "Entry #": idx + 1,
      "Date & Time": pt.dateStr || pt.time || "",
      "ISO Timestamp": pt.timestamp || "",
      "Sensor Field": fieldName,
      "Field Key": field.field_key || `field${fieldIndex + 1}`,
      "Reading Value": pt.value,
      "Unit": unit,
      "Channel Name": channelName
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    const sheetName = fieldName.slice(0, 31).replace(/[\\/?*[\]]/g, "_") || "SensorData";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const filename = `${channelName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${fieldName.replace(/[^a-zA-Z0-9_-]/g, "_")}_data.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  function handleSaveChartOptions(newOptions) {
    setChartOptions((prev) => ({ ...prev, ...newOptions }));
  }

  const fieldLabel = chartOptions.yAxisLabel || field.name || `Field Label ${fieldIndex + 1}`;
  const headerTitle = chartOptions.title || `Field ${fieldIndex + 1} Chart`;
  const strokeColor = chartOptions.color || "#d62020";
  const bgColor = isDark ? "#0f172a" : (chartOptions.background || "#ffffff");

  // Smart Domain Calculation to avoid squashed zero lines or out-of-bounds readings
  const yDomain = React.useMemo(() => {
    if (chartOptions.yAxisMin !== null && chartOptions.yAxisMax !== null) {
      return [chartOptions.yAxisMin, chartOptions.yAxisMax];
    }
    if (!data || data.length === 0) return [0, 10];
    const vals = data.map((d) => Number(d.value)).filter((v) => !isNaN(v));
    if (vals.length === 0) return [0, 10];
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    if (min === max) {
      const pad = min === 0 ? 5 : Math.max(2, Math.abs(min) * 0.2);
      return [
        chartOptions.yAxisMin !== null ? chartOptions.yAxisMin : Math.max(0, min - pad),
        chartOptions.yAxisMax !== null ? chartOptions.yAxisMax : max + pad
      ];
    }

    const pad = (max - min) * 0.15;
    return [
      chartOptions.yAxisMin !== null ? chartOptions.yAxisMin : Math.floor(Math.max(0, min - pad)),
      chartOptions.yAxisMax !== null ? chartOptions.yAxisMax : Math.ceil(max + pad)
    ];
  }, [data, chartOptions.yAxisMin, chartOptions.yAxisMax]);

  // Ensure single data points are rendered as a visible line across the chart
  const displayData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (data.length === 1) {
      const pt = data[0];
      return [
        { ...pt, time: "Initial" },
        { ...pt, time: pt.time || "Now" }
      ];
    }
    return data;
  }, [data]);

  const latestPoint = data && data.length > 0 ? data[data.length - 1] : null;

  return (
    <div
      style={{ backgroundColor: bgColor }}
      className="border border-slate-300 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[305px] h-[315px] sm:h-[325px] transition-colors"
    >
      {/* Top Header Bar (With 4 Action Icons + Direct CSV & Excel Export Buttons) */}
      <div className="bg-[#2a75a0] dark:bg-slate-800 text-white px-3 py-2 flex items-center justify-between text-xs font-semibold select-none shrink-0">
        <span className="truncate pr-2 font-bold tracking-tight">{headerTitle}</span>
        <div className="flex items-center gap-1.5 text-white/90 shrink-0">
          {/* Direct CSV & Excel Export Options for this sensor graph */}
          <div className="flex items-center bg-black/25 dark:bg-black/40 rounded px-1.5 py-0.5 text-[10px] font-mono border border-white/20 shadow-inner">
            <button
              type="button"
              onClick={handleExportCsv}
              title={`Export ${fieldLabel} data as CSV`}
              className="px-1.5 py-0.5 hover:text-white hover:bg-white/20 rounded transition-colors font-bold cursor-pointer flex items-center gap-0.5"
            >
              <FileText className="w-2.5 h-2.5" />
              <span>CSV</span>
            </button>
            <span className="text-white/30 px-0.5">|</span>
            <button
              type="button"
              onClick={handleExportExcel}
              title={`Export ${fieldLabel} data as Excel (.xlsx)`}
              className="px-1.5 py-0.5 hover:text-white hover:bg-white/20 rounded transition-colors font-bold cursor-pointer flex items-center gap-0.5 text-emerald-200 hover:text-emerald-100"
            >
              <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-300" />
              <span>Excel</span>
            </button>
          </div>

          <button
            onClick={() => window.open(`/dashboard/public/${channel.public_slug || channel.id}`, "_blank")}
            title="Open in new window"
            className="hover:text-white transition-colors cursor-pointer p-0.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alert(`Field: ${fieldLabel}\nKey: ${field.field_key || `field${fieldIndex + 1}`}`)}
            title="Field Information"
            className="hover:text-white transition-colors cursor-pointer p-0.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            title="Edit Chart Options"
            className="hover:text-white transition-colors cursor-pointer p-0.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(field.id)}
              title="Delete Chart"
              className="hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub Title Strip with Real-time Latest Reading Value */}
      <div className="px-3 py-1.5 flex items-center justify-between text-xs shrink-0 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[50%]">
          {channel.name || `Channel ${channel.channel_number || channel.id}`}
        </span>
        {latestPoint ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">Latest:</span>
            <span className="font-bold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-300/60 dark:border-slate-700">
              {latestPoint.value} {field.unit || ""}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Waiting for data
          </span>
        )}
      </div>

      {/* Main Chart Body */}
      <div className="flex-1 w-full px-2 pt-1 pb-1 relative min-h-0">
        {/* Friendly Empty State Overlay when no telemetry exists */}
        {data.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/75 backdrop-blur-[0.5px] pointer-events-none z-10 p-4 text-center">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 animate-pulse shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Awaiting {fieldLabel} Telemetry
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[240px] mt-0.5 leading-relaxed">
              Stream data via Write API Key or Code Generator to start live plotting.
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {chartOptions.chartType === "bar" || chartOptions.chartType === "column" ? (
            <BarChart
              data={displayData.length > 0 ? displayData : [{ time: "Start", value: 0 }, { time: "Now", value: 0 }]}
              margin={{ top: 12, right: 20, left: 24, bottom: 26 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
              <XAxis
                dataKey="time"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                label={{
                  value: chartOptions.xAxisLabel || "Date",
                  position: "insideBottom",
                  offset: -2,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  style: { textAnchor: "middle" }
                }}
              />
              <YAxis
                width={40}
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                domain={yDomain}
                label={{
                  value: fieldLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: -10,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  style: { textAnchor: "middle" }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "11px"
                }}
              />
              <Bar dataKey="value" fill={strokeColor} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : chartOptions.chartType === "area" ? (
            <AreaChart
              data={displayData.length > 0 ? displayData : [{ time: "Start", value: 0 }, { time: "Now", value: 0 }]}
              margin={{ top: 12, right: 20, left: 24, bottom: 26 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
              <XAxis
                dataKey="time"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                label={{
                  value: chartOptions.xAxisLabel || "Date",
                  position: "insideBottom",
                  offset: -2,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  style: { textAnchor: "middle" }
                }}
              />
              <YAxis
                width={40}
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                domain={yDomain}
                label={{
                  value: fieldLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: -10,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  style: { textAnchor: "middle" }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "11px"
                }}
              />
              <Area type="monotone" dataKey="value" stroke={strokeColor} fill={strokeColor} fillOpacity={0.25} />
            </AreaChart>
          ) : (
            <LineChart
              data={displayData.length > 0 ? displayData : [{ time: "Start", value: 0 }, { time: "Now", value: 0 }]}
              margin={{ top: 12, right: 20, left: 24, bottom: 26 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
              <XAxis
                dataKey="time"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                label={{
                  value: chartOptions.xAxisLabel || "Date",
                  position: "insideBottom",
                  offset: -2,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  style: { textAnchor: "middle" }
                }}
              />
              <YAxis
                width={40}
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                domain={yDomain}
                label={{
                  value: fieldLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: -10,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 10,
                  fontWeight: 600,
                  style: { textAnchor: "middle" }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: isDark ? "#ffffff" : "#0f172a"
                }}
                formatter={(val) => [`${val}`, fieldLabel]}
              />
              <Line
                type={chartOptions.chartType === "step" ? "stepAfter" : chartOptions.chartType === "spline" ? "natural" : "monotone"}
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2.2}
                dot={{ r: 3, fill: strokeColor }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Brand Footer Watermark */}
      <div className="flex justify-end pr-3 pb-1.5">
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans select-none tracking-tight">
          AgroNexus.io
        </span>
      </div>

      {/* Edit Options Modal */}
      <EditChartOptionsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        field={field}
        fieldIndex={fieldIndex}
        chartOptions={chartOptions}
        onSave={handleSaveChartOptions}
      />
    </div>
  );
}
