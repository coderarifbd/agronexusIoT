import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { SingleFieldChart } from "./SingleFieldChart";
import { AddWidgetModal } from "../dashboard/AddWidgetModal";
import { ThingSpeakWidgetRenderer } from "../widgets/ThingSpeakWidgetRenderer";
import {
  Plus,
  Share2,
  Download,
  Key,
  Settings,
  Globe,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  Check,
  Trash2,
  X,
  Activity,
  Upload,
  AlertCircle
} from "lucide-react";

export function ChannelDetailView({ channelId, onBack }) {
  const { user } = useAuth();
  const { activeChannel, selectChannel, loadProjects } = useProject();

  const [channelData, setChannelData] = useState(null);
  const [activeTab, setActiveTab] = useState("private"); // 'private', 'public', 'settings', 'sharing', 'apikeys', 'export'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ created: "less than a minute ago", entries: 0 });

  // Modals
  const [showAddVisualizationModal, setShowAddVisualizationModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [showMatlabModal, setShowMatlabModal] = useState(null); // 'analysis' | 'visualization'
  const [copiedKey, setCopiedKey] = useState("");

  // Settings State
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Sharing State
  const [sharingMode, setSharingMode] = useState("private"); // 'private', 'everyone', 'users'
  const [shareEmail, setShareEmail] = useState("");
  const [channelShares, setChannelShares] = useState([]);
  const [shareMsg, setShareMsg] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  // API Keys State
  const [writeApiKey, setWriteApiKey] = useState("");
  const [readKeysList, setReadKeysList] = useState([]);
  const [keyActionMsg, setKeyActionMsg] = useState("");
  const [keyLoading, setKeyLoading] = useState(false);

  // Import / Export State
  const [importFile, setImportFile] = useState(null);
  const [importTimezone, setImportTimezone] = useState("(GMT+00:00) UTC");
  const [exportTimezone, setExportTimezone] = useState("(GMT+00:00) UTC");
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importError, setImportError] = useState("");

  const targetId = channelId || activeChannel?.id;

  useEffect(() => {
    if (targetId) {
      loadChannel(targetId);
    } else {
      api.getMyChannels()
        .then((res) => {
          if (res.channels && res.channels.length > 0) {
            loadChannel(res.channels[0].id);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [targetId]);

  async function loadChannel(id) {
    try {
      setLoading(true);
      const res = await api.getChannel(id);
      setChannelData(res);
      setEditName(res.channel?.name || "");
      setEditDesc(res.channel?.description || "");
      setEditIsPublic(Boolean(res.channel?.is_public));

      setWriteApiKey(res.channel?.api_write_key || "");
      setReadKeysList(res.readKeys || [{ id: "default", api_key: res.channel?.api_read_key, note: "" }]);

      // Sharing Mode
      const mode = res.channel?.sharing_mode || (res.channel?.is_public ? "everyone" : "private");
      setSharingMode(mode);
      setChannelShares(res.shares || []);

      // Calculate stats
      const telemetryRes = await api.getTelemetry(id, "24h").catch(() => ({ data: [] }));
      const entryCount = telemetryRes.data?.length || 0;

      const createdDate = res.channel?.created_at ? new Date(res.channel.created_at) : new Date();
      const diffMins = Math.round((Date.now() - createdDate.getTime()) / 60000);
      const createdStr = diffMins < 1 ? "less than a minute ago" : `${diffMins} minutes ago`;

      setStats({
        created: createdStr,
        entries: entryCount
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // API Key Handlers
  async function handleGenerateNewWriteKey() {
    if (!channelData?.channel?.id) return;
    if (!window.confirm("Generating a new Write API Key will invalidate the previous key. Continue?")) return;
    try {
      setKeyLoading(true);
      const res = await api.regenerateWriteKey(channelData.channel.id);
      setWriteApiKey(res.api_write_key);
      setKeyActionMsg("New Write API Key generated successfully.");
      setTimeout(() => setKeyActionMsg(""), 3500);
      loadProjects();
    } catch (e) {
      setKeyActionMsg(e.message || "Failed to generate Write API Key");
    } finally {
      setKeyLoading(false);
    }
  }

  async function handleAddNewReadKey() {
    if (!channelData?.channel?.id) return;
    try {
      setKeyLoading(true);
      const res = await api.addReadKey(channelData.channel.id, { note: "" });
      setReadKeysList(res.readKeys || []);
      setKeyActionMsg("New Read API Key created.");
      setTimeout(() => setKeyActionMsg(""), 3500);
    } catch (e) {
      setKeyActionMsg(e.message || "Failed to add Read Key");
    } finally {
      setKeyLoading(false);
    }
  }

  async function handleSaveReadNote(keyId, noteVal) {
    if (!channelData?.channel?.id) return;
    try {
      const res = await api.updateReadKey(channelData.channel.id, keyId, { note: noteVal });
      setReadKeysList(res.readKeys || []);
      setKeyActionMsg("Note saved successfully.");
      setTimeout(() => setKeyActionMsg(""), 3000);
    } catch (e) {
      setKeyActionMsg(e.message || "Failed to save note");
    }
  }

  async function handleDeleteReadKey(keyId) {
    if (!channelData?.channel?.id) return;
    if (!window.confirm("Are you sure you want to delete this Read API Key?")) return;
    try {
      const res = await api.deleteReadKey(channelData.channel.id, keyId);
      setReadKeysList(res.readKeys || []);
      setKeyActionMsg("Read API Key deleted.");
      setTimeout(() => setKeyActionMsg(""), 3000);
    } catch (e) {
      setKeyActionMsg(e.message || "Failed to delete key");
    }
  }

  function handleReadNoteChange(keyId, newNote) {
    setReadKeysList(prev => prev.map(k => k.id === keyId ? { ...k, note: newNote } : k));
  }

  // Import / Export Handlers
  async function handleUploadCsv(e) {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please select a CSV file to upload.");
      return;
    }
    setImportError("");
    setImportMsg("");
    setImportLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const res = await api.importChannelCsv(channelData.channel.id, {
            csv_data: csvText,
            timezone: importTimezone
          });
          setImportMsg(res.message || "CSV imported successfully!");
          setImportFile(null);
          loadChannel(channelData.channel.id);
        } catch (err) {
          setImportError(err.message || "Failed to import CSV.");
        } finally {
          setImportLoading(false);
        }
      };
      reader.onerror = () => {
        setImportError("Failed to read the selected file.");
        setImportLoading(false);
      };
      reader.readAsText(importFile);
    } catch (err) {
      setImportError(err.message || "Failed to upload file.");
      setImportLoading(false);
    }
  }

  function handleDownloadExportCsv() {
    if (!channelData?.channel?.id) return;
    const url = `/api/telemetry/channel/${channelData.channel.id}/export?format=csv&timezone=${encodeURIComponent(exportTimezone)}`;
    window.open(url, "_blank");
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    if (!channelData?.channel?.id) return;
    try {
      await api.updateChannel(channelData.channel.id, {
        name: editName,
        description: editDesc,
        is_public: editIsPublic
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      loadChannel(channelData.channel.id);
      loadProjects();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSharingModeChange(newMode) {
    setSharingMode(newMode);
    if (!channelData?.channel?.id) return;
    try {
      await api.updateSharingMode(channelData.channel.id, newMode);
      setShareMsg(`Sharing setting updated to: ${newMode === "private" ? "Private" : newMode === "everyone" ? "Public to Everyone" : "Specific Users"}`);
      setTimeout(() => setShareMsg(""), 3000);
      loadProjects();
    } catch (e) {
      setShareMsg(e.message || "Failed to update sharing setting");
    }
  }

  async function handleAddShareUser(e) {
    e.preventDefault();
    if (!shareEmail.trim() || !channelData?.channel?.id) return;
    try {
      setShareLoading(true);
      const res = await api.addChannelShare(channelData.channel.id, {
        email: shareEmail.trim(),
        role: "Viewer"
      });
      setChannelShares(res.shares || []);
      setShareMsg(`Added ${shareEmail.trim()} to this channel.`);
      setShareEmail("");
      setTimeout(() => setShareMsg(""), 3000);
    } catch (e) {
      setShareMsg(e.message || "Failed to add user");
    } finally {
      setShareLoading(false);
    }
  }

  async function handleRemoveShareUser(shareId) {
    if (!channelData?.channel?.id) return;
    try {
      const res = await api.deleteChannelShare(channelData.channel.id, shareId);
      setChannelShares(res.shares || []);
      setShareMsg("User access removed.");
      setTimeout(() => setShareMsg(""), 3000);
    } catch (e) {
      setShareMsg(e.message || "Failed to remove user");
    }
  }

  async function handleAddCustomField() {
    const fieldCount = (channelData?.fields?.length || 0) + 1;
    if (fieldCount > 8) {
      alert("Each AgroNexus channel can have up to 8 fields.");
      return;
    }
    const fieldName = prompt(`Enter label for Field ${fieldCount}:`, `Field Label ${fieldCount}`);
    if (!fieldName) return;

    try {
      await api.addField(channelData.channel.id, {
        field_key: `field${fieldCount}`,
        name: fieldName,
        unit: ""
      });
      loadChannel(channelData.channel.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteField(fieldId) {
    if (!window.confirm("Are you sure you want to delete this field chart?")) return;
    try {
      await api.deleteField(fieldId);
      loadChannel(channelData.channel.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteWidget(widgetId) {
    if (!window.confirm("Are you sure you want to delete this widget?")) return;
    try {
      await api.deleteWidget(widgetId);
      loadChannel(channelData.channel.id);
    } catch (e) {
      console.error(e);
    }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(""), 2500);
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-sm">
        <Activity className="w-8 h-8 animate-spin text-[#137f3a] mx-auto mb-3" />
        Loading Channel Dashboard...
      </div>
    );
  }

  if (!channelData || !channelData.channel) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Channel not found.
      </div>
    );
  }

  const ch = channelData.channel;
  const fields = channelData.fields || [];
  const widgets = channelData.widgets || [];
  const channelIdNum = ch.channel_number ? String(ch.channel_number) : (ch.id?.slice(0, 7) || "3477628");
  const authorName = user?.username || ch.owner_name || "mwa0000040243873";
  const isPrivate = ch.sharing_mode === "everyone" ? false : !ch.is_public;
  const primaryReadKey = readKeysList[0]?.api_key || ch.api_read_key || "GN3GJDOWDYG9FF67";
  const originUrl = window.location.origin;

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4 animate-fadeIn transition-colors text-slate-800 dark:text-slate-200 text-sm">
      {/* 1. Header Information Strip (Clean Compact Row) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-0.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {ch.name || `Channel ${channelIdNum}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-sans">
              <span>Channel ID: <strong className="font-mono text-slate-800 dark:text-slate-200">{channelIdNum}</strong></span>
              <span>•</span>
              <span>Author: <strong className="text-[#137f3a] dark:text-emerald-400 font-semibold">{authorName}</strong></span>
              <span>•</span>
              <span>Access: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{isPrivate ? "Private" : "Public"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Channel Sub-Navigation Tabs Bar (Compact Touch Scroll) */}
      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 -mb-px text-xs sm:text-sm font-semibold whitespace-nowrap min-w-max pb-0.5">
          {[
            { id: "private", label: "Private View" },
            { id: "public", label: "Public View" },
            { id: "settings", label: "Channel Settings" },
            { id: "sharing", label: "Sharing" },
            { id: "apikeys", label: "API Keys" },
            { id: "export", label: "Data Import / Export" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 sm:py-2 px-3 sm:px-4 shrink-0 rounded-t border transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 border-b-white dark:border-b-slate-900 shadow-sm"
                    : "text-[#137f3a] dark:text-emerald-400 hover:text-[#0f682f] border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Action Buttons Strip & MATLAB Buttons (shown on Private and Public View) */}
      {(activeTab === "private" || activeTab === "public") && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          {/* Left Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleAddCustomField}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#137f3a] dark:text-emerald-400 font-semibold rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Visualizations</span>
            </button>

            <button
              onClick={() => setShowAddWidgetModal(true)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#137f3a] dark:text-emerald-400 font-semibold rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Widgets</span>
            </button>

            <button
              onClick={handleDownloadExportCsv}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#137f3a] dark:text-emerald-400 font-semibold rounded border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Export recent data</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setShowMatlabModal("analysis")}
              className="px-3 py-1.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-bold rounded shadow transition-all cursor-pointer"
            >
              MATLAB Analysis
            </button>

            <button
              onClick={() => setShowMatlabModal("visualization")}
              className="px-3 py-1.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-bold rounded shadow transition-all cursor-pointer"
            >
              MATLAB Visualization
            </button>
          </div>
        </div>
      )}

      {/* 4. Tab 1: Private View (Field Charts Grid & Custom Widgets) */}
      {activeTab === "private" && (
        <div className="space-y-4 pt-1">
          {/* Channel Stats: Compact Inline Bar */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 py-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Channel Stats:</span>
            <span>Created: <strong className="text-slate-800 dark:text-slate-200">{stats.created}</strong></span>
            <span>•</span>
            <span>Entries: <strong className="font-mono text-slate-800 dark:text-slate-200">{stats.entries}</strong></span>
          </div>

          {/* Grid of Individual Field Charts (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f, i) => (
              <SingleFieldChart
                key={f.id || f.field_key || i}
                channel={ch}
                field={f}
                fieldIndex={i}
                onDelete={handleDeleteField}
              />
            ))}
          </div>

          {/* Render Channel Widgets */}
          {widgets.length > 0 && (
            <div className="space-y-2 pt-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Channel Widgets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgets.map((w) => (
                  <ThingSpeakWidgetRenderer
                    key={w.id}
                    widget={w}
                    channel={ch}
                    currentValues={channelData.currentValues}
                    onEdit={(selectedW) => {
                      setEditingWidget(selectedW);
                      setShowAddWidgetModal(true);
                    }}
                    onDelete={handleDeleteWidget}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Slim Sleek Add Visualization Bar */}
          <div
            onClick={handleAddCustomField}
            className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#137f3a] dark:hover:border-emerald-500 rounded-lg py-3 px-4 text-center cursor-pointer transition-colors bg-white/50 dark:bg-slate-900/50"
          >
            <button className="text-[#137f3a] dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>+ Add Field Visualization</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Public View */}
      {activeTab === "public" && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-sm">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-[#137f3a] dark:text-emerald-400" />
              <span className="font-medium text-emerald-800 dark:text-emerald-300">
                Public Stream URL: {originUrl}/dashboard/public/{ch.public_slug || ch.id}
              </span>
            </div>
            <button
              onClick={() => handleCopy(`${originUrl}/dashboard/public/${ch.public_slug || ch.id}`, "publicUrl")}
              className="px-3.5 py-1.5 bg-[#137f3a] text-white rounded text-xs font-bold cursor-pointer"
            >
              {copiedKey === "publicUrl" ? "Copied!" : "Copy Public URL"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f, i) => (
              <SingleFieldChart
                key={f.id || f.field_key || i}
                channel={ch}
                field={f}
                fieldIndex={i}
              />
            ))}
          </div>

          {/* Render Channel Widgets in Public View */}
          {widgets.length > 0 && (
            <div className="space-y-2 pt-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Channel Widgets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgets.map((w) => (
                  <ThingSpeakWidgetRenderer
                    key={w.id}
                    widget={w}
                    channel={ch}
                    currentValues={channelData.currentValues}
                    onEdit={(selectedW) => {
                      setEditingWidget(selectedW);
                      setShowAddWidgetModal(true);
                    }}
                    onDelete={handleDeleteWidget}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: Channel Settings */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-6 sm:p-8 shadow-sm max-w-3xl space-y-5 text-sm">
          <h3 className="text-2xl font-light text-slate-900 dark:text-white">Channel Settings</h3>

          {settingsSaved && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded flex items-center gap-2">
              <Check className="w-5 h-5" /> Settings updated successfully.
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Channel Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="chPublicToggle"
                checked={editIsPublic}
                onChange={(e) => setEditIsPublic(e.target.checked)}
                className="w-4 h-4 rounded text-[#137f3a]"
              />
              <label htmlFor="chPublicToggle" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                Make Channel Public
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-xs mb-2">
                Active Sensor Fields ({fields.length}/8)
              </label>
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white">Field {i + 1}: {f.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(f.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-bold rounded shadow transition-all cursor-pointer"
            >
              Save Settings
            </button>
          </form>
        </div>
      )}

      {/* 7. Tab 4: Channel Sharing Settings */}
      {activeTab === "sharing" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-6 sm:p-8 shadow-sm max-w-3xl space-y-6 text-sm">
          <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
            Channel Sharing Settings
          </h2>

          {shareMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded flex items-center gap-2 text-sm">
              <Check className="w-5 h-5" /> {shareMsg}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-3 cursor-pointer text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="sharingMode"
                value="private"
                checked={sharingMode === "private"}
                onChange={() => handleSharingModeChange("private")}
                className="w-4 h-4 text-[#0066cc] dark:text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <span>Keep channel view private</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="sharingMode"
                value="everyone"
                checked={sharingMode === "everyone"}
                onChange={() => handleSharingModeChange("everyone")}
                className="w-4 h-4 text-[#0066cc] dark:text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <span>Share channel view with everyone</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="sharingMode"
                value="users"
                checked={sharingMode === "users"}
                onChange={() => handleSharingModeChange("users")}
                className="w-4 h-4 text-[#0066cc] dark:text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <span>Share channel view only with the following users:</span>
            </label>
          </div>

          <div className="pt-4 space-y-4">
            <form onSubmit={handleAddShareUser} className="flex flex-wrap items-center gap-3">
              <label className="text-slate-400 dark:text-slate-500 text-sm font-normal min-w-[110px]">
                Email Address
              </label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email here"
                className="w-64 sm:w-80 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0066cc]"
                required
              />
              <button
                type="submit"
                disabled={shareLoading}
                className="px-5 py-2 bg-[#4a90e2] hover:bg-[#357abd] text-white font-medium text-sm rounded shadow transition-all cursor-pointer"
              >
                {shareLoading ? "Adding..." : "Add User"}
              </button>
            </form>

            <div className="pt-2">
              <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                Users with Access to Channel {channelIdNum} ({channelShares.length})
              </div>

              {channelShares.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-400 text-center text-sm">
                  No specific users added yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {channelShares.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{s.user_email}</span>
                        <span className="text-xs px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-medium">
                          {s.role || "Viewer"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveShareUser(s.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                        title="Remove Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 5: API Keys (Matches media_1788285666909.png) */}
      {activeTab === "apikeys" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Key Controls (col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            {keyActionMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded flex items-center gap-2 text-sm">
                <Check className="w-5 h-5" /> {keyActionMsg}
              </div>
            )}

            {/* Write API Key */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                Write API Key
              </h2>

              <div className="grid grid-cols-12 gap-3 items-center text-sm">
                <label className="col-span-2 text-right font-medium text-slate-700 dark:text-slate-300">
                  Key
                </label>
                <div className="col-span-10">
                  <input
                    type="text"
                    readOnly
                    value={writeApiKey}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 font-mono text-sm text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-2"></div>
                <div className="col-span-10">
                  <button
                    type="button"
                    onClick={handleGenerateNewWriteKey}
                    disabled={keyLoading}
                    className="px-5 py-2.5 bg-[#f0ad4e] hover:bg-[#ec971f] text-white font-medium text-sm rounded shadow transition-all cursor-pointer"
                  >
                    Generate New Write API Key
                  </button>
                </div>
              </div>
            </div>

            {/* Read API Keys */}
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                Read API Keys
              </h2>

              {readKeysList.map((rk, idx) => (
                <div key={rk.id || idx} className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-12 gap-3 items-center text-sm">
                    <label className="col-span-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      Key
                    </label>
                    <div className="col-span-10">
                      <input
                        type="text"
                        readOnly
                        value={rk.api_key}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 font-mono text-sm text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-start text-sm">
                    <label className="col-span-2 text-right font-medium text-slate-700 dark:text-slate-300 pt-1.5">
                      Note
                    </label>
                    <div className="col-span-10 space-y-2.5">
                      <textarea
                        value={rk.note || ""}
                        onChange={(e) => handleReadNoteChange(rk.id, e.target.value)}
                        rows={2}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#137f3a]"
                      />
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveReadNote(rk.id, rk.note)}
                          className="px-4 py-2 bg-[#137f3a] hover:bg-[#0f682f] text-white font-medium text-sm rounded shadow transition-all cursor-pointer"
                        >
                          Save Note
                        </button>
                        {readKeysList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReadKey(rk.id)}
                            className="px-4 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white font-medium text-sm rounded shadow transition-all cursor-pointer"
                          >
                            Delete API Key
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-12 gap-3 pt-2">
                <div className="col-span-2"></div>
                <div className="col-span-10">
                  <button
                    type="button"
                    onClick={handleAddNewReadKey}
                    disabled={keyLoading}
                    className="px-4 py-2.5 bg-[#f0ad4e] hover:bg-[#ec971f] text-white font-medium text-sm rounded shadow transition-all cursor-pointer"
                  >
                    Add New Read API Key
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Help & API Requests (col-span-6) */}
          <div className="lg:col-span-6 space-y-6 pt-1 text-sm">
            {/* Help Section */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                Help
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                API keys enable you to write data to a channel or read data from a private channel. API keys are auto-generated when you create a new channel.
              </p>
            </div>

            {/* API Keys Settings Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-normal text-slate-800 dark:text-slate-200">
                API Keys Settings
              </h3>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">• Write API Key:</strong> Use this key to write data to a channel. If you feel your key has been compromised, click <strong className="text-slate-800 dark:text-slate-200">Generate New Write API Key</strong>.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">• Read API Keys:</strong> Use this key to allow other people to view your private channel feeds and charts. Click <strong className="text-slate-800 dark:text-slate-200">Generate New Read API Key</strong> to generate an additional read key for the channel.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">• Note:</strong> Use this field to enter information about channel read keys. For example, add notes to keep track of users with access to your channel.
                </li>
              </ul>
            </div>

            {/* API Requests Section */}
            <div className="space-y-3.5 pt-2">
              <h3 className="text-lg font-normal text-slate-800 dark:text-slate-200">
                API Requests
              </h3>

              {/* Write a Channel Feed */}
              <div className="space-y-1.5 text-sm">
                <div className="text-[#137f3a] dark:text-emerald-400 font-semibold">Write a Channel Feed</div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-300 dark:border-slate-800 font-mono text-xs overflow-x-auto whitespace-nowrap text-slate-800 dark:text-slate-200 select-all">
                  GET {originUrl}/update?api_key=<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{writeApiKey}</span>&field1=0
                </div>
              </div>

              {/* Read a Channel Feed */}
              <div className="space-y-1.5 text-sm">
                <div className="text-[#137f3a] dark:text-emerald-400 font-semibold">Read a Channel Feed</div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-300 dark:border-slate-800 font-mono text-xs overflow-x-auto whitespace-nowrap text-slate-800 dark:text-slate-200 select-all">
                  GET {originUrl}/channels/<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{channelIdNum}</span>/feeds.json?api_key=<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{primaryReadKey}</span>&results=2
                </div>
              </div>

              {/* Read a Channel Field */}
              <div className="space-y-1.5 text-sm">
                <div className="text-[#137f3a] dark:text-emerald-400 font-semibold">Read a Channel Field</div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-300 dark:border-slate-800 font-mono text-xs overflow-x-auto whitespace-nowrap text-slate-800 dark:text-slate-200 select-all">
                  GET {originUrl}/channels/<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{channelIdNum}</span>/fields/1.json?api_key=<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{primaryReadKey}</span>&results=2
                </div>
              </div>

              {/* Read Channel Status Updates */}
              <div className="space-y-1.5 text-sm">
                <div className="text-[#137f3a] dark:text-emerald-400 font-semibold">Read Channel Status Updates</div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-300 dark:border-slate-800 font-mono text-xs overflow-x-auto whitespace-nowrap text-slate-800 dark:text-slate-200 select-all">
                  GET {originUrl}/channels/<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{channelIdNum}</span>/status.json?api_key=<span className="text-[#137f3a] dark:text-emerald-400 font-bold">{primaryReadKey}</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => alert("See documentation on AgroNexus REST API endpoints")}
                  className="text-sm text-[#137f3a] dark:text-emerald-400 font-semibold hover:underline"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Tab 6: Data Import / Export (Matches media_1788285742918.png) */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Import & Export Controls (col-span-6) */}
          <div className="lg:col-span-6 space-y-8">
            {importMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded flex items-center gap-2 text-sm">
                <Check className="w-5 h-5" /> {importMsg}
              </div>
            )}
            {importError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5" /> {importError}
              </div>
            )}

            {/* Import Section */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                Import
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Upload a CSV file to import data into this channel.
              </p>

              <form onSubmit={handleUploadCsv} className="space-y-4 text-sm">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    File
                  </label>
                  <div className="col-span-9">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-300 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    Time Zone
                  </label>
                  <div className="col-span-9">
                    <input
                      type="text"
                      value={importTimezone}
                      onChange={(e) => setImportTimezone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-[#137f3a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 pt-1">
                  <div className="col-span-3"></div>
                  <div className="col-span-9">
                    <button
                      type="submit"
                      disabled={importLoading}
                      className="px-7 py-2.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-sm rounded shadow transition-all cursor-pointer"
                    >
                      {importLoading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Export Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                Export
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Download all of this Channel's feeds in CSV format.
              </p>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    Time Zone
                  </label>
                  <div className="col-span-9">
                    <input
                      type="text"
                      value={exportTimezone}
                      onChange={(e) => setExportTimezone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3.5 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-[#137f3a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 pt-1">
                  <div className="col-span-3"></div>
                  <div className="col-span-9">
                    <button
                      type="button"
                      onClick={handleDownloadExportCsv}
                      className="px-7 py-2.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-sm rounded shadow transition-all cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Help & Guidance (col-span-6) */}
          <div className="lg:col-span-6 space-y-6 pt-1 text-sm">
            {/* Help Section */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                Help
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The correct format for data import is provided in this <span className="text-[#137f3a] dark:text-emerald-400 font-semibold cursor-pointer">CSV Import Template File</span>. Use the field names <em>field1, field2</em>, and so on, instead of custom field names.
              </p>
            </div>

            {/* CSV Import Format */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-[#137f3a] dark:text-emerald-400">
                CSV Import Format
              </div>
              <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded border border-slate-300 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto select-all leading-relaxed">
                created_at,field1,field3,field4,field8,elevation<br />
                2019-01-01T10:11:12-05:00,11,33,44,88,10
              </div>
            </div>

            {/* Other Import and Export Options */}
            <div className="space-y-2 pt-2">
              <h3 className="text-lg font-normal text-slate-800 dark:text-slate-200">
                Other Import and Export Options
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                You can also use MATLAB, the REST API, or the MQTT API to import and export channel data.
              </p>
              <div className="space-y-1.5 pt-1 text-sm">
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("apikeys")}
                    className="text-[#137f3a] dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Read Data
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("apikeys")}
                    className="text-[#137f3a] dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Write Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Widgets Modal (AgroNexus style) */}
      <AddWidgetModal
        isOpen={showAddWidgetModal}
        onClose={() => {
          setShowAddWidgetModal(false);
          setEditingWidget(null);
        }}
        channelId={ch.id}
        fields={fields}
        editWidget={editingWidget}
        onWidgetAdded={() => {
          loadChannel(ch.id);
          setEditingWidget(null);
        }}
      />

      {/* MATLAB Analysis / Visualization Modal */}
      {showMatlabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#137f3a]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {showMatlabModal === "analysis" ? "MATLAB Analysis" : "MATLAB Visualization"}
                </h3>
              </div>
              <button onClick={() => setShowMatlabModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400">
              Run custom MATLAB IoT analytics or 2D/3D visualizations on your channel telemetry stream.
            </p>

            <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <pre>
{showMatlabModal === "analysis"
  ? `% MATLAB Code to Read Channel & Compute Mean
readChannelID = ${channelIdNum};
readAPIKey = '${primaryReadKey}';
data = thingSpeakRead(readChannelID, 'Fields', [1, 2], 'NumPoints', 50, 'ReadKey', readAPIKey);
avg_temp = mean(data(:,1));
disp(['Average Field 1: ', num2str(avg_temp)]);`
  : `% MATLAB 2D Time-Series Visualization
readChannelID = ${channelIdNum};
readAPIKey = '${primaryReadKey}';
[data, time] = thingSpeakRead(readChannelID, 'Fields', 1, 'NumPoints', 30, 'ReadKey', readAPIKey);
plot(time, data, '-o', 'LineWidth', 2);
title('${ch.name} - MATLAB Telemetry Plot');
xlabel('Timestamp'); ylabel('Field 1 Value'); grid on;`}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMatlabModal(null)}
                className="px-5 py-2.5 bg-slate-800 text-white font-semibold rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
