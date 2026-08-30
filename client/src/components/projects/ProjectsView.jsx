import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { api } from "../../services/api";
import { DynamicFieldsModal } from "./DynamicFieldsModal";
import {
  FolderTree,
  Plus,
  Radio,
  Sliders,
  Share2,
  Trash2,
  Key,
  Globe,
  Lock,
  Layers,
  ChevronRight,
  ExternalLink,
  Users,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export function ProjectsView() {
  const { projects, activeProject, selectProject, loadProjects } = useProject();

  const [channels, setChannels] = useState([]);
  const [activeChannelDetail, setActiveChannelDetail] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // New Project Form
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  // New Channel Form
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Team Share Form & State
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");

  useEffect(() => {
    if (activeProject?.id) {
      loadProjectChannels(activeProject.id);
    }
  }, [activeProject?.id]);

  async function loadProjectChannels(pId) {
    try {
      const res = await api.getProject(pId);
      setChannels(res.channels || []);
      setMembers(res.members || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleOpenTeamModal() {
    setShowTeamModal(true);
    setMemberError("");
    setMemberSuccess("");
    const targetProjId = activeProject?.id || projects[0]?.id;
    if (targetProjId) {
      try {
        const res = await api.getProject(targetProjId);
        setMembers(res.members || []);
      } catch (e) {
        console.error(e);
      }
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!projectName) return;
    try {
      await api.createProject({ name: projectName, description: projectDesc });
      setProjectName("");
      setProjectDesc("");
      setShowCreateProject(false);
      loadProjects();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateChannel(e) {
    e.preventDefault();
    if (!channelName || !activeProject?.id) return;
    try {
      await api.createChannel({
        project_id: activeProject.id,
        name: channelName,
        description: channelDesc,
        is_public: isPublic
      });
      setChannelName("");
      setChannelDesc("");
      setShowCreateChannel(false);
      loadProjectChannels(activeProject.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleOpenFields(ch) {
    try {
      const res = await api.getChannel(ch.id);
      setActiveChannelDetail({ ...ch, fields: res.fields });
      setShowFieldsModal(true);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddMember(e) {
    if (e && e.preventDefault) e.preventDefault();
    setMemberError("");
    setMemberSuccess("");

    const targetProject = activeProject || projects[0];
    if (!targetProject?.id) {
      setMemberError("Please select an active project first.");
      return;
    }

    if (!shareEmail.trim()) {
      setMemberError("Please enter a valid member email address.");
      return;
    }

    try {
      setMemberLoading(true);
      const res = await api.addProjectMember(targetProject.id, {
        email: shareEmail.trim(),
        role: shareRole
      });
      setMembers(res.members || []);
      setMemberSuccess(`Successfully added ${shareEmail.trim()} as ${shareRole}`);
      setShareEmail("");
      setTimeout(() => setMemberSuccess(""), 4000);
    } catch (err) {
      console.error("Add member error:", err);
      setMemberError(err.message || "Failed to add member to project.");
    } finally {
      setMemberLoading(false);
    }
  }

  async function handleRemoveMember(memberId) {
    const targetProject = activeProject || projects[0];
    if (!targetProject?.id) return;
    try {
      const res = await api.removeProjectMember(targetProject.id, memberId);
      setMembers(res.members || []);
      setMemberSuccess("Team member access revoked.");
      setTimeout(() => setMemberSuccess(""), 3000);
    } catch (e) {
      console.error(e);
    }
  }

  const currentProjectName = activeProject?.name || projects[0]?.name || "Project";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-emerald-400" />
            Projects & Channels Hierarchy
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unlimited projects and channels with dynamic sensor fields (ThingSpeak / Blynk architecture).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenTeamModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Team Access</span>
          </button>

          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Project</span>
          </button>
        </div>
      </div>

      {/* Projects List Grid */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          My Projects ({projects.length})
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((p) => {
            const isSelected = activeProject?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => selectProject(p)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/50"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {p.channel_count || 0} Channels
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">{p.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-1">{p.description || "IoT telemetry workspace"}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Project Channels List */}
      {activeProject && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  PROJECT
                </span>
                <h3 className="text-lg font-bold text-white">{activeProject.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeProject.description}</p>
            </div>

            <button
              onClick={() => setShowCreateChannel(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Channel</span>
            </button>
          </div>

          {/* Channels Table */}
          <div className="space-y-3">
            {channels.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No channels created in this project yet. Click "+ Create Channel" to add one.
              </div>
            )}

            {channels.map((ch) => (
              <div
                key={ch.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                    CH{String(ch.channel_number || "01").padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{ch.name}</h4>
                      {ch.is_public ? (
                        <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span>API Write Key: <code className="text-emerald-400 font-semibold">{ch.api_write_key}</code></span>
                      <span className="text-slate-700">?</span>
                      <span>{ch.field_count || 0} Dynamic Sensor Fields</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenFields(ch)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manage Fields</span>
                  </button>

                  <button
                    onClick={() => window.open(`/dashboard/public/${ch.public_slug || ch.id}`, "_blank")}
                    title="View Public Dashboard"
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Fields Modal */}
      <DynamicFieldsModal
        isOpen={showFieldsModal}
        onClose={() => setShowFieldsModal(false)}
        channel={activeChannelDetail}
        onFieldsUpdated={() => {
          if (activeProject?.id) loadProjectChannels(activeProject.id);
          if (activeChannelDetail?.id) handleOpenFields(activeChannelDetail);
        }}
      />

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New IoT Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Smart Greenhouse Farm"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Project goals and telemetry scope"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none h-20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Channel in {activeProject?.name || "Project"}</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Weather Monitoring Station"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="Sensor stream description"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none h-16"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-950 border-slate-800"
                />
                <label htmlFor="isPublicCheck" className="text-xs text-slate-300">
                  Make Channel Publicly Shareable
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Sharing Modal (Item 28) */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Team Sharing & RBAC Permissions
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Manage team member roles (Owner, Admin, Editor, Viewer) for <strong className="text-emerald-400">{currentProjectName}</strong>.
            </p>

            {memberSuccess && (
              <div className="p-3 mb-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{memberSuccess}</span>
              </div>
            )}

            {memberError && (
              <div className="p-3 mb-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{memberError}</span>
              </div>
            )}

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="colleague@domain.com"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                required
              />
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
              </select>
              <button
                type="submit"
                disabled={memberLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/30 flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {memberLoading ? "Adding..." : "Add"}
              </button>
            </form>

            {/* Members List */}
            <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
              {members.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-6">
                  No team members added yet. Enter an email above to invite colleagues.
                </div>
              )}
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">{m.user_email}</span>
                    <span className="ml-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      {m.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    title="Revoke member access"
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowTeamModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
