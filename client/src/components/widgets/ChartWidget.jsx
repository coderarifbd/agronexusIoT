import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { api } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { RefreshCw } from "lucide-react";

export function ChartWidget({ title, channelId, fields = [], chartType = "line" }) {
  const { isDark } = useTheme();
  const [range, setRange] = useState("24h");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchHistorical();
    }
  }, [channelId, range]);

  async function fetchHistorical() {
    try {
      setLoading(true);
      const res = await api.getHistoricalData(channelId, range);
      const formatted = res.records.map((r) => ({
        ...r,
        formattedTime: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }));
      setData(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const colorPalette = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
  const gridStroke = isDark ? "#1f293d" : "#e2e8f0";
  const axisStroke = isDark ? "#64748b" : "#94a3b8";
  const tooltipStyle = isDark
    ? { backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", borderRadius: "12px", fontSize: "12px" }
    : { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" };

  const renderChart = () => {
    if (chartType === "area") {
      return (
        <AreaChart data={data}>
          <defs>
            {fields.map((f, idx) => {
              const color = f.color || colorPalette[idx % colorPalette.length];
              return (
                <linearGradient key={f.field_key} id={`grad_${f.field_key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="formattedTime" stroke={axisStroke} fontSize={11} />
          <YAxis stroke={axisStroke} fontSize={11} domain={["auto", "auto"]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          {fields.map((f, idx) => (
            <Area
              key={f.field_key}
              type="monotone"
              dataKey={f.field_key}
              name={`${f.name} (${f.unit || ""})`}
              stroke={f.color || colorPalette[idx % colorPalette.length]}
              fill={`url(#grad_${f.field_key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );
    }

    if (chartType === "bar") {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="formattedTime" stroke={axisStroke} fontSize={11} />
          <YAxis stroke={axisStroke} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          {fields.map((f, idx) => (
            <Bar
              key={f.field_key}
              dataKey={f.field_key}
              name={`${f.name} (${f.unit || ""})`}
              fill={f.color || colorPalette[idx % colorPalette.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
    }

    // Default Line
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="formattedTime" stroke={axisStroke} fontSize={11} />
        <YAxis stroke={axisStroke} fontSize={11} domain={["auto", "auto"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
        {fields.map((f, idx) => (
          <Line
            key={f.field_key}
            type="monotone"
            dataKey={f.field_key}
            name={`${f.name} (${f.unit || ""})`}
            stroke={f.color || colorPalette[idx % colorPalette.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-sm dark:shadow-md transition-colors">
      {/* Header with Time filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h4>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            {data.length} telemetry points ({range})
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {["1h", "6h", "24h", "7d", "30d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                range === r
                  ? "bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button
            onClick={fetchHistorical}
            title="Refresh Data"
            className={`p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg transition-colors ${loading ? "animate-spin text-emerald-500" : ""}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[220px]">
        {data.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-mono">
            No telemetry recorded in this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
