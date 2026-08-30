import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import { socketClient } from "../services/socket";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      setChannels([]);
      setActiveChannel(null);
    }
  }, [user]);

  async function loadProjects() {
    try {
      setLoading(true);
      const res = await api.getProjects();
      setProjects(res.projects);
      if (res.projects.length > 0 && !activeProject) {
        selectProject(res.projects[0]);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  async function selectProject(proj) {
    setActiveProject(proj);
    try {
      const res = await api.getProject(proj.id);
      setChannels(res.channels);
      if (res.channels.length > 0) {
        selectChannel(res.channels[0]);
      } else {
        setActiveChannel(null);
      }
    } catch (err) {
      console.error("Error loading project channels:", err);
    }
  }

  async function selectChannel(ch) {
    if (activeChannel?.id) {
      socketClient.unsubscribeChannel(activeChannel.id);
    }
    setActiveChannel(ch);
    socketClient.subscribeChannel(ch.id);
  }

  async function refreshActiveChannel() {
    if (!activeChannel) return;
    try {
      const res = await api.getChannel(activeChannel.id);
      setActiveChannel(res.channel);
    } catch (err) {
      console.error("Error refreshing channel:", err);
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        channels,
        activeChannel,
        loading,
        loadProjects,
        selectProject,
        selectChannel,
        refreshActiveChannel
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
