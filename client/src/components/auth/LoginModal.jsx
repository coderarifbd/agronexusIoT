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
  LogIn,
  UserPlus,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  X
} from "lucide-react";

export function LoginModal({ onClose, initialUserType = "new" }) {
  const { user, login, register } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Mode: 'signup' (Create Account) or 'login' (Sign In)
  const [mode, setMode] = useState(initialUserType === "existing" ? "login" : "signup");

  // Sign Up Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Log In Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, close modal
  if (user) return null;

  // --------------------------------------------------------------------------
  // HANDLE CREATE ACCOUNT (SIGN UP)
  // --------------------------------------------------------------------------
  async function handleSignUp(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);

      // Check if user already exists
      const checkRes = await api.checkUser(email.trim());
      if (checkRes && checkRes.exists) {
        setError("An account with this email already exists! Please log in below.");
        setLoginIdentifier(email.trim());
        setMode("login");
        return;
      }

      // Generate a clean username from name or email
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15);
      const username = `${baseUsername || "user"}_${Math.floor(100 + Math.random() * 900)}`;

      await register({
        name: name.trim(),
        username,
        email: email.trim().toLowerCase(),
        password
      });

      localStorage.setItem("agx_has_account", "true");
      if (onClose) onClose();
    } catch (err) {
      console.error("Sign up error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to create account.";
      if (msg.toLowerCase().includes("already registered")) {
        setError("This email is already registered! Please switch to Log In below.");
        setLoginIdentifier(email.trim());
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------------------------------
  // HANDLE SIGN IN (LOG IN)
  // --------------------------------------------------------------------------
  async function handleLogIn(e) {
    e.preventDefault();
    setError("");

    if (!loginIdentifier.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!loginPassword) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // Support for default admin / demo credentials for backward compatibility
      const isAnami =
        (loginIdentifier.trim().toLowerCase() === "anami" || loginIdentifier.trim().toLowerCase() === "anami-001") &&
        loginPassword === "2341";

      if (isAnami) {
        await login("Anami", "2341");
        localStorage.setItem("agx_has_account", "true");
        if (onClose) onClose();
        return;
      }

      await login(loginIdentifier.trim(), loginPassword);
      localStorage.setItem("agx_has_account", "true");
      if (onClose) onClose();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || err.message || "Invalid email or password. Please check your credentials.");
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
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2.5">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            AgroNexus <span className="text-emerald-600 dark:text-emerald-400">IoT</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise Telemetry, Hardware Control & Automation
          </p>
        </div>

        {/* Mode Selector Tabs: [ Create Account ] vs [ Log In ] */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode("signup");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "signup"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode("login");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "login"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* CREATE ACCOUNT (SIGN UP) INTERFACE */}
        {/* ================================================================== */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3.5 animate-fadeIn">
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
                  placeholder="e.g. Arif Hossain"
                  autoFocus
                  required
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
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="At least 4 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <span>{loading ? "Creating Account..." : "Create Account & Go to Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Log In */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          </form>
        )}

        {/* ================================================================== */}
        {/* LOG IN (SIGN IN) INTERFACE */}
        {/* ================================================================== */}
        {mode === "login" && (
          <form onSubmit={handleLogIn} className="space-y-3.5 animate-fadeIn">
            {/* Email or Username */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Email or Username
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter email or username"
                  autoFocus
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <span>{loading ? "Signing In..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Sign Up */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode("signup");
                }}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* Security & Multi-Tenant Privacy Guarantee Banner */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            <strong>Private Dashboard:</strong> All telemetry channels, devices, and sensors are strictly isolated to your individual account.
          </span>
        </div>
      </div>
    </div>
  );
}
