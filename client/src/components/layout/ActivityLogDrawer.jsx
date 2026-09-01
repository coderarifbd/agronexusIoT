import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { X, Activity, RefreshCw } from "lucide-react";

export function ActivityLogDrawer({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await api.getActivityLogs();
      setLogs(res.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">System Activity & Audit Stream</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadLogs} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 font-mono text-xs">
          {loading && <div className="text-center text-slate-400 dark:text-slate-500 py-8">Loading stream...</div>}
          {!loading && logs.length === 0 && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-12">No activity events recorded yet.</div>
          )}

          {logs.map((log) => {
            return (
              <div
                key={log.id}
                className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">[{log.event_type}]</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-800 dark:text-slate-200 text-xs font-sans font-medium">{log.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
