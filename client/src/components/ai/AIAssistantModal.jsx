import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { useProject } from "../../context/ProjectContext";
import {
  Bot,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Cpu,
  Activity,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

export function AIAssistantModal({ isOpen, onClose }) {
  const { activeChannel, activeProject } = useProject();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'anomalies', 'forecast', 'summary'
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hello! I am your **AgroNexus AI Assistant**.\nI am connected directly to your live PostgreSQL telemetry streams, device fleet, and automation rules. How can I assist your farm today?",
      cards: null,
      actionProposal: null
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [executingActionToken, setExecutingActionToken] = useState(null);
  const [actionSuccess, setActionSuccess] = useState({});

  // Anomalies, Forecast & Daily Summary State
  const [anomalies, setAnomalies] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeChannel?.id) {
      loadAnomalies();
      loadForecast();
      loadDailySummary();
    }
  }, [isOpen, activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadAnomalies() {
    try {
      setLoadingAI(true);
      const res = await api.getAnomalies(activeChannel.id);
      setAnomalies(res.anomalies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  }

  async function loadForecast() {
    try {
      const res = await api.getForecast(activeChannel.id);
      setForecast(res.forecast || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadDailySummary() {
    try {
      const res = await api.getAIDailySummary(activeProject?.id);
      setDailySummary(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendQuery(promptText) {
    const textToSend = promptText || query;
    if (!textToSend.trim()) return;

    const userMsg = { role: "user", text: textToSend };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuery("");
    setLoading(true);

    try {
      // Build conversation history for context memory
      const historyPayload = nextMessages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await api.askAIAssistant(textToSend, activeChannel?.id, historyPayload);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.answer,
          cards: res.cards || null,
          actionProposal: res.actionProposal || null,
          provider: res.provider
        }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Unable to communicate with the IoT AI telemetry intelligence engine. Please ensure the backend server is active.",
          cards: null,
          actionProposal: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmAction(proposal) {
    if (!proposal?.confirmation_token) return;
    setExecutingActionToken(proposal.confirmation_token);

    try {
      const res = await api.executeAIAction({
        confirmationToken: proposal.confirmation_token,
        actionType: proposal.action_type
      });

      setActionSuccess((prev) => ({
        ...prev,
        [proposal.confirmation_token]: res.message || "Action confirmed and executed successfully."
      }));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `✅ **Action Confirmed & Executed**:\n${res.message || "Action executed successfully."}\n\n*An audit log entry has been recorded in your system activity history.*`,
          cards: null,
          actionProposal: null
        }
      ]);
    } catch (err) {
      alert("Failed to execute action: " + (err.message || err));
    } finally {
      setExecutingActionToken(null);
    }
  }

  function handleCancelAction(token) {
    setActionSuccess((prev) => ({
      ...prev,
      [token]: "Action cancelled by user."
    }));
  }

  function handleAnalyzeDashboard() {
    handleSendQuery(`Analyze my active dashboard for channel "${activeChannel?.name || 'Primary'}" with current telemetry, device health, and active alerts.`);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[720px] overflow-hidden transition-colors">
        
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  AgroNexus AI Copilot
                </h3>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                  Live IoT Sync
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Channel: <strong className="text-slate-700 dark:text-slate-200">{activeChannel?.name || "Primary Channel"}</strong>
                {activeChannel?.id && <span className="ml-1 text-slate-400 font-mono">({activeChannel.id.slice(0, 8)}...)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Quick Analyze Dashboard Button */}
            <button
              onClick={handleAnalyzeDashboard}
              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="Inspect current channel feeds and widgets"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analyze Dashboard
            </button>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700/60 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "chat" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "summary" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Daily Summary
              </button>
              <button
                onClick={() => setActiveTab("anomalies")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "anomalies" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Anomalies
              </button>
              <button
                onClick={() => setActiveTab("forecast")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === "forecast" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Forecast
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: AI Chat Assistant with Visual Cards */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[82%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                        : "bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none font-sans"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Visual Card: Live Sensor Readings */}
                    {m.cards?.sensorCard && m.cards.sensorCard.readings?.length > 0 && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Activity className="w-3.5 h-3.5" />
                            Live Telemetry Feed
                          </span>
                          <span className="font-mono text-[10px]">
                            {new Date(m.cards.sensorCard.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {m.cards.sensorCard.readings.map((r, rIdx) => (
                            <div key={rIdx} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                              <div className="text-[10px] text-slate-400 truncate">{r.name}</div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                {r.value} <span className="text-[10px] font-normal text-slate-500">{r.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Card: Trend & Statistics */}
                    {m.cards?.trendCard && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            {m.cards.trendCard.trend === "increasing" ? <TrendingUp className="w-4 h-4 text-rose-500" /> : <TrendingDown className="w-4 h-4 text-emerald-500" />}
                            {m.cards.trendCard.sensor} Trend Analysis
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.cards.trendCard.trend === "increasing" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                          }`}>
                            {m.cards.trendCard.percentage_change}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400">AVG</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-white">{m.cards.trendCard.average}</div>
                          </div>
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400">MEDIAN</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-white">{m.cards.trendCard.median}</div>
                          </div>
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400">MIN</div>
                            <div className="text-xs font-bold text-emerald-600">{m.cards.trendCard.minimum}</div>
                          </div>
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400">MAX</div>
                            <div className="text-xs font-bold text-rose-600">{m.cards.trendCard.maximum}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual Card: Device Status */}
                    {m.cards?.deviceCard && Array.isArray(m.cards.deviceCard) && (
                      <div className="mt-3 space-y-2">
                        {m.cards.deviceCard.map((d, dIdx) => (
                          <div key={dIdx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${d.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{d.code} • {d.channel}</div>
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-mono text-slate-500">
                              <div>Battery: <strong className="text-slate-700 dark:text-slate-300">{d.battery}</strong></div>
                              <div>Wi-Fi: <strong className="text-slate-700 dark:text-slate-300">{d.wifi}</strong></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Visual Card: Level 4 Action Confirmation Card */}
                    {m.actionProposal && (
                      <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/50 rounded-2xl space-y-2.5 text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Hardware Action Verification Required</span>
                        </div>
                        
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs font-mono">
                          {m.actionProposal.summary}
                        </div>

                        {actionSuccess[m.actionProposal.confirmation_token] ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4" />
                            {actionSuccess[m.actionProposal.confirmation_token]}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleConfirmAction(m.actionProposal)}
                              disabled={executingActionToken === m.actionProposal.confirmation_token}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {executingActionToken === m.actionProposal.confirmation_token ? "Executing..." : "Confirm & Execute"}
                            </button>
                            <button
                              onClick={() => handleCancelAction(m.actionProposal.confirmation_token)}
                              disabled={executingActionToken === m.actionProposal.confirmation_token}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Querying Real Telemetry Intelligence...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
              <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">Quick:</span>
              <button
                onClick={() => handleSendQuery("What is my soil moisture now?")}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              >
                💧 Soil Moisture Now
              </button>
              <button
                onClick={() => handleSendQuery("Show temperature trend for the last 7 days")}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              >
                📈 7-Day Temp Trend
              </button>
              <button
                onClick={() => handleSendQuery("Find abnormal readings")}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              >
                🔍 Find Anomalies
              </button>
              <button
                onClick={() => handleSendQuery("Is my device online and what is its battery health?")}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              >
                ⚡ Check Devices
              </button>
              <button
                onClick={() => handleSendQuery("Give me today's daily summary")}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              >
                ☀️ Daily Summary
              </button>
              <button
                onClick={() => handleSendQuery("Turn on irrigation when soil moisture goes below 30%")}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              >
                🤖 Create Automation
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about live readings, 7-day trends, device health, or propose automations..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Proactive Daily Summary Tab */}
        {activeTab === "summary" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Farm Daily Intelligence Summary
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{dailySummary?.date || "Today's Briefing"}</p>
              </div>
              <button
                onClick={loadDailySummary}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Refresh Summary"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {dailySummary && (
              <div className="space-y-3">
                {/* Metric Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-[10px] text-slate-400 font-medium">DEVICES FLEET</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {dailySummary.devices_online} <span className="text-xs font-normal text-slate-400">/ {dailySummary.total_devices}</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">{dailySummary.devices_online} online</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-[10px] text-slate-400 font-medium">AVG TEMPERATURE</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {dailySummary.temperature_avg}
                    </div>
                    <div className="text-[10px] text-indigo-600 mt-0.5">{dailySummary.temperature_change} trend</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-[10px] text-slate-400 font-medium">AVG SOIL MOISTURE</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {dailySummary.soil_moisture_avg}
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">{dailySummary.soil_moisture_trend}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-[10px] text-slate-400 font-medium">ACTIVE ALERTS</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {dailySummary.total_alerts_count}
                    </div>
                    <div className="text-[10px] text-rose-600 mt-0.5">{dailySummary.critical_alerts_count} critical</div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Actionable Agronomic Recommendations
                  </div>
                  {dailySummary.recommendations?.length > 0 ? (
                    <div className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                      {dailySummary.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      All soil moisture levels and environmental factors are currently in the target cultivation envelope.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Anomaly Detection Scanner */}
        {activeTab === "anomalies" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Statistical Outlier & Out-of-Bounds Detection
              </h4>
              <button onClick={loadAnomalies} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                Refresh Scanner
              </button>
            </div>

            {anomalies.length === 0 && !loadingAI && (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Telemetry Envelopes Normal</div>
                All sensor channels within normal ±2.2σ standard deviation baselines.
              </div>
            )}

            {anomalies.map((a, i) => (
              <div key={i} className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{a.field} Spike Detected</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">Z-Score: {a.zScore}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white dark:bg-slate-950 p-2 rounded border border-rose-100 dark:border-transparent">
                    Current: <strong className="text-rose-600 dark:text-rose-400">{a.currentValue}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2 rounded border border-rose-100 dark:border-transparent">
                    Normal Envelope: <strong className="text-emerald-600 dark:text-emerald-400">{a.normalRange}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Predictive Forecasting */}
        {activeTab === "forecast" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AI Time-Series Telemetry Forecast (Next 6 Hours)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {forecast.map((f, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{f.time}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{f.confidence}% Conf.</span>
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white">{f.predicted_temp}°C</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Humidity: {f.predicted_humidity}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
