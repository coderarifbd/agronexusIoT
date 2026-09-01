import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { MetricCard } from "../widgets/MetricCard";
import { ChartWidget } from "../widgets/ChartWidget";
import { TableWidget } from "../widgets/TableWidget";
import { useTheme } from "../../context/ThemeContext";
import { Radio, Lock, Activity, Sun, Moon } from "lucide-react";

export function PublicDashboard({ slug }) {
  const { isDark, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicData();
  }, [slug]);

  async function loadPublicData(pass = "") {
    try {
      setLoading(true);
      setError("");
      const res = await api.getPublicDashboard(slug, pass);
      setData(res);
    } catch (e) {
      if (e.data?.requiresPassword) {
        setError("Password required to view this protected dashboard.");
      } else {
        setError(e.message || "Failed to load public dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock(e) {
    e.preventDefault();
    loadPublicData(password);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono transition-colors">
        <Activity className="w-6 h-6 animate-spin text-emerald-500 mr-2" />
        Connecting to AgroNexus Public IoT Stream...
      </div>
    );
  }

  if (error && (!data || !data.channel)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] flex items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
          <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Protected IoT Dashboard</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error}</p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Dashboard Access Key"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none font-mono"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { channel, fields, currentValues } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-100 p-4 sm:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Public Header */}
        <header className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                  PUBLIC STREAM
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{channel.name}</h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Owner: <span className="text-slate-800 dark:text-slate-200 font-semibold">{channel.owner_name}</span> ({channel.user_id_code}) • Project: {channel.project_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>AgroNexus Live Gateway</span>
            </div>
          </div>
        </header>

        {/* Live Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map((f) => (
            <MetricCard
              key={f.field_key}
              field={f}
              value={currentValues[f.field_key]}
              unit={f.unit}
              color={f.color}
              min={f.min_value}
              max={f.max_value}
            />
          ))}
        </div>

        {/* Charts & Raw Table */}
        <div className="grid grid-cols-1 gap-6">
          <ChartWidget
            title={`${channel.name} — 24-Hour Telemetry History`}
            channelId={channel.id}
            fields={fields}
            chartType="line"
          />
          <TableWidget channelId={channel.id} fields={fields} />
        </div>
      </div>
    </div>
  );
}
