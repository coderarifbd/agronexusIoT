import React, { useState } from "react";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { Power, Wind, Droplet, Sun, Lock, Unlock } from "lucide-react";

export function ActuatorWidget({ actuator }) {
  const { actuatorStates } = useSocket();
  const [loading, setLoading] = useState(false);

  // Use live socket state or fallback to actuator.state
  const currentState = actuatorStates[actuator.id] !== undefined ? actuatorStates[actuator.id] : actuator.state;
  const isOn = currentState === "1" || currentState === 1;

  const getIcon = (iconName) => {
    switch (iconName) {
      case "wind":
      case "fan":
        return <Wind className="w-5 h-5" />;
      case "droplet":
      case "pump":
        return <Droplet className="w-5 h-5" />;
      case "sun":
      case "light":
        return <Sun className="w-5 h-5" />;
      case "lock":
      case "door":
        return isOn ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />;
      default:
        return <Power className="w-5 h-5" />;
    }
  };

  async function handleToggle() {
    setLoading(true);
    const nextState = isOn ? "0" : "1";
    try {
      await api.controlActuator(actuator.id, nextState);
    } catch (e) {
      console.error("Actuator control error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex items-center justify-between shadow-sm dark:shadow-md ${
        isOn
          ? "bg-emerald-50/80 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-emerald-300 dark:border-emerald-500/50 shadow-emerald-500/10"
          : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            isOn
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 shadow-sm"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          {getIcon(actuator.icon || actuator.actuator_key)}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{actuator.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isOn ? "bg-emerald-500 animate-ping" : "bg-rose-500"
              }`}
            />
            <span className={`text-xs font-mono font-semibold ${isOn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
              {isOn ? "ACTIVE (ON)" : "STANDBY (OFF)"}
            </span>
          </div>
        </div>
      </div>

      {/* Modern iOS / Futuristic Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
          isOn ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
        } ${loading ? "opacity-60 cursor-wait" : ""}`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
            isOn ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
