const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("agx_token");
  const masterPasskey = sessionStorage.getItem("agx_master_passkey");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(masterPasskey && { "x-master-passkey": masterPasskey }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Network request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  verifyPasskey: (passkey) => request("/auth/verify-passkey", { method: "POST", body: JSON.stringify({ passkey }) }),
  getPasskeyStatus: () => request("/auth/passkey-status"),
  lockPasskey: () => request("/auth/lock-passkey", { method: "POST" }),
  getProfile: () => request("/auth/profile"),
  updateProfile: (data) => request("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data) => request("/auth/change-password", { method: "PUT", body: JSON.stringify(data) }),
  changePasskey: (data) => request("/auth/change-passkey", { method: "PUT", body: JSON.stringify(data) }),
  getLoginHistory: () => request("/auth/login-history"),
  getActivityLogs: () => request("/auth/activity-logs"),
  getAlerts: () => request("/auth/alerts"),
  markAlertRead: (id) => request(`/auth/alerts/${id}/read`, { method: "PUT" }),

  // Projects
  getProjects: () => request("/projects"),
  createProject: (data) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  getProject: (id) => request(`/projects/${id}`),
  updateProject: (id, data) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  addProjectMember: (projectId, data) => request(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify(data) }),
  removeProjectMember: (projectId, memberId) => request(`/projects/${projectId}/members/${memberId}`, { method: "DELETE" }),

  // Channels
  getMyChannels: () => request("/channels/my/all"),
  getChannels: (projectId) => request(`/channels/project/${projectId}`),
  createChannel: (data) => request("/channels", { method: "POST", body: JSON.stringify(data) }),
  getChannel: (id) => request(`/channels/${id}`),
  updateChannel: (id, data) => request(`/channels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChannel: (id) => request(`/channels/${id}`, { method: "DELETE" }),
  deleteField: (fieldId) => request(`/channels/fields/${fieldId}`, { method: "DELETE" }),
  regenerateChannelKeys: (id) => request(`/channels/${id}/regenerate-keys`, { method: "POST" }),
  regenerateWriteKey: (id) => request(`/channels/${id}/regenerate-write-key`, { method: "POST" }),
  getReadKeys: (id) => request(`/channels/${id}/read-keys`),
  addReadKey: (id, data) => request(`/channels/${id}/read-keys`, { method: "POST", body: JSON.stringify(data) }),
  updateReadKey: (id, keyId, data) => request(`/channels/${id}/read-keys/${keyId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReadKey: (id, keyId) => request(`/channels/${id}/read-keys/${keyId}`, { method: "DELETE" }),
  getChannelShares: (id) => request(`/channels/${id}/shares`),
  addChannelShare: (id, data) => request(`/channels/${id}/shares`, { method: "POST", body: JSON.stringify(data) }),
  deleteChannelShare: (id, shareId) => request(`/channels/${id}/shares/${shareId}`, { method: "DELETE" }),
  updateSharingMode: (id, sharing_mode) => request(`/channels/${id}/sharing-mode`, { method: "PUT", body: JSON.stringify({ sharing_mode }) }),

  // Dynamic Fields
  addField: (channelId, data) => request(`/channels/${channelId}/fields`, { method: "POST", body: JSON.stringify(data) }),
  updateField: (channelId, fieldId, data) => request(`/channels/${channelId}/fields/${fieldId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteField: (channelId, fieldId) => request(`/channels/${channelId}/fields/${fieldId}`, { method: "DELETE" }),

  // Calculated Fields
  addCalculatedField: (channelId, data) => request(`/channels/${channelId}/calculated-fields`, { method: "POST", body: JSON.stringify(data) }),
  deleteCalculatedField: (channelId, calcId) => request(`/channels/${channelId}/calculated-fields/${calcId}`, { method: "DELETE" }),

  // Calibration
  calibrateSensor: (channelId, data) => request(`/channels/${channelId}/calibrations`, { method: "POST", body: JSON.stringify(data) }),

  // Devices
  getDevices: () => request("/devices"),
  createDevice: (data) => request("/devices", { method: "POST", body: JSON.stringify(data) }),
  updateDevice: (id, data) => request(`/devices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDevice: (id) => request(`/devices/${id}`, { method: "DELETE" }),
  regenerateDeviceKey: (id) => request(`/devices/${id}/regenerate-key`, { method: "POST" }),

  // Telemetry & Historical Data
  getHistoricalData: (channelId, range = "24h") => request(`/telemetry/channel/${channelId}/historical?range=${range}`),
  getTelemetry: (channelId, range = "24h") => request(`/telemetry/channel/${channelId}/historical?range=${range}`),
  importChannelCsv: (channelId, data) => request(`/telemetry/channel/${channelId}/import-csv`, { method: "POST", body: JSON.stringify(data) }),
  getAnalytics: (channelId, range = "24h") => request(`/telemetry/channel/${channelId}/analytics?range=${range}`),
  sendTelemetryData: (data) => request("/data", { method: "POST", body: JSON.stringify(data) }),

  // Actuator Control
  getActuators: (channelId) => request(`/actuators/channel/${channelId}`),
  createActuator: (data) => request("/actuators", { method: "POST", body: JSON.stringify(data) }),
  controlActuator: (id, state) => request(`/actuators/${id}/control`, { method: "POST", body: JSON.stringify({ state }) }),
  deleteActuator: (id) => request(`/actuators/${id}`, { method: "DELETE" }),

  // Automation Rules & Scheduled
  getRules: (channelId) => request(`/rules/channel/${channelId}`),
  createRule: (data) => request("/rules", { method: "POST", body: JSON.stringify(data) }),
  toggleRule: (id) => request(`/rules/${id}/toggle`, { method: "PUT" }),
  deleteRule: (id) => request(`/rules/${id}`, { method: "DELETE" }),
  createScheduledRule: (data) => request("/rules/scheduled", { method: "POST", body: JSON.stringify(data) }),
  deleteScheduledRule: (id) => request(`/rules/scheduled/${id}`, { method: "DELETE" }),

  // Custom Dashboard Widgets
  getWidgets: (channelId) => request(`/dashboards/channel/${channelId}/widgets`),
  addWidget: (channelId, data) => request(`/dashboards/channel/${channelId}/widgets`, { method: "POST", body: JSON.stringify(data) }),
  updateWidget: (id, data) => request(`/dashboards/widgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWidget: (id) => request(`/dashboards/widgets/${id}`, { method: "DELETE" }),
  getPublicDashboard: (slug, password) => request(`/dashboards/public/${slug}${password ? `?password=${encodeURIComponent(password)}` : ""}`),

  // AI & Reports
  askAIAssistant: (query, channelId) => request("/ai/query", { method: "POST", body: JSON.stringify({ query, channelId }) }),
  getAnomalies: (channelId) => request(`/ai/anomalies/${channelId}`),
  getForecast: (channelId) => request(`/ai/forecast/${channelId}`),
  getMonthlyReport: (projectId) => request(`/reports/project/${projectId}/summary`),

  // Simulator
  getSimulatorStatus: () => request("/simulator/status"),
  toggleSimulator: () => request("/simulator/toggle", { method: "POST" }),
  burstSimulator: () => request("/simulator/burst", { method: "POST" })
};
