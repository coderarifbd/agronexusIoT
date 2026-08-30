import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useProject } from "../../context/ProjectContext";
import {
  Bot,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Cpu,
  RefreshCw,
  Clock
} from "lucide-react";

export function AIAssistantModal({ isOpen, onClose }) {
  const { activeChannel } = useProject();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'anomalies', 'forecast'
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hello! I am your **AgroNexus AI Assistant**.\nI analyze live telemetry streams, explain actuator trigger events, and forecast trends. How can I assist your farm today?"
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Anomalies & Forecast State
  const [anomalies, setAnomalies] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (isOpen && activeChannel?.id) {
      loadAnomalies();
      loadForecast();
    }
  }, [isOpen, activeChannel?.id]);

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

  async function handleSendQuery(promptText) {
    const textToSend = promptText || query;
    if (!textToSend.trim()) return;

    const userMsg = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await api.askAIAssistant(textToSend, activeChannel?.id);
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error querying AI telemetry engine. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[640px] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                AgroNexus AI Copilot
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                  Bangla & English Supported
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Channel: <span className="text-emerald-400 font-semibold">{activeChannel?.name || "Global Stream"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "chat" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("anomalies")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "anomalies" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Anomalies
              </button>
              <button
                onClick={() => setActiveTab("forecast")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "forecast" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Forecast
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Chat Assistant */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-emerald-600 text-white font-medium rounded-tr-none"
                        : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none font-sans"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-indigo-400 font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Querying Telemetry Intelligence...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-semibold shrink-0">Try:</span>
              <button
                onClick={() => handleSendQuery("গত ৭ দিনে temperature কখন সবচেয়ে বেশি ছিল?")}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0"
              >
                🌡️ গত ৭ দিনে সর্বোচ্চ তাপমাত্রা?
              </button>
              <button
                onClick={() => handleSendQuery("Why did the pump turn on?")}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0"
              >
                ⚡ Why did the pump turn on?
              </button>
              <button
                onClick={() => handleSendQuery("Show me device health & battery")}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0"
              >
                🔋 Device Health Status
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your IoT farm in English or Bangla..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Anomaly Detection (Item 31) */}
        {activeTab === "anomalies" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Statistical Outlier & Out-of-Bounds Detection
              </h4>
              <button onClick={loadAnomalies} className="text-xs text-indigo-400 hover:underline">
                Refresh Scanner
              </button>
            </div>

            {anomalies.length === 0 && !loadingAI && (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">Telemetry Envelopes Normal</div>
                All sensor channels within normal ±2.2σ standard deviation baselines.
              </div>
            )}

            {anomalies.map((a, i) => (
              <div key={i} className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-bold text-white uppercase">{a.field} Spike Detected</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">Z-Score: {a.zScore}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded">
                    Current: <strong className="text-rose-400">{a.currentValue}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded">
                    Normal Envelope: <strong className="text-emerald-400">{a.normalRange}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Predictive Forecasting (Item 33) */}
        {activeTab === "forecast" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              AI Time-Series Telemetry Forecast (Next 6 Hours)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {forecast.map((f, i) => (
                <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-indigo-400">{f.time}</span>
                    <span className="text-[10px] text-emerald-400">{f.confidence}% Conf.</span>
                  </div>
                  <div className="text-base font-black text-white">{f.predicted_temp}°C</div>
                  <div className="text-[11px] text-slate-400">Humidity: {f.predicted_humidity}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
