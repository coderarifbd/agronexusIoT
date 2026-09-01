import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Table, Download, RefreshCw } from "lucide-react";

export function TableWidget({ channelId, fields = [] }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channelId) {
      loadData();
    }
  }, [channelId]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getHistoricalData(channelId, "24h");
      setData(res.records.reverse()); // latest first
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadCSV() {
    window.open(`/api/telemetry/channel/${channelId}/export?format=csv`, "_blank");
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-full overflow-hidden shadow-sm dark:shadow-md transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Raw Sensor Telemetry Log</h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh Feed"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[300px] border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] sticky top-0 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-3 py-2.5">Time</th>
              {fields.map((f) => (
                <th key={f.field_key} className="px-3 py-2.5">
                  {f.name} ({f.unit || ""})
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={fields.length + 1} className="text-center py-8 text-slate-400 dark:text-slate-500">
                  No telemetry rows available.
                </td>
              </tr>
            )}
            {data.slice(0, 50).map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {new Date(row.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </td>
                {fields.map((f) => {
                  const val = row[f.field_key];
                  return (
                    <td key={f.field_key} className="px-3 py-2 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {val !== undefined ? val : "--"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
