import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../services/api";
import { MetricCard } from "../widgets/MetricCard";
import { GaugeWidget } from "../widgets/GaugeWidget";
import { ChartWidget } from "../widgets/ChartWidget";
import { ActuatorWidget } from "../widgets/ActuatorWidget";
import { MapWidget } from "../widgets/MapWidget";
import { TableWidget } from "../widgets/TableWidget";
import { HealthWidget } from "../widgets/HealthWidget";
import { AddWidgetModal } from "./AddWidgetModal";
import {
  Plus,
  Share2,
  Sliders,
  Globe,
  Lock,
  Cpu,
  RefreshCw,
  ExternalLink,
  Zap,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";

export function DashboardView() {
  const { activeProject, activeChannel, refreshActiveChannel } = useProject();
  const { latestTelemetry, actuatorStates } = useSocket();

  const [channelData, setChannelData] = useState(null);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeChannel?.id) {
      loadChannelDetails(activeChannel.id);
    }
  }, [activeChannel?.id]);

  async function loadChannelDetails(chId) {
    try {
      setLoading(true);
      const res = await api.getChannel(chId);
      setChannelData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Active live values for this channel
  const liveFeed = latestTelemetry[activeChannel?.id] || channelData?.currentValues || {};

  const publicUrl = activeChannel?.public_slug
    ? `${window.location.origin}/dashboard/public/${activeChannel.public_slug}`
    : `${window.location.origin}/dashboard/public/${activeChannel?.id}`;

  function handleCopyShareLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner: Channel Header & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                CH-{activeChannel?.channel_number || "01"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeChannel?.name || "Select a Channel"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Project: <span className="text-slate-200 font-semibold">{activeProject?.name || "Smart Agriculture"}</span> • {activeChannel?.description || "Real-time Telemetry & Actuator Stream"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowAddWidget(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Widget</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Share Dashboard</span>
          </button>

          <button
            onClick={() => loadChannelDetails(activeChannel?.id)}
            title="Refresh"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 1. Dynamic Sensor Fields Grid (Items 5 & 8) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Sensor Fields Telemetry
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Last Packet: {liveFeed._timestamp ? new Date(liveFeed._timestamp).toLocaleTimeString() : "Receiving..."}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channelData?.fields?.map((f) => (
            <MetricCard
              key={f.field_key}
              field={f}
              value={liveFeed[f.field_key]}
              unit={f.unit}
              color={f.color}
              min={f.min_value}
              max={f.max_value}
            />
          ))}
        </div>
      </div>

      {/* 2. Actuator Switches & Relays (Item 17: Device Control) */}
      {channelData?.actuators?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Hardware Actuator Controls (Relays, Pumps, Fans)
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono font-semibold">
              ⚡ Instant Sync Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {channelData.actuators.map((act) => (
              <ActuatorWidget key={act.id} actuator={act} />
            ))}
          </div>
        </div>
      )}

      {/* 3. Custom Configured Widgets Grid */}
      {channelData?.widgets?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {channelData.widgets.map((w) => {
            const widthClass = w.grid_w === 12 ? "lg:col-span-12" : w.grid_w === 8 ? "lg:col-span-8" : w.grid_w === 4 ? "lg:col-span-4" : "lg:col-span-6";

            if (w.widget_type === "gauge") {
              const matchedField = channelData.fields.find(f => f.field_key === w.field_key);
              return (
                <div key={w.id} className={widthClass}>
                  <GaugeWidget
                    title={w.title}
                    value={liveFeed[w.field_key]}
                    unit={matchedField?.unit || ""}
                    min={matchedField?.min_value || 0}
                    max={matchedField?.max_value || 100}
                    color={matchedField?.color || "#10B981"}
                  />
                </div>
              );
            }

            if (w.widget_type === "chart") {
              return (
                <div key={w.id} className={widthClass}>
                  <ChartWidget
                    title={w.title}
                    channelId={activeChannel?.id}
                    fields={channelData.fields}
                    chartType={w.chart_type || "line"}
                  />
                </div>
              );
            }

            if (w.widget_type === "map") {
              return (
                <div key={w.id} className={widthClass}>
                  <MapWidget devices={channelData.devices} />
                </div>
              );
            }

            if (w.widget_type === "table") {
              return (
                <div key={w.id} className={widthClass}>
                  <TableWidget channelId={activeChannel?.id} fields={channelData.fields} />
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* 4. Default Charts & Map if no custom widgets */}
      {(!channelData?.widgets || channelData.widgets.length === 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <ChartWidget
              title="Telemetry Multi-Axis History"
              channelId={activeChannel?.id}
              fields={channelData?.fields || []}
              chartType="line"
            />
          </div>
          <div className="lg:col-span-4">
            <MapWidget devices={channelData?.devices || []} />
          </div>
          <div className="lg:col-span-12">
            <TableWidget channelId={activeChannel?.id} fields={channelData?.fields || []} />
          </div>
        </div>
      )}

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        channelId={activeChannel?.id}
        fields={channelData?.fields || []}
        onWidgetAdded={() => loadChannelDetails(activeChannel?.id)}
      />

      {/* Share Dashboard Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              Shareable Public Dashboard
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Anyone with this URL can view real-time telemetry from channel {activeChannel?.name}.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between font-mono text-xs text-slate-300 break-all">
              <span className="truncate mr-2">{publicUrl}</span>
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-sans font-semibold shrink-0"
              >
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <span>Visibility: <strong className="text-emerald-400">Public Link Enabled</strong></span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                Open View <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
