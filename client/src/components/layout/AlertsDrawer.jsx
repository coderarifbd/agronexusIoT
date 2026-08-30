import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { X, Bell, AlertTriangle, AlertCircle, Info, Check } from "lucide-react";

export function AlertsDrawer({ isOpen, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      setAlerts(res.alerts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: 1 } : a));
    } catch (e) {
      console.error(e);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">System Alerts & Notifications</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading && <div className="text-center text-slate-500 py-8">Loading alerts...</div>}
          {!loading && alerts.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
              All systems nominal. No active alerts.
            </div>
          )}

          {alerts.map((a) => {
            const isCrit = a.severity === "critical";
            const isWarn = a.severity === "warning";

            return (
              <div
                key={a.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  a.is_read
                    ? "bg-slate-950/40 border-slate-800/60 opacity-60"
                    : isCrit
                    ? "bg-rose-950/30 border-rose-500/40"
                    : isWarn
                    ? "bg-amber-950/30 border-amber-500/40"
                    : "bg-blue-950/30 border-blue-500/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCrit ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-white">{a.title}</span>
                  </div>
                  {!a.is_read && (
                    <button
                      onClick={() => handleMarkRead(a.id)}
                      title="Mark as read"
                      className="text-[11px] text-slate-400 hover:text-emerald-400 underline"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1.5 pl-6">{a.message}</p>
                <div className="text-[10px] text-slate-500 font-mono mt-2 pl-6">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
