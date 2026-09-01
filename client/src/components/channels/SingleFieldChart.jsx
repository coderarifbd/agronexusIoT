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
import { ExternalLink, MessageSquare, Edit3, X, RefreshCw } from "lucide-react";
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
        const point = {
          time: new Date(stream._timestamp || Date.now()).toLocaleTimeString([], {
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

  function handleSaveChartOptions(newOptions) {
    setChartOptions((prev) => ({ ...prev, ...newOptions }));
  }

  const fieldLabel = chartOptions.yAxisLabel || field.name || `Field Label ${fieldIndex + 1}`;
  const headerTitle = chartOptions.title || `Field ${fieldIndex + 1} Chart`;
  const strokeColor = chartOptions.color || "#d62020";
  const bgColor = isDark ? "#0f172a" : (chartOptions.background || "#ffffff");

  const yDomain = [
    chartOptions.yAxisMin !== null ? chartOptions.yAxisMin : "auto",
    chartOptions.yAxisMax !== null ? chartOptions.yAxisMax : "auto"
  ];

  return (
    <div
      style={{ backgroundColor: bgColor }}
      className="border border-slate-300 dark:border-slate-800 rounded shadow-sm overflow-hidden flex flex-col h-[350px] transition-colors"
    >
      {/* Top Header Bar (Matches Image with 4 Action Icons) */}
      <div className="bg-[#2a75a0] dark:bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold select-none">
        <span className="truncate">{headerTitle}</span>
        <div className="flex items-center gap-2.5 text-white/90">
          <button
            onClick={() => window.open(`/dashboard/public/${channel.public_slug || channel.id}`, "_blank")}
            title="Open in new window"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => alert(`Field: ${fieldLabel}\nKey: ${field.field_key || `field${fieldIndex + 1}`}`)}
            title="Field Information"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            title="Edit Chart Options"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(field.id)}
              title="Delete Chart"
              className="hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub Title Strip */}
      <div className="px-3 pt-2 text-center">
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {channel.name || `Channel ${channel.channel_number || channel.id}`}
        </span>
      </div>

      {/* Main Chart Body */}
      <div className="flex-1 w-full px-2 pb-1 relative min-h-0">
        <ResponsiveContainer width="100%" height="90%">
          {chartOptions.chartType === "bar" || chartOptions.chartType === "column" ? (
            <BarChart
              data={data.length > 0 ? data : [{ time: "Now", value: 0 }]}
              margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
              <XAxis dataKey="time" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} />
              <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} domain={yDomain} />
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
              data={data.length > 0 ? data : [{ time: "Now", value: 0 }]}
              margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
              <XAxis dataKey="time" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} />
              <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} tickLine={false} domain={yDomain} />
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
              data={data.length > 0 ? data : [{ time: "Now", value: 0 }]}
              margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
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
                  offset: -10,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 11
                }}
              />
              <YAxis
                stroke={isDark ? "#64748b" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                domain={yDomain}
                label={{
                  value: fieldLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: 15,
                  fill: isDark ? "#94a3b8" : "#64748b",
                  fontSize: 11
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
                strokeWidth={2}
                dot={{ r: 2.5, fill: strokeColor }}
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
