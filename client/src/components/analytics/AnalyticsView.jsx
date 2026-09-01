import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { api } from "../../services/api";
import {
  LineChart as ChartIcon,
  Download,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar
} from "lucide-react";

export function AnalyticsView() {
  const { activeProject, activeChannel } = useProject();
  const [range, setRange] = useState("24h");
  const [analytics, setAnalytics] = useState({});
  const [report, setReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeChannel?.id) {
      loadAnalytics();
    }
  }, [activeChannel?.id, range]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await api.getAnalytics(activeChannel.id, range);
      setAnalytics(res.analytics || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenMonthlyReport() {
    if (!activeProject?.id) return;
    try {
      const res = await api.getMonthlyReport(activeProject.id);
      setReport(res);
      setShowReportModal(true);
    } catch (e) {
      console.error(e);
    }
  }

  function handleExport(format) {
    if (!activeChannel?.id) return;
    window.open(`/api/telemetry/channel/${activeChannel.id}/export?format=${format}&range=${range}`, "_blank");
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn transition-colors">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ChartIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Telemetry Analytics & Data Export Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Statistical computations, trend direction, standard deviation, and instant CSV/JSON exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenMonthlyReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Project Report</span>
          </button>

          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Time Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm dark:shadow-md">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Analysis Timeframe:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {["1h", "6h", "24h", "7d", "30d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                range === r
                  ? "bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button
            onClick={loadAnalytics}
            className={`p-1.5 text-slate-400 hover:text-emerald-500 ${loading ? "animate-spin text-emerald-500" : ""}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Statistical Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.keys(analytics).length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-mono">
            No telemetry records found for statistical analytics in this timeframe.
          </div>
        )}

        {Object.entries(analytics).map(([fieldKey, stats]) => {
          const isRising = stats.trend === "RISING";
          const isFalling = stats.trend === "FALLING";

          return (
            <div
              key={fieldKey}
              className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm dark:shadow-lg space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">{fieldKey.replace(/_/g, " ")}</h4>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{stats.count} Telemetry Samples</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
                    isRising
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30"
                      : isFalling
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isRising ? <TrendingUp className="w-3.5 h-3.5" /> : isFalling ? <TrendingDown className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                  <span>{stats.percentChange > 0 ? `+${stats.percentChange}%` : `${stats.percentChange}%`}</span>
                </div>
              </div>

              {/* Core Metrics 2x2 */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Average</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{stats.average}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Median</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{stats.median}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-400">Maximum</div>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{stats.maximum}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400">Minimum</div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{stats.minimum}</div>
                </div>
              </div>

              {/* Advanced StdDev and Trend */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Std Dev: ±{stats.stdDev}</span>
                <span>Trend: <strong className="text-emerald-600 dark:text-emerald-400">{stats.trend}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Report Modal */}
      {showReportModal && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  AgroNexus IoT Automated Diagnostics
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{report.reportTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generated: {report.generatedAt}</p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Executive Summary */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider mb-1">Executive Summary</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{report.executiveSummary}</p>
            </div>

            {/* Key KPI Strip */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Device Uptime</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{report.deviceUptimePercentage}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Active Microcontrollers</div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{report.totalActiveDevices}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Alert Dispatches</div>
                <div className="text-xl font-black text-amber-500 dark:text-amber-400 font-mono">{report.totalAlerts}</div>
              </div>
            </div>

            {/* Channel Summaries Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Channel</th>
                    <th className="px-3.5 py-2.5">Samples</th>
                    <th className="px-3.5 py-2.5">Avg Temp</th>
                    <th className="px-3.5 py-2.5">Max Temp</th>
                    <th className="px-3.5 py-2.5">Min Temp</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-700 dark:text-slate-200">
                  {report.channelSummaries.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3.5 py-2 font-bold text-slate-900 dark:text-white font-sans">{c.channelName}</td>
                      <td className="px-3.5 py-2">{c.totalSamples}</td>
                      <td className="px-3.5 py-2 text-emerald-600 dark:text-emerald-400">{c.averageTemperature}°C</td>
                      <td className="px-3.5 py-2 text-rose-600 dark:text-rose-400">{c.maxTemperature}°C</td>
                      <td className="px-3.5 py-2 text-blue-600 dark:text-blue-400">{c.minTemperature}°C</td>
                      <td className="px-3.5 py-2 text-emerald-600 dark:text-emerald-400">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
              >
                Print / Save PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
