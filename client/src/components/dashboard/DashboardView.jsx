import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useProject } from "../../context/ProjectContext";
import { Radio, Plus, Activity, ExternalLink, Calendar, Lock, Globe, ArrowRight } from "lucide-react";

export function DashboardView({ onNavigateToChannels }) {
  const { selectChannel } = useProject();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllUserChannels();
  }, []);

  async function loadAllUserChannels() {
    try {
      setLoading(true);
      const res = await api.getMyChannels();
      setChannels(res.channels || []);
    } catch (e) {
      console.error("Failed to load user channels:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChannel(channel) {
    selectChannel(channel);
    if (onNavigateToChannels) {
      onNavigateToChannels();
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-sm">
        <Activity className="w-8 h-8 animate-spin text-[#137f3a] mx-auto mb-3" />
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn text-sm">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {channels.length > 0
              ? `You have ${channels.length} created ${channels.length === 1 ? "channel" : "channels"}.`
              : "No channels created yet."}
          </p>
        </div>

        {onNavigateToChannels && (
          <button
            onClick={onNavigateToChannels}
            className="px-4 py-2 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-xs rounded shadow transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Channel</span>
          </button>
        )}
      </div>

      {/* Main Content: ONLY Created Channels */}
      {channels.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-800 dark:text-white text-base">No Channels Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't created any channels yet. Click below to create your first IoT channel.
            </p>
          </div>
          {onNavigateToChannels && (
            <button
              onClick={onNavigateToChannels}
              className="px-5 py-2 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-xs rounded shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Channel</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Header Badge & Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                        {channel.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        Channel ID: {channel.channel_number || channel.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>

                  {channel.is_public ? (
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded text-[10px] font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                </div>

                {/* Channel Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {channel.description || "No description provided for this channel."}
                </p>

                {/* Created Date */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created: {new Date(channel.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenChannel(channel)}
                  className="w-full py-2 bg-slate-50 hover:bg-[#137f3a] text-slate-700 hover:text-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-[#137f3a] dark:hover:text-white font-semibold text-xs rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Channel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
