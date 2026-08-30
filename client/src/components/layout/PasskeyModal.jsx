import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Eye, EyeOff } from "lucide-react";

export function PasskeyModal() {
  const { user, showPasskeyModal, setShowPasskeyModal, unlockWithPasskey } = useAuth();
  const [passkey, setPasskey] = useState("");
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showPasskeyModal) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!passkey) {
      setError("Please enter your Master Passkey.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await unlockWithPasskey(passkey);
      setPasskey("");
    } catch (err) {
      setError(err.message || "Invalid Master Passkey. Access Denied.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
            <Lock className="w-8 h-8 text-white animate-pulse-slow" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Security Passkey Gate</h3>
          <p className="text-sm text-slate-400 mt-1">
            Master Passkey required to access telemetry & actuators.
          </p>
        </div>

        {/* User Card */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              {user?.user_id_code?.slice(-3) || "001"}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{user?.name || "User"}</div>
              <div className="text-xs font-mono text-emerald-400">{user?.user_id_code || "ANAMI-001"}</div>
            </div>
          </div>
          <span className="text-xs bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full font-mono border border-slate-600">
            {user?.email || "tanni@agronexus.iot"}
          </span>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-3.5 py-2.5 rounded-xl mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Enter Master Passkey</span>
              <span className="text-[11px] text-slate-500">Default: <code className="text-emerald-400">passkey123</code></span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showText ? "text" : "password"}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="●●●●●●●●"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 text-sm font-mono transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowText(!showText)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            {loading ? "Verifying Passkey..." : "Unlock Dashboard"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowPasskeyModal(false)}
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            Cancel & View Read-Only
          </button>
        </div>
      </div>
    </div>
  );
}
