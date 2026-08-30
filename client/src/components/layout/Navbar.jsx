import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../services/api";
import {
  Activity,
  Bell,
  Bot,
  ChevronDown,
  Layers,
  Lock,
  Radio,
  Play,
  Pause,
  RefreshCw,
  ShieldCheck,
  Unlock,
  Zap,
  User,
  Sliders
} from "lucide-react";

export function Navbar({ onOpenAI, onOpenAlerts, onOpenActivity, onOpenSimulator }) {
  const { user, isPasskeyUnlocked, setShowPasskeyModal, lockDashboard, logout } = useAuth();
  const { projects, activeProject, selectProject, channels, activeChannel, selectChannel } = useProject();
  const { alerts, latestTelemetry } = useSocket();

  const [simRunning, setSimRunning] = useState(true);
  const [simBursting, setSimBursting] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  async function handleToggleSimulator() {
    try {
      const res = await api.toggleSimulator();
      setSimRunning(res.isRunning);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleBurstTelemetry() {
    setSimBursting(true);
    try {
      await api.burstSimulator();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSimBursting(false), 500);
    }
  }

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent flex items-center gap-1.5">
              AgroNexus <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">IoT</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span>{user?.user_id_code || "ANAMI-001"}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">{user?.name || "Tanni"}</span>
            </div>
          </div>
        </div>

        {/* Project & Channel Dropdowns */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          {/* Project Picker */}
          <div className="relative group">
            <select
              value={activeProject?.id || ""}
              onChange={(e) => {
                const found = projects.find(p => p.id === e.target.value);
                if (found) selectProject(found);
              }}
              className="bg-transparent text-slate-200 font-medium pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none cursor-pointer appearance-none hover:text-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  📁 {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <span className="text-slate-700">/</span>

          {/* Channel Picker */}
          <div className="relative group">
            <select
              value={activeChannel?.id || ""}
              onChange={(e) => {
                const found = channels.find(c => c.id === e.target.value);
                if (found) selectChannel(found);
              }}
              className="bg-transparent text-emerald-400 font-semibold pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none cursor-pointer appearance-none hover:text-emerald-300"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  📊 Ch {c.channel_number || "01"}: {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Virtual Hardware Simulator Control */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${simRunning ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
            <span className="text-[11px] text-slate-300 font-medium">IoT Sim</span>
          </div>
          <button
            onClick={handleToggleSimulator}
            title={simRunning ? "Pause Virtual Hardware Telemetry" : "Resume Telemetry"}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            {simRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={handleBurstTelemetry}
            disabled={simBursting}
            title="Inject Instant Telemetry Burst"
            className={`p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors ${simBursting ? "animate-spin text-emerald-400" : ""}`}
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Passkey Gate Status */}
        {isPasskeyUnlocked ? (
          <button
            onClick={lockDashboard}
            title="Master Passkey Unlocked (Click to Lock Dashboard)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition-all"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Passkey Active</span>
          </button>
        ) : (
          <button
            onClick={() => setShowPasskeyModal(true)}
            title="Dashboard Locked. Click to enter Master Passkey"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-900/60 transition-all animate-pulse-slow"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unlock Passkey</span>
          </button>
        )}

        {/* AI IoT Assistant Button */}
        <button
          onClick={onOpenAI}
          title="Open AI IoT Assistant"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:from-indigo-600/50 hover:to-purple-600/50 transition-all"
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlerts}
          title="View Alerts & Notifications"
          className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-800"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
              {unreadAlerts}
            </span>
          )}
        </button>

        {/* Activity Log Drawer Trigger */}
        <button
          onClick={onOpenActivity}
          title="Real-time Activity Log"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-800"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
