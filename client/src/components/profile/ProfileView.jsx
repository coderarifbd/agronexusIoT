import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  UserCheck,
  History,
  Lock,
  Save
} from "lucide-react";

export function ProfileView() {
  const { user, refreshProfile } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || "");
  const [profilePic, setProfilePic] = useState(user?.profile_pic || "");
  const [profileMsg, setProfileMsg] = useState("");

  // Password Form
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState("");

  // Login History
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadLoginHistory();
  }, []);

  async function loadLoginHistory() {
    try {
      const res = await api.getLoginHistory();
      setHistory(res.history || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      await api.updateProfile({ name, profile_pic: profilePic });
      setProfileMsg("Profile updated successfully.");
      refreshProfile();
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (e) {
      setProfileMsg("Update failed.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    try {
      await api.changePassword({ currentPassword: curPass, newPassword: newPass });
      setPassMsg("Password updated successfully.");
      setCurPass("");
      setNewPass("");
      setTimeout(() => setPassMsg(""), 3000);
    } catch (e) {
      setPassMsg(e.message || "Failed to update password.");
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn transition-colors">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          User Profile & Security Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Identity management, password updates, and login audit trails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Profile Details Card */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-base">
              {user?.user_id_code?.slice(-3) || "001"}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h3>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{user?.user_id_code}</span>
            </div>
          </div>

          {profileMsg && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Username (Immutable)</label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-400 dark:text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-400 dark:text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">User ID Badge</label>
              <input
                type="text"
                value={user?.user_id_code || "ANAMI-001"}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>

        {/* 2. Password Change */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Change Login Password
            </h3>

            {passMsg && (
              <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 rounded-lg">
                {passMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={curPass}
                  onChange={(e) => setCurPass(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* 3. Login History Audit Trail */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Login Audit Trail
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Last 20 Logins</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 text-xs font-mono">
            {history.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">No login records found.</div>
            )}

            {history.map((h) => (
              <div key={h.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={h.status === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"}>
                    {h.status}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">IP: {h.ip_address || "127.0.0.1"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
