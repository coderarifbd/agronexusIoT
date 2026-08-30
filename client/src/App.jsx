import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { ProjectProvider } from "./context/ProjectContext";

// Components
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { PasskeyModal } from "./components/layout/PasskeyModal";
import { AlertsDrawer } from "./components/layout/AlertsDrawer";
import { ActivityLogDrawer } from "./components/layout/ActivityLogDrawer";
import { LoginModal } from "./components/auth/LoginModal";
import { DashboardView } from "./components/dashboard/DashboardView";
import { PublicDashboard } from "./components/dashboard/PublicDashboard";
import { ProjectsView } from "./components/projects/ProjectsView";
import { DevicesView } from "./components/devices/DevicesView";
import { AutomationRulesView } from "./components/automation/AutomationRulesView";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { CalibrationStudio } from "./components/analytics/CalibrationStudio";
import { ProfileView } from "./components/profile/ProfileView";
import { AIAssistantModal } from "./components/ai/AIAssistantModal";

import { AlertTriangle, CheckCircle, Bell, X } from "lucide-react";

function MainApp() {
  const { user, loading } = useAuth();
  const { toastAlert, setToastAlert } = useSocket();

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [showAI, setShowAI] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Check if public dashboard route e.g. /dashboard/public/:slug
  const pathname = window.location.pathname;
  if (pathname.startsWith("/dashboard/public/")) {
    const slug = pathname.replace("/dashboard/public/", "");
    return <PublicDashboard slug={slug} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-emerald-400 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-wider uppercase">Loading AgroNexus Core...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm p-4 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl flex items-start gap-3 animate-slideDown">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-bold text-white">{toastAlert.title}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{toastAlert.message}</div>
          </div>
          <button onClick={() => setToastAlert(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        onOpenAI={() => setShowAI(true)}
        onOpenAlerts={() => setShowAlerts(true)}
        onOpenActivity={() => setShowActivity(true)}
      />

      {/* Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Dynamic View Main Container */}
        <main className="flex-1 overflow-y-auto pb-12">
          {currentTab === "dashboard" && <DashboardView />}
          {currentTab === "projects" && <ProjectsView />}
          {currentTab === "devices" && <DevicesView />}
          {currentTab === "automation" && <AutomationRulesView />}
          {currentTab === "analytics" && <AnalyticsView />}
          {currentTab === "calibration" && <CalibrationStudio />}
          {currentTab === "profile" && <ProfileView />}
        </main>
      </div>

      {/* Modals & Drawers */}
      <PasskeyModal />
      <AIAssistantModal isOpen={showAI} onClose={() => setShowAI(false)} />
      <AlertsDrawer isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
      <ActivityLogDrawer isOpen={showActivity} onClose={() => setShowActivity(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ProjectProvider>
          <MainApp />
        </ProjectProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
