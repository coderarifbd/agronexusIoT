import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FolderTree,
  Cpu,
  Workflow,
  LineChart,
  FlaskConical,
  UserCheck,
  LogOut,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

export function Sidebar({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();

  const navigation = [
    { id: "dashboard", name: "Live Dashboard", icon: LayoutDashboard },
    { id: "projects", name: "Projects & Channels", icon: FolderTree },
    { id: "devices", name: "IoT Devices Fleet", icon: Cpu },
    { id: "automation", name: "Rule & Automation", icon: Workflow },
    { id: "analytics", name: "Analytics & Export", icon: LineChart },
    { id: "calibration", name: "Calibration Studio", icon: FlaskConical },
    { id: "profile", name: "Security & Profile", icon: UserCheck }
  ];

  return (
    <aside className="w-64 bg-[#0a0e17] border-r border-slate-800/80 flex flex-col justify-between shrink-0 hidden md:flex">
      {/* Nav list */}
      <div className="p-4 space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
          Platform Navigation
        </div>

        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400">
              {user?.name?.[0] || "T"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.name || "Tanni"}</div>
              <div className="text-[10px] text-slate-400 font-mono">{user?.user_id_code || "ANAMI-001"}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-slate-400 text-center font-mono">
          AgroNexus IoT Engine v2.0 • Secured
        </div>
      </div>
    </aside>
  );
}
