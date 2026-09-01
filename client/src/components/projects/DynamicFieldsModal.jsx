import React, { useState } from "react";
import { api } from "../../services/api";
import { X, Plus, Trash2, Sliders, Activity } from "lucide-react";

export function DynamicFieldsModal({ isOpen, onClose, channel, onFieldsUpdated }) {
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [unit, setUnit] = useState("°C");
  const [icon, setIcon] = useState("thermometer");
  const [color, setColor] = useState("#10B981");
  const [minVal, setMinVal] = useState("0");
  const [maxVal, setMaxVal] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !channel) return null;

  async function handleAddField(e) {
    e.preventDefault();
    if (!name || !fieldKey) {
      setError("Display Name and Field Key (e.g. temperature, soil_ph) are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.addField(channel.id, {
        name,
        field_key: fieldKey.toLowerCase().replace(/\s+/g, "_"),
        unit,
        icon,
        color,
        min_value: parseFloat(minVal) || 0,
        max_value: parseFloat(maxVal) || 100
      });
      setName("");
      setFieldKey("");
      onFieldsUpdated();
    } catch (err) {
      setError(err.message || "Failed to add dynamic field.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteField(fieldId) {
    if (!window.confirm("Are you sure you want to delete this sensor field?")) return;
    try {
      await api.deleteField(channel.id, fieldId);
      onFieldsUpdated();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Dynamic Sensor Fields — {channel.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No 8-field limitation. Add unlimited custom sensor parameters.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Fields List */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Active Channel Sensor Fields ({channel.fields?.length || 0})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {channel.fields?.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${f.color}20`, color: f.color }}
                  >
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Key: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{f.field_key}</span> • Unit: {f.unit || "None"} • Range: [{f.min_value} – {f.max_value}]
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteField(f.id)}
                  title="Remove Field"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Field Form */}
        <form onSubmit={handleAddField} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            + Add New Custom Sensor Field
          </h4>

          {error && <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-200 dark:border-rose-500/20">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Field Label / Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!fieldKey) setFieldKey(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                }}
                placeholder="e.g. Soil Salinity"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">JSON Key (Device Payload Key)</label>
              <input
                type="text"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="e.g. soil_salinity"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. ppm, °C, %, Lux"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Min Value</label>
              <input
                type="number"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Max Value</label>
              <input
                type="number"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Theme Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{color}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Adding..." : "Add Sensor Field"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
