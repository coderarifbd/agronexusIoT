import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { ProjectProvider } from "./context/ProjectContext";

// Components
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { AlertsDrawer } from "./components/layout/AlertsDrawer";
import { ActivityLogDrawer } from "./components/layout/ActivityLogDrawer";
import { LoginModal } from "./components/auth/LoginModal";
import { DashboardView } from "./components/dashboard/DashboardView";
import { PublicDashboard } from "./components/dashboard/PublicDashboard";
import { MyChannelsView } from "./components/channels/MyChannelsView";
import { DevicesView } from "./components/devices/DevicesView";
import { ProfileView } from "./components/profile/ProfileView";
import { AIAssistantModal } from "./components/ai/AIAssistantModal";
import { CodeGeneratorView } from "./components/codegen/CodeGeneratorView";
import { CircuitDesignerView } from "./components/circuit/CircuitDesignerView";

import { AlertTriangle, X, RefreshCw } from "lucide-react";

// Error Boundary to prevent blank screens on any child component failure
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AgroNexus Caught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
          <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-950 p-3 rounded overflow-x-auto text-left">
            {this.state.error?.message || "Unknown error occurred"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2 bg-[#137f3a] text-white text-xs font-semibold rounded shadow inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { user, loading } = useAuth();
  const { toastAlert, setToastAlert } = useSocket();

  const [currentTab, setCurrentTab] = useState("dashboard");
  const [tabHistory, setTabHistory] = useState([]);
  const [codegenPrefill, setCodegenPrefill] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  function navigateTo(tab) {
    if (tab !== currentTab) {
      setTabHistory(prev => [...prev, currentTab]);
      setCurrentTab(tab);
    }
  }

  function handleOpenCodeGen(prefillData) {
    setCodegenPrefill(prefillData || null);
    navigateTo("codegen");
  }

  function goBack() {
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setCurrentTab(prevTab);
    } else {
      setCurrentTab("dashboard");
    }
  }

  const canGoBack = currentTab !== "dashboard" || tabHistory.length > 0;

  // Check if public dashboard route e.g. /dashboard/public/:slug
  const pathname = window.location.pathname;
  if (pathname.startsWith("/dashboard/public/")) {
    const slug = pathname.replace("/dashboard/public/", "");
    return <PublicDashboard slug={slug} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070a12] flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono">
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm p-4 bg-white dark:bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl flex items-start gap-3 animate-slideDown">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white">{toastAlert.title}</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{toastAlert.message}</div>
          </div>
          <button onClick={() => setToastAlert(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        onOpenAI={() => setShowAI(true)}
        onOpenAlerts={() => setShowAlerts(true)}
        onOpenActivity={() => setShowActivity(true)}
        currentTab={currentTab}
        setCurrentTab={navigateTo}
        onBack={goBack}
        canGoBack={canGoBack}
      />

      {/* Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={navigateTo} />

        {/* Dynamic View Main Container with Error Boundary */}
        <main className="flex-1 overflow-y-auto pb-12">
          <ErrorBoundary>
            {currentTab === "dashboard" && (
              <DashboardView onNavigateToChannels={() => navigateTo("channels")} />
            )}
            {(currentTab === "channels" || currentTab === "projects") && (
              <MyChannelsView
                onNavigateToDashboard={() => navigateTo("dashboard")}
                onNavigateToCodeGen={handleOpenCodeGen}
                onBack={goBack}
              />
            )}
            {currentTab === "devices" && (
              <DevicesView
                onNavigateToDashboard={() => navigateTo("dashboard")}
                onNavigateToCodeGen={handleOpenCodeGen}
                onBack={goBack}
              />
            )}
            {currentTab === "codegen" && (
              <CodeGeneratorView
                prefill={codegenPrefill}
                onNavigateToDevices={() => navigateTo("devices")}
                onNavigateToChannels={() => navigateTo("channels")}
              />
            )}
            {currentTab === "circuit" && (
              <CircuitDesignerView
                onNavigateToCodeGen={handleOpenCodeGen}
                onOpenAI={() => setShowAI(true)}
              />
            )}
            {currentTab === "profile" && (
              <ProfileView
                onNavigateToDashboard={() => navigateTo("dashboard")}
                onBack={goBack}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals & Drawers */}
      <AIAssistantModal isOpen={showAI} onClose={() => setShowAI(false)} />
      <AlertsDrawer isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
      <ActivityLogDrawer isOpen={showActivity} onClose={() => setShowActivity(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ProjectProvider>
            <ErrorBoundary>
              <MainApp />
            </ErrorBoundary>
          </ProjectProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
