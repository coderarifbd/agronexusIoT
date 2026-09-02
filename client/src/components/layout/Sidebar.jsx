import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Radio,
  Cpu,
  UserCheck,
  Terminal,
  CircuitBoard,
  LogOut
} from "lucide-react";

export function Sidebar({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();

  const navigation = [
    { id: "dashboard", name: "Live Dashboard", icon: LayoutDashboard },
    { id: "channels", name: "My Channels", icon: Radio },
    { id: "devices", name: "IoT Devices Fleet", icon: Cpu },
    { id: "codegen", name: "Code Generator", icon: Terminal, badge: "NEW" },
    { id: "circuit", name: "Cirkit Design", icon: CircuitBoard, badge: "IDE" },
    { id: "profile", name: "Security & Profile", icon: UserCheck }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0e17] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 hidden md:flex transition-colors">
      {/* Nav list */}
      <div className="p-4 space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
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
                  ? "bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`} />
              <span className="flex-1 text-left">{item.name}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600 text-white leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {user?.name?.[0] || "T"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user?.name || "Tanni"}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{user?.user_id_code || "ANAMI-001"}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono">
          AgroNexus IoT Engine v2.0 • Secured
        </div>
      </div>
    </aside>
  );
}
