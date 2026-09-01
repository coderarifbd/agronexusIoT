import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Radio, AlertTriangle, ArrowRight, Sun, Moon } from "lucide-react";

export function LoginModal() {
  const { user, login, register } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isRegistering, setIsRegistering] = useState(false);

  // Form State
  const [identifier, setIdentifier] = useState("ANAMI-001");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Tanni");
  const [username, setUsername] = useState("tanni");
  const [email, setEmail] = useState("tanni@agronexus.iot");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await register({ name, username, email, password });
      } else {
        await login(identifier, password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#070a12]/95 backdrop-blur-lg transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-colors">
        {/* Theme toggle button in corner */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
            <Radio className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">AgroNexus IoT</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Telemetry, Hardware Actuator Control & Rule Automation
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanni"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tanni"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tanni@agro.io"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {!isRegistering && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                User ID / Username / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ANAMI-001 or email"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-3.5 pr-12 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">ANAMI-001</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Account Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? "Authenticating..." : isRegistering ? "Create IoT Account" : "Sign In to AgroNexus"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          {isRegistering ? (
            <span>
              Already have an IoT account?{" "}
              <button
                onClick={() => setIsRegistering(false)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to AgroNexus?{" "}
              <button
                onClick={() => setIsRegistering(true)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                Create Account (ANAMI-ID)
              </button>
            </span>
          )}
        </div>

        {/* Demo credentials hint */}
        {!isRegistering && (
          <div className="mt-4 p-2.5 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 font-mono text-center">
            Default Demo: <span className="text-slate-800 dark:text-slate-300 font-bold">ANAMI-001</span> | Password: <span className="text-slate-800 dark:text-slate-300 font-bold">password123</span>
          </div>
        )}
      </div>
    </div>
  );
}
