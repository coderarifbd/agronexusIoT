import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/api";
import {
  Radio,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  CheckCircle2,
  Sparkles,
  X
} from "lucide-react";

export function LoginModal({ onClose, initialUserType = "existing" }) {
  const { user, login, register } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Wizard Step: 1 = Identifier / Welcome, 2 = Login or Create Account
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(initialUserType); // 'existing' or 'new'

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [detectedUser, setDetectedUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return null;

  // Handle Step 1: Next button clicked
  async function handleStep1Next(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter User ID, Username, or Email.");
      return;
    }
    if (!password) {
      setError("Please enter Account Password.");
      return;
    }

    try {
      setLoading(true);

      const isAnami =
        (identifier.trim().toLowerCase() === "anami" || identifier.trim().toLowerCase() === "anami-001") &&
        password === "2341";

      if (userType === "new") {
        // New User Flow:
        // Enter Anami / 2341 on 1st page -> opens Create Account page
        if (isAnami) {
          setEmail("");
          setPassword("");
          setStep(2);
          return;
        } else {
          setError("New users must enter USER ID: Anami and PASSWORD: 2341 to proceed to account creation.");
          return;
        }
      } else {
        // Existing User Flow:
        // Enter Anami / 2341 or registered account -> Directly to dashboard!
        if (isAnami) {
          await login("Anami", "2341");
          localStorage.setItem("agx_has_account", "true");
          return;
        }

        const res = await api.checkUser(identifier.trim());
        if (res && res.exists) {
          await login(identifier.trim(), password);
          localStorage.setItem("agx_has_account", "true");
          return;
        } else {
          setError("Account not found. If you are a new user, please click the 'New User' tab above.");
        }
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message || "Invalid credentials. Please verify your password.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 2 Submission (Create Account or Login with Email & Password)
  async function handleStep2Submit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Check if Anami credentials entered
      const isAnami =
        (email.trim().toLowerCase() === "anami" || email.trim().toLowerCase() === "anami-001") &&
        password === "2341";

      if (isAnami) {
        await login("Anami", "2341");
        localStorage.setItem("agx_has_account", "true");
        return;
      }

      // Check if account already exists
      const check = await api.checkUser(email.trim());
      if (check && check.exists) {
        await login(email.trim(), password);
        localStorage.setItem("agx_has_account", "true");
        return;
      } else {
        const derivedName = email.split("@")[0] || "User";
        await register({
          name: derivedName,
          username: derivedName.toLowerCase().replace(/[^a-z0-9_]/g, "") + "_" + Math.floor(100 + Math.random() * 900),
          email: email.trim(),
          password
        });
        localStorage.setItem("agx_has_account", "true");
      }
    } catch (err) {
      console.error("Step 2 auth error:", err);
      setError(err.message || "Failed to proceed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-[#070a12]/95 backdrop-blur-lg transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute top-4 right-4 flex items-center gap-2">
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
          {/* Theme toggle in corner */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* STEP 1: Enter ID / Username & Password, Click Next */}
        {step === 1 && (
          <div className="animate-fadeIn">
            {/* Brand Header */}
            <div className="text-center mb-5">
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

            {/* Existing User vs New User Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setUserType("existing");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  userType === "existing"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Existing User
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setUserType("new");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  userType === "new"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                New User
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStep1Next} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  User ID / Username / Email
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter User ID, Username, or Email"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none"
                  required
                />
              </div>

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
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>{loading ? "Checking..." : "Next"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Create Account (Email, Password, Next) */}
        {step === 2 && (
          <div className="animate-fadeIn">
            {/* Header: Centered 'Create Account' with subtle back button */}
            <div className="relative flex items-center justify-center mb-6">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="absolute left-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Back to Login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Create Account
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Password
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
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>{loading ? "Processing..." : "Next"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
