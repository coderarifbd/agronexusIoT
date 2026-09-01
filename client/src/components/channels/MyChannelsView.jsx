import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { api } from "../../services/api";
import { NewChannelView } from "./NewChannelView";
import { ChannelDetailView } from "./ChannelDetailView";
import {
  Lock,
  Globe,
  Search,
  ArrowUpDown,
  Plus,
  Key,
  Settings,
  Share2,
  Download,
  Copy,
  Check,
  X,
  Code,
  Trash2
} from "lucide-react";

export function MyChannelsView({ onNavigateToDashboard }) {
  const { projects, activeProject, selectProject, selectChannel, loadProjects } = useProject();

  const [viewMode, setViewMode] = useState("list"); // "list", "create", or "detail"
  const [selectedChannelForDetail, setSelectedChannelForDetail] = useState(null);
  const [allChannels, setAllChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals
  const [showApiKeysModal, setShowApiKeysModal] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(null);
  const [showSharingModal, setShowSharingModal] = useState(null);
  const [showExportModal, setShowExportModal] = useState(null);
  const [showExampleModal, setShowExampleModal] = useState(null);

  // Settings Form State
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [channelFields, setChannelFields] = useState([]);

  // Sharing State
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [members, setMembers] = useState([]);
  const [shareMsg, setShareMsg] = useState("");

  // Copied Key Indicator
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    loadAllChannels();
  }, [projects]);

  async function loadAllChannels() {
    try {
      setLoading(true);
      const res = await api.getMyChannels();
      setAllChannels(res.channels || []);
    } catch (e) {
      console.error("Failed to load all channels:", e);
    } finally {
      setLoading(false);
    }
  }

  // Sorting
  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  }

  const filteredChannels = allChannels
    .filter((ch) => {
      const q = searchTerm.toLowerCase();
      return (
        ch.name.toLowerCase().includes(q) ||
        (ch.description && ch.description.toLowerCase().includes(q)) ||
        (ch.api_write_key && ch.api_write_key.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      if (sortField === "created_at" || sortField === "updated_at") {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Action Handlers
  async function handleOpenPrivateView(ch) {
    await selectChannel(ch);
    setSelectedChannelForDetail(ch);
    setViewMode("detail");
  }

  function handleOpenPublicView(ch) {
    const slug = ch.public_slug || ch.id;
    window.open(`/dashboard/public/${slug}`, "_blank");
  }

  async function handleOpenSettings(ch) {
    setShowSettingsModal(ch);
    setEditName(ch.name);
    setEditDesc(ch.description || "");
    setEditIsPublic(Boolean(ch.is_public));
    try {
      const res = await api.getChannel(ch.id);
      setChannelFields(res.fields || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    if (!showSettingsModal) return;
    try {
      await api.updateChannel(showSettingsModal.id, {
        name: editName,
        description: editDesc,
        is_public: editIsPublic
      });
      setShowSettingsModal(null);
      loadAllChannels();
      loadProjects();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteChannel(channelId) {
    if (!window.confirm("Are you sure you want to delete this channel?")) return;
    try {
      await api.deleteChannel(channelId);
      if (showSettingsModal?.id === channelId) {
        setShowSettingsModal(null);
      }
      if (selectedChannelForDetail?.id === channelId) {
        setViewMode("list");
        setSelectedChannelForDetail(null);
      }
      loadAllChannels();
      loadProjects();
    } catch (e) {
      console.error("Failed to delete channel:", e);
    }
  }

  async function handleDeleteField(fieldId) {
    if (!showSettingsModal) return;
    try {
      const res = await api.deleteField(showSettingsModal.id, fieldId);
      setChannelFields(res.fields || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleOpenSharing(ch) {
    setShowSharingModal(ch);
    setShareMsg("");
    try {
      const res = await api.getProject(ch.project_id);
      setMembers(res.members || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!shareEmail.trim() || !showSharingModal) return;
    try {
      const res = await api.addProjectMember(showSharingModal.project_id, {
        email: shareEmail.trim(),
        role: shareRole
      });
      setMembers(res.members || []);
      setShareMsg(`Added ${shareEmail.trim()} as ${shareRole}`);
      setShareEmail("");
      setTimeout(() => setShareMsg(""), 3000);
    } catch (e) {
      setShareMsg(e.message || "Failed to add member");
    }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(""), 2500);
  }

  const exampleCodes = {
    arduino: {
      title: "Arduino UNO / Mega (Ethernet/WiFi)",
      desc: "Connect Arduino with W5500 or WiFi Shield to send telemetry data to AgroNexus channel.",
      code: `// AgroNexus IoT / ThingSpeak Ingest for Arduino
#include <SPI.h>
#include <Ethernet.h>

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
char server[] = "localhost"; // or your server IP
EthernetClient client;

void setup() {
  Serial.begin(9600);
  Ethernet.begin(mac);
  delay(1000);
}

void loop() {
  float temp = 26.5; // Read sensor
  float humidity = 60.0;

  if (client.connect(server, 5050)) {
    String postData = "{\\"api_key\\":\\"YOUR_API_KEY\\",\\"field1\\":" + String(temp) + ",\\"field2\\":" + String(humidity) + "}";
    client.println("POST /api/data HTTP/1.1");
    client.println("Host: localhost:5050");
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(postData.length());
    client.println();
    client.println(postData);
  }
  client.stop();
  delay(15000);
}`
    },
    mkr1000: {
      title: "Arduino MKR1000 WiFi",
      desc: "Native SSL/TLS communication with built-in WiFi101 library for battery-powered smart sensors.",
      code: `// Arduino MKR1000 WiFi Channel Logger
#include <WiFi101.h>

char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASS";
WiFiClient client;

void setup() {
  Serial.begin(9600);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  if (client.connect("localhost", 5050)) {
    String json = "{\\"api_key\\":\\"YOUR_WRITE_KEY\\",\\"field1\\":27.8,\\"field2\\":65.2}";
    client.println("POST /api/data HTTP/1.1");
    client.println("Host: localhost:5050");
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(json.length());
    client.println();
    client.print(json);
  }
  delay(20000);
}`
    },
    esp8266: {
      title: "ESP8266 (NodeMCU / Wemos D1)",
      desc: "Ultra low-cost WiFi microcontroller with direct REST API telemetry posting.",
      code: `// ESP8266 NodeMCU AgroNexus Telemetry
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, "http://YOUR_SERVER_IP:5050/api/data");
    http.addHeader("Content-Type", "application/json");

    String payload = "{\\"api_key\\":\\"YOUR_WRITE_KEY\\",\\"field1\\":29.4,\\"field2\\":71.0}";
    int httpCode = http.POST(payload);
    http.end();
  }
  delay(15000);
}`
    },
    raspberrypi: {
      title: "Raspberry Pi (Python 3)",
      desc: "Full Linux IoT gateway posting telemetry using Python requests library.",
      code: `# Raspberry Pi Python Telemetry Publisher
import time
import requests

API_URL = "http://localhost:5050/api/data"
WRITE_API_KEY = "YOUR_WRITE_KEY"

def send_telemetry():
    payload = {
        "api_key": WRITE_API_KEY,
        "temperature": 25.4,
        "humidity": 58.2,
        "battery": 98.0
    }
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        print("Telemetry posted:", response.status_code)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    while True:
        send_telemetry()
        time.sleep(15)`
    }
  };

  // If in create mode, render NewChannelView
  if (viewMode === "create") {
    return (
      <NewChannelView
        onBack={() => setViewMode("list")}
        onChannelCreated={(createdChannel) => {
          setSelectedChannelForDetail(createdChannel);
          setViewMode("detail");
          loadAllChannels();
        }}
      />
    );
  }

  // If in detail mode, render ChannelDetailView
  if (viewMode === "detail" && selectedChannelForDetail) {
    return (
      <ChannelDetailView
        channelId={selectedChannelForDetail.id}
      />
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-7 animate-fadeIn transition-colors text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: My Channels Table & Control (col-span-8 or 9) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white tracking-tight">
              My Channels
            </h1>
          </div>

          {/* Action Bar: New Channel Button + Search Input */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setViewMode("create")}
              className="px-6 py-2.5 bg-[#137f3a] hover:bg-[#0f682f] text-white text-sm font-semibold rounded-md shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>New Channel</span>
            </button>

            {/* Search Box */}
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by tag or name"
                  className="w-64 sm:w-80 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-l-md px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#137f3a]"
                />
              </div>
              <button
                type="button"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-md text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Channels Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                    <th
                      onClick={() => toggleSort("name")}
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-900 w-[60%]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Name</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("created_at")}
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-900 w-[20%]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Created</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("updated_at")}
                      className="px-4 py-3.5 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-900 w-[20%]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Updated</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {loading && (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400 font-mono text-sm">
                        Loading channels...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredChannels.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-500 text-sm">
                        No channels found. Click{" "}
                        <button
                          onClick={() => setViewMode("create")}
                          className="text-[#137f3a] font-bold hover:underline inline cursor-pointer"
                        >
                          New Channel
                        </button>{" "}
                        to create your first IoT stream!
                      </td>
                    </tr>
                  )}

                  {filteredChannels.map((ch) => {
                    const isPrivate = !ch.is_public;
                    const createdStr = ch.created_at
                      ? new Date(ch.created_at).toISOString().replace("T", " ").substring(0, 16)
                      : "2026-08-31 16:00";
                    const updatedStr = ch.updated_at
                      ? new Date(ch.updated_at).toISOString().replace("T", " ").substring(0, 16)
                      : createdStr;

                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Channel Name & Action Buttons */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              {isPrivate ? (
                                <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                              ) : (
                                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                              <span
                                onClick={() => handleOpenPrivateView(ch)}
                                className="font-semibold text-slate-900 dark:text-white text-base hover:text-[#137f3a] dark:hover:text-emerald-400 cursor-pointer"
                              >
                                {ch.name}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteChannel(ch.id)}
                              title="Delete Channel"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Action Sub-Navigation Pill Bar */}
                          <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden text-xs shadow-sm">
                            <button
                              onClick={() => handleOpenPrivateView(ch)}
                              className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              Private
                            </button>
                            <button
                              onClick={() => handleOpenPublicView(ch)}
                              className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              Public
                            </button>
                            <button
                              onClick={() => handleOpenSettings(ch)}
                              className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              Settings
                            </button>
                            <button
                              onClick={() => handleOpenSharing(ch)}
                              className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              Sharing
                            </button>
                            <button
                              onClick={() => setShowApiKeysModal(ch)}
                              className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              API Keys
                            </button>
                            <button
                              onClick={() => setShowExportModal(ch)}
                              className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              Data Import / Export
                            </button>
                            <button
                              onClick={() => handleDeleteChannel(ch.id)}
                              className="px-3.5 py-1.5 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-4 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap align-top pt-5">
                          {createdStr}
                        </td>

                        {/* Updated Date */}
                        <td className="px-4 py-4 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap align-top pt-5">
                          {updatedStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Help & Examples (col-span-4) */}
        <div className="lg:col-span-4 space-y-6 pt-1 text-sm">
          {/* Help Section */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
              Help
            </h2>

            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>
                Collect data in an AgroNexus channel from a device, from another channel, or from the web.
              </p>
              <p>
                Click{" "}
                <button
                  onClick={() => setViewMode("create")}
                  className="font-bold text-slate-900 dark:text-white hover:text-[#137f3a] dark:hover:text-emerald-400 cursor-pointer"
                >
                  New Channel
                </button>{" "}
                to create a new AgroNexus channel.
              </p>
              <p>
                Click on the column headers of the table to sort by the entries in that column or click on a tag to show channels with that tag.
              </p>
              <p>
                Learn to{" "}
                <button
                  onClick={() => setViewMode("create")}
                  className="text-[#137f3a] dark:text-emerald-400 font-semibold hover:underline inline cursor-pointer"
                >
                  create channels
                </button>
                , explore and transform data.
              </p>
              <p>
                Learn more about{" "}
                <button
                  onClick={() => setShowExampleModal("arduino")}
                  className="text-[#137f3a] dark:text-emerald-400 font-semibold hover:underline inline cursor-pointer"
                >
                  AgroNexus Channels
                </button>
                .
              </p>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-3 pt-2">
            <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight">
              Examples
            </h2>

            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => setShowExampleModal("arduino")}
                  className="text-[#137f3a] dark:text-emerald-400 hover:underline flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-slate-400">•</span> Arduino
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowExampleModal("mkr1000")}
                  className="text-[#137f3a] dark:text-emerald-400 hover:underline flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-slate-400">•</span> Arduino MKR1000
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowExampleModal("esp8266")}
                  className="text-[#137f3a] dark:text-emerald-400 hover:underline flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-slate-400">•</span> ESP8266
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowExampleModal("raspberrypi")}
                  className="text-[#137f3a] dark:text-emerald-400 hover:underline flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-slate-400">•</span> Raspberry Pi
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Modal: API Keys */}
      {showApiKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#137f3a] dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  API Keys — {showApiKeysModal.name}
                </h3>
              </div>
              <button onClick={() => setShowApiKeysModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Write API Key */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <label className="block text-slate-500 font-bold uppercase text-xs mb-1">
                  Write API Key (Use to POST Telemetry Data)
                </label>
                <div className="flex items-center justify-between font-mono text-sm font-bold text-[#137f3a] dark:text-emerald-400 break-all">
                  <span>{showApiKeysModal.api_write_key}</span>
                  <button
                    onClick={() => handleCopy(showApiKeysModal.api_write_key, "writeKey")}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {copiedKey === "writeKey" ? <Check className="w-4 h-4 text-[#137f3a]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Read API Key */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                <label className="block text-slate-500 font-bold uppercase text-xs mb-1">
                  Read API Key (Use to GET Sensor Feeds)
                </label>
                <div className="flex items-center justify-between font-mono text-sm font-bold text-slate-700 dark:text-slate-300 break-all">
                  <span>{showApiKeysModal.api_read_key}</span>
                  <button
                    onClick={() => handleCopy(showApiKeysModal.api_read_key, "readKey")}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {copiedKey === "readKey" ? <Check className="w-4 h-4 text-[#137f3a]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowApiKeysModal(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Channel Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#137f3a]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Channel Settings</h3>
              </div>
              <button onClick={() => setShowSettingsModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Channel Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none h-20"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded text-[#137f3a]"
                />
                <label htmlFor="editIsPublic" className="text-slate-700 dark:text-slate-300 font-medium">
                  Public Channel Access
                </label>
              </div>

              {/* Dynamic Fields List */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-xs">
                  Configured Fields ({channelFields.length})
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {channelFields.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-slate-900 dark:text-white">{f.name} ({f.field_key})</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(f.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteChannel(showSettingsModal.id)}
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Channel
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(null)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-[#137f3a] hover:bg-[#0f682f] text-white rounded-lg font-bold"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Sharing */}
      {showSharingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#137f3a]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Channel Sharing</h3>
              </div>
              <button onClick={() => setShowSharingModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareMsg && (
              <div className="p-3 mb-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 rounded-lg text-sm">
                {shareMsg}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3 text-sm mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="user@domain.com"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#137f3a] text-white font-bold rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
              <div className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase">Active Collaborators</div>
              {members.length === 0 && (
                <div className="text-slate-400 text-center py-4 text-sm">No other members invited yet.</div>
              )}
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                  <span className="font-medium text-slate-900 dark:text-white">{m.user_email}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Data Export */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl text-center">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#137f3a]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Import / Export</h3>
              </div>
              <button onClick={() => setShowExportModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              Export all historic sensor readings for channel <strong className="text-slate-900 dark:text-white">{showExportModal.name}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <a
                href={`/api/telemetry/channel/${showExportModal.id}/export?format=csv`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-[#137f3a] hover:bg-[#0f682f] text-white font-bold text-sm rounded-lg shadow flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download CSV
              </a>
              <a
                href={`/api/telemetry/channel/${showExportModal.id}/export?format=json`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-lg shadow flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download JSON
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Hardware Examples */}
      {showExampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#137f3a]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {exampleCodes[showExampleModal]?.title || "Microcontroller Example"}
                </h3>
              </div>
              <button onClick={() => setShowExampleModal(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {exampleCodes[showExampleModal]?.desc}
            </p>

            <div className="relative bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-72">
              <button
                onClick={() => handleCopy(exampleCodes[showExampleModal]?.code, "exampleCode")}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 shadow cursor-pointer"
              >
                {copiedKey === "exampleCode" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Code</span>
              </button>
              <pre>{exampleCodes[showExampleModal]?.code}</pre>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowExampleModal(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
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
