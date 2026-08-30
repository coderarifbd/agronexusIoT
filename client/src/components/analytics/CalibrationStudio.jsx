import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { api } from "../../services/api";
import {
  FlaskConical,
  Calculator,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Zap,
  TrendingUp
} from "lucide-react";

export function CalibrationStudio() {
  const { activeChannel } = useProject();
  const [fields, setFields] = useState([]);
  const [calibrations, setCalibrations] = useState([]);
  const [calculatedFields, setCalculatedFields] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calibration Form
  const [selectedField, setSelectedField] = useState("ph");
  const [points, setPoints] = useState([
    { buffer: 4.0, reading: 4.12 },
    { buffer: 7.0, reading: 7.18 },
    { buffer: 10.0, reading: 9.85 }
  ]);
  const [calibSuccess, setCalibSuccess] = useState("");

  // Calculated Field Form
  const [calcName, setCalcName] = useState("");
  const [targetKey, setTargetKey] = useState("");
  const [formula, setFormula] = useState("");
  const [calcUnit, setCalcUnit] = useState("W");

  useEffect(() => {
    if (activeChannel?.id) {
      loadData();
    }
  }, [activeChannel?.id]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getChannel(activeChannel.id);
      setFields(res.fields || []);
      setCalibrations(res.calibrations || []);
      setCalculatedFields(res.calculatedFields || []);
      if (res.fields?.length > 0) {
        setSelectedField(res.fields[0].field_key);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handlePointChange(index, key, val) {
    const updated = [...points];
    updated[index][key] = parseFloat(val) || 0;
    setPoints(updated);
  }

  function handleAddPoint() {
    setPoints([...points, { buffer: 0, reading: 0 }]);
  }

  function handleRemovePoint(index) {
    if (points.length <= 2) return;
    setPoints(points.filter((_, i) => i !== index));
  }

  async function handleSaveCalibration(e) {
    e.preventDefault();
    if (!activeChannel?.id) return;
    try {
      const res = await api.calibrateSensor(activeChannel.id, {
        field_key: selectedField,
        points
      });
      setCalibSuccess(res.message);
      setCalibrations(res.calibrations);
      setTimeout(() => setCalibSuccess(""), 4000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddCalculatedField(e) {
    e.preventDefault();
    if (!calcName || !targetKey || !formula || !activeChannel?.id) return;
    try {
      const res = await api.addCalculatedField(activeChannel.id, {
        name: calcName,
        target_field_key: targetKey.toLowerCase().replace(/\s+/g, "_"),
        formula,
        unit: calcUnit
      });
      setCalculatedFields(res.calculatedFields);
      setCalcName("");
      setTargetKey("");
      setFormula("");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteCalculatedField(id) {
    try {
      const res = await api.deleteCalculatedField(activeChannel.id, id);
      setCalculatedFields(res.calculatedFields);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FlaskConical className="w-6 h-6 text-emerald-400" />
          Sensor Calibration Studio & Virtual Calculated Formulas
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Multi-point linear sensor calibration curves and calculated dynamic formula fields (e.g. Power = Voltage × Current).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Multi-Point Sensor Calibration Studio (Item 25) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              Multi-Point Sensor Calibration
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">y = slope · x + intercept</span>
          </div>

          {calibSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{calibSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveCalibration} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Select Sensor to Calibrate</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
              >
                {fields.map((f) => (
                  <option key={f.field_key} value={f.field_key}>
                    {f.name} ({f.field_key}) - {f.unit || "unit"}
                  </option>
                ))}
              </select>
            </div>

            {/* Calibration Points Table */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase">Buffer vs Raw Reading</span>
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Point
                </button>
              </div>

              <div className="space-y-2">
                {points.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={pt.buffer}
                        onChange={(e) => handlePointChange(i, "buffer", e.target.value)}
                        placeholder="Known Buffer Value"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        required
                      />
                    </div>
                    <span className="text-slate-500 font-bold">➔</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={pt.reading}
                        onChange={(e) => handlePointChange(i, "reading", e.target.value)}
                        placeholder="Raw Sensor Reading"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(i)}
                      disabled={points.length <= 2}
                      className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Compute & Apply Calibration</span>
            </button>
          </form>

          {/* Active Calibrations List */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Active Channel Calibrations ({calibrations.length})
            </h4>
            <div className="space-y-2">
              {calibrations.map((c) => (
                <div key={c.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between font-mono">
                  <span className="font-bold text-white uppercase">{c.field_key}</span>
                  <span className="text-emerald-400">
                    y = {c.slope}x + ({c.intercept})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Calculated Dynamic Fields (Item 13) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Dynamic Calculated Formula Fields
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Virtual Sensor Synthesis</span>
          </div>

          <form onSubmit={handleAddCalculatedField} className="space-y-3.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Field Display Name</label>
                <input
                  type="text"
                  value={calcName}
                  onChange={(e) => {
                    setCalcName(e.target.value);
                    if (!targetKey) setTargetKey(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                  }}
                  placeholder="e.g. Total Power"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target JSON Key</label>
                <input
                  type="text"
                  value={targetKey}
                  onChange={(e) => setTargetKey(e.target.value)}
                  placeholder="e.g. total_power"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Math Formula Expression (Use existing field keys)
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g. voltage * current or temperature + 5"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                required
              />
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Supported: <code className="text-emerald-400">+ - * / sqrt(x) exp(x)</code>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Calculated Field</span>
            </button>
          </form>

          {/* Active Calculated Fields List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Configured Calculated Fields ({calculatedFields.length})
            </h4>

            {calculatedFields.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                No calculated fields configured for this channel yet.
              </div>
            )}

            {calculatedFields.map((cf) => (
              <div
                key={cf.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{cf.name}</div>
                  <div className="text-xs font-mono text-emerald-400 mt-0.5">
                    {cf.target_field_key} = <span className="text-slate-300">{cf.formula}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCalculatedField(cf.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
