import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import heroBgImg from "../../assets/hero-bg.jpg";
import {
  Radio,
  Cpu,
  Sparkles,
  Leaf,
  Droplets,
  Zap,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Activity,
  Terminal,
  Menu,
  X,
  ExternalLink
} from "lucide-react";

/**
 * Animated Counter with count-up easing effect
 */
function CountUp({ end, duration = 1800, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    // Immediate fallback trigger
    const fallbackTimer = setTimeout(() => {
      setHasStarted(true);
    }, 200);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp = null;
    let frameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(easeProgress * end);
      setCount(currentVal);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref} className="tabular-nums transition-all duration-75">
      {prefix}{count}{suffix}
    </span>
  );
}

export function LandingPage({ onGetStarted, onLogin, onNavigateToDashboard, onNavigateTab }) {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", tab: "dashboard" },
    { label: "My channel", tab: "channels" },
    { label: "Cirkit Design", tab: "circuit" },
    { label: "Code Generation", tab: "codegen" },
    { label: "Security & profile", tab: "profile" }
  ];

  function handleMenuClick(tabId) {
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else if (user && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onLogin) {
      onLogin();
    }
  }

  function handleDashboardClick() {
    handleMenuClick("dashboard");
  }

  return (
    <div className="min-h-screen bg-[#07130b] text-slate-100 font-sans selection:bg-[#f5c026] selection:text-slate-950">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#06180e]/95 backdrop-blur-md border-b border-emerald-950/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Website Name (AgroNexus) */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                AgroNexus
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                IoT
              </span>
            </div>
          </div>

          {/* Center: Navigation links requested by user */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-medium text-emerald-100/90">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleMenuClick(item.tab)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Sign up / Dashboard Action & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-full bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>

            {user ? (
              <button
                onClick={handleDashboardClick}
                className="px-5 py-2 rounded-full bg-[#f5c026] hover:bg-[#e6b31e] text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Open Dashboard
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="px-5 py-2 rounded-full bg-[#f5c026] hover:bg-[#e6b31e] text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Sign up
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-emerald-200 hover:text-white"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-emerald-900/60 flex flex-col gap-3 text-sm text-emerald-100">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => {
                  setMobileNavOpen(false);
                  handleMenuClick(item.tab);
                }}
                className="text-left py-1.5 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden min-h-[580px] lg:min-h-[660px] flex items-center bg-[#07170e]">
        {/* Background Image: Lush sunrise agricultural field with smart robot */}
        <div
          className="absolute inset-0 bg-cover bg-center sm:bg-right transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: `url(${heroBgImg})`,
            backgroundPosition: "center right",
          }}
        />

        {/* Dark Green Gradient Overlay on Left Side (exact look of reference image) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, rgba(5, 22, 12, 0.96) 0%, rgba(5, 22, 12, 0.90) 35%, rgba(6, 26, 15, 0.65) 58%, rgba(6, 26, 15, 0.15) 85%, transparent 100%)",
          }}
        />

        {/* Subtle Ambient Radial Glow for sunrise flare enhancement */}
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24 lg:py-28 w-full">
          <div className="max-w-2xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-200 uppercase">
                AI-Powered IoT Agriculture
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black text-white tracking-tight leading-[1.12] mb-6">
              AgroNexus empowers<br />
              smarter farming<br />
              decisions.
            </h1>

            {/* Paragraph Description */}
            <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 font-normal leading-relaxed mb-8 max-w-xl">
              Connect your sensors, monitor real-time farm data, and use AI-powered insights to make better agricultural decisions.
            </p>

            {/* Action Button: [ Get Started ] */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={user && onNavigateToDashboard ? onNavigateToDashboard : onGetStarted}
                className="px-8 py-3.5 rounded-full bg-[#f5c026] hover:bg-[#eab308] text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2 cursor-pointer group"
              >
                <span>{user ? "Open Dashboard" : "Get Started"}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. METRIC IMPACT CARDS (Matching bottom of reference screenshot) */}
      <section className="relative z-20 -mt-10 sm:-mt-14 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: Energy Saved */}
          <div className="bg-white dark:bg-[#0f1d15] border border-slate-200/80 dark:border-emerald-900/60 rounded-2xl sm:rounded-3xl p-7 sm:p-8 text-center shadow-xl shadow-slate-900/5 dark:shadow-none hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Energy Saved
            </div>
            <div className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              <CountUp end={80} prefix="+" suffix="%" duration={1800} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Reduced water usage through intelligent irrigation
            </p>
          </div>

          {/* Card 2: Crop Yield */}
          <div className="bg-white dark:bg-[#0f1d15] border border-slate-200/80 dark:border-emerald-900/60 rounded-2xl sm:rounded-3xl p-7 sm:p-8 text-center shadow-xl shadow-slate-900/5 dark:shadow-none hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Crop Yield
            </div>
            <div className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              <CountUp end={95} prefix="+" suffix="%" duration={2000} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Improved health monitoring and decision making
            </p>
          </div>

          {/* Card 3: Time Efficiency */}
          <div className="bg-white dark:bg-[#0f1d15] border border-slate-200/80 dark:border-emerald-900/60 rounded-2xl sm:rounded-3xl p-7 sm:p-8 text-center shadow-xl shadow-slate-900/5 dark:shadow-none hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Time Efficiency
            </div>
            <div className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              <CountUp end={85} prefix="+" suffix="%" duration={1900} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Automated analysis and recommendations
            </p>
          </div>

        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES & FEATURES */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-3 py-1 rounded-full">
            Precision Agricultural IoT
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
            Integrated Intelligence from Soil to Cloud
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Everything modern agribusinesses and researchers need to capture telemetry, automate actuators, and apply computer vision AI models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-[#0b1a11] border border-emerald-900/40 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stream live data from DHT22, soil moisture, NPK probes, BMP280, and light sensors via REST & WebSocket.
            </p>
          </div>

          {/* Feature 2: Disease Analysis */}
          <div id="disease-analysis" className="bg-[#0b1a11] border border-emerald-900/40 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Disease Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload leaf imagery to detect early blight, fungal infections, and nutrient deficiencies with instant treatment plans.
            </p>
          </div>

          {/* Feature 3: Irrigator */}
          <div id="irrigator" className="bg-[#0b1a11] border border-emerald-900/40 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Irrigator Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated relay triggers and soil moisture threshold logic to optimize water delivery and conserve electricity.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#0b1a11] border border-emerald-900/40 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Firmware Code Generator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-generate production-ready C++ firmware sketches for ESP32, ESP8266, Uno, and Raspberry Pi Pico with WiFi & MQTT.
            </p>
          </div>
        </div>
      </section>

      {/* 5. LIVE SENSOR TELEMETRY PREVIEW */}
      <section className="py-16 bg-[#05140b] border-y border-emerald-950/80 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0a1c12] border border-emerald-900/50 rounded-3xl p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry Feed
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Seamless Sensor Integration & Monitoring
                </h3>
                <p className="text-sm text-slate-300 mt-2 max-w-xl">
                  Monitor field moisture, temperature anomalies, and battery health in real-time with zero latency.
                </p>
              </div>

              {/* Sample Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                <div className="bg-[#0e2719] p-4 rounded-2xl border border-emerald-800/40 text-center">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Soil Moisture</div>
                  <div className="text-2xl font-black text-white mt-1">68.4%</div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">Optimal Range</div>
                </div>
                <div className="bg-[#0e2719] p-4 rounded-2xl border border-emerald-800/40 text-center">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Canopy Temp</div>
                  <div className="text-2xl font-black text-white mt-1">24.8°C</div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">Normal</div>
                </div>
                <div className="bg-[#0e2719] p-4 rounded-2xl border border-emerald-800/40 text-center">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Pump State</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">ACTIVE</div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">Zone 1 Running</div>
                </div>
                <div className="bg-[#0e2719] p-4 rounded-2xl border border-emerald-800/40 text-center">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Fleet Status</div>
                  <div className="text-2xl font-black text-white mt-1">100%</div>
                  <div className="text-[10px] text-emerald-300 mt-0.5">8 Nodes Online</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-20 px-4 sm:px-8 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ready to empower your farm with AI & IoT?
        </h2>
        <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl mx-auto">
          Start streaming live agricultural data and gain predictive insights today.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={user && onNavigateToDashboard ? onNavigateToDashboard : onGetStarted}
            className="px-8 py-3.5 rounded-full bg-[#f5c026] hover:bg-[#eab308] text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{user ? "Open Dashboard" : "Get Started"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-emerald-950/80 bg-[#041007] py-8 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">AgroNexus IoT</span>
            <span>— AI-Powered Precision Agriculture Platform</span>
          </div>
          <div>
            © {new Date().getFullYear()} AgroNexus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
