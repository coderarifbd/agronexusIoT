import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/api";
import {
  Activity,
  Bell,
  Bot,
  ChevronDown,
  Radio,
  Play,
  Pause,
  Zap,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Cpu,
  UserCheck,
  LogOut,
  Folder,
  ArrowLeft,
  Terminal,
  CircuitBoard
} from "lucide-react";

export function Navbar({ onOpenAI, onOpenAlerts, onOpenActivity, onOpenSimulator, currentTab, setCurrentTab, onBack, canGoBack }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { projects, activeProject, selectProject, channels, activeChannel, selectChannel } = useProject();
  const { alerts } = useSocket();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
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

  const navItems = [
    { id: "dashboard", name: "Live Dashboard", icon: LayoutDashboard },
    { id: "channels", name: "My Channels", icon: Radio },
    { id: "devices", name: "IoT Devices Fleet", icon: Cpu },
    { id: "codegen", name: "Code Generator", icon: Terminal },
    { id: "circuit", name: "Cirkit Design", icon: CircuitBoard },
    { id: "profile", name: "Security & Profile", icon: UserCheck }
  ];

  function handleMobileNavClick(tabId) {
    if (setCurrentTab) setCurrentTab(tabId);
    setMobileMenuOpen(false);
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2.5 sm:gap-6">
        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle Mobile Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Universal Back Button (Visible when not on primary dashboard) */}
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Go Back to Previous Screen"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#137f3a] dark:text-emerald-400" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer" onClick={() => handleMobileNavClick("dashboard")}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-600 dark:from-white dark:via-slate-100 dark:to-emerald-400 bg-clip-text text-transparent flex items-center gap-1 sm:gap-1.5">
              AgroNexus <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">IoT</span>
            </div>
            <div className="hidden xs:flex text-[10px] text-slate-500 dark:text-slate-400 font-mono items-center gap-1">
              <span>{user?.user_id_code || "ANAMI-001"}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[100px]">{user?.name || "Tanni"}</span>
            </div>
          </div>
        </div>

        {/* Project & Channel Dropdowns (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
          {/* Project Picker */}
          <div className="relative group">
            <select
              value={activeProject?.id || ""}
              onChange={(e) => {
                const found = projects.find(p => p.id === e.target.value);
                if (found) selectProject(found);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none cursor-pointer appearance-none hover:text-slate-950 dark:hover:text-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  📁 {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          {/* Channel Picker */}
          <div className="relative group">
            <select
              value={activeChannel?.id || ""}
              onChange={(e) => {
                const found = channels.find(c => c.id === e.target.value);
                if (found) selectChannel(found);
              }}
              className="bg-transparent text-emerald-600 dark:text-emerald-400 font-semibold pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none cursor-pointer appearance-none hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  📊 Ch {c.channel_number || "01"}: {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Action Icons & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Virtual Hardware Simulator Control */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${simRunning ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">IoT Sim</span>
          </div>
          <button
            onClick={handleToggleSimulator}
            title={simRunning ? "Pause Virtual Hardware Telemetry" : "Resume Telemetry"}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {simRunning ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
          </button>
          <button
            onClick={handleBurstTelemetry}
            disabled={simBursting}
            title="Inject Instant Telemetry Burst"
            className={`p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${simBursting ? "animate-spin text-emerald-500" : ""}`}
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-amber-300 font-medium">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-indigo-600 font-medium">Dark</span>
            </>
          )}
        </button>

        {/* AI IoT Assistant Button */}
        <button
          onClick={onOpenAI}
          title="Open AI IoT Assistant"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/30 dark:to-purple-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:from-indigo-600/50 dark:hover:to-purple-600/50 transition-all cursor-pointer"
        >
          <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">AI</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlerts}
          title="View Alerts & Notifications"
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
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
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          <Activity className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Navigation Drawer (Shown on screens < md when toggled) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white dark:bg-[#0a0e17] border-b border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-4 animate-slideDown z-50">
          {/* Project & Channel Selectors for Mobile */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Project</label>
              <select
                value={activeProject?.id || ""}
                onChange={(e) => {
                  const found = projects.find(p => p.id === e.target.value);
                  if (found) selectProject(found);
                }}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>📁 {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Channel</label>
              <select
                value={activeChannel?.id || ""}
                onChange={(e) => {
                  const found = channels.find(c => c.id === e.target.value);
                  if (found) selectChannel(found);
                }}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-[#137f3a]"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>📊 {c.name} (Ch {c.channel_number || "01"})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Menu Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* User Info & Sign out */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                {user?.name?.[0] || "U"}
              </div>
              <span className="font-semibold text-slate-800 dark:text-white">{user?.name || "User"}</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
