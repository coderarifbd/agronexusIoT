import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/api";
import {
  Radio,
  AlertTriangle,
  ArrowRight,
  Sun,
  Moon,
  UserPlus,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  X
} from "lucide-react";

export function LoginModal({ onClose }) {
  const { user, login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Form Fields: Name, Email, Password (Confirm Password removed per user request)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, close modal
  if (user) return null;

  // --------------------------------------------------------------------------
  // HANDLE CREATE ACCOUNT (Unified Create / Access Dashboard Flow)
  // --------------------------------------------------------------------------
  async function handleCreateAccount(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // Support for default admin credentials for backward compatibility
      const isAnami =
        (cleanEmail === "anami" || cleanEmail === "anami-001") && password === "2341";
      if (isAnami) {
        await login("Anami", "2341");
        localStorage.setItem("agx_has_account", "true");
        if (onClose) onClose();
        return;
      }

      // Check if user already has an account
      const checkRes = await api.checkUser(cleanEmail);
      if (checkRes && checkRes.exists) {
        // User already has an account -> Log in directly to their dashboard!
        await login(cleanEmail, password);
        localStorage.setItem("agx_has_account", "true");
        if (onClose) onClose();
        return;
      }

      // New user -> Create Account and proceed directly to dashboard!
      const derivedName = name.trim() || cleanEmail.split("@")[0] || "User";
      const baseUsername = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15);
      const username = `${baseUsername || "user"}_${Math.floor(100 + Math.random() * 900)}`;

      await register({
        name: derivedName,
        username,
        email: cleanEmail,
        password
      });

      localStorage.setItem("agx_has_account", "true");
      if (onClose) onClose();
    } catch (err) {
      console.error("Account creation/login error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to proceed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-[#070a12]/95 backdrop-blur-md transition-colors animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-colors">
        
        {/* Top Control Buttons: Close & Theme Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/15 dark:bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2.5">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your email and password to access your private IoT dashboard
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* CREATE ACCOUNT FORM (Email & Password, No Confirm Password) */}
        {/* ================================================================== */}
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoFocus
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password (No confirm password) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Action Button: [ Create Account ] */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <span>{loading ? "Processing..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security & Multi-Tenant Privacy Guarantee Banner */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            <strong>Individual Private Dashboard:</strong> Your sensors, devices, channels, and telemetry are strictly private to your account.
          </span>
        </div>
      </div>
    </div>
  );
}
