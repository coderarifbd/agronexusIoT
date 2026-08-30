import React, { useState } from "react";
import { api } from "../../services/api";
import { X, Plus, LayoutGrid, Gauge, LineChart, ToggleLeft, MapPin, Table, Activity } from "lucide-react";

export function AddWidgetModal({ isOpen, onClose, channelId, fields = [], onWidgetAdded }) {
  const [title, setTitle] = useState("");
  const [widgetType, setWidgetType] = useState("gauge");
  const [fieldKey, setFieldKey] = useState(fields[0]?.field_key || "temperature");
  const [chartType, setChartType] = useState("line");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      await api.addWidget(channelId, {
        title,
        widget_type: widgetType,
        field_key: fieldKey,
        chart_type: chartType,
        config: {},
        grid_w: widgetType === "chart" || widgetType === "map" || widgetType === "table" ? 12 : 6,
        grid_h: 4
      });
      onWidgetAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const widgetTypes = [
    { id: "gauge", name: "Radial Gauge", icon: Gauge, desc: "Circular live telemetry meter" },
    { id: "chart", name: "Time-series Chart", icon: LineChart, desc: "Line, Bar, or Area historical trends" },
    { id: "number", name: "Metric Card", icon: Activity, desc: "Live numeric value with min/max bar" },
    { id: "switch", name: "Actuator Switch", icon: ToggleLeft, desc: "Relay / Pump / Fan control toggle" },
    { id: "map", name: "Device GPS Map", icon: MapPin, desc: "Interactive geographic telemetry pin" },
    { id: "table", name: "Data Table", icon: Table, desc: "Raw sensor logs & CSV export" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Add Custom Dashboard Widget</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Widget Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ambient Temperature Gauge"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Widget Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {widgetTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = widgetType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setWidgetType(t.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1.5 transition-all ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/20"
                        : "bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {widgetType !== "map" && widgetType !== "table" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Dynamic Field
              </label>
              <select
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                {fields.map((f) => (
                  <option key={f.field_key} value={f.field_key}>
                    {f.name} ({f.field_key}) - {f.unit || "No unit"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {widgetType === "chart" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Chart Visualization Type
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="line">Line Chart (Smooth curve)</option>
                <option value="area">Area Chart (Gradient Fill)</option>
                <option value="bar">Bar Chart (Histogram Columns)</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Adding..." : "Add Widget to Dashboard"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
