import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { X, HelpCircle } from "lucide-react";

export function AddWidgetModal({ isOpen, onClose, channel, channelId, fields = [], onWidgetAdded, editWidget = null }) {
  const [step, setStep] = useState(1);
  const [selectedWidget, setSelectedWidget] = useState("gauge");

  // Step 2 Form State
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState(fields[0]?.field_key || "field1");
  const [minVal, setMinVal] = useState("0");
  const [maxVal, setMaxVal] = useState("100");
  const [displayValue, setDisplayValue] = useState(true);
  const [units, setUnits] = useState("");
  const [tickInterval, setTickInterval] = useState("10");
  const [updateInterval, setUpdateInterval] = useState("15");

  // Threshold Ranges: default 90-100 red (like ThingSpeak)
  const [ranges, setRanges] = useState([
    { id: 1, from: "90", to: "100", color: "#d62020" }
  ]);

  const [autoScale, setAutoScale] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(editWidget);

  useEffect(() => {
    if (editWidget) {
      setStep(2);
      setSelectedWidget(editWidget.widget_type || "gauge");
      setName(editWidget.title || "");
      setFieldKey(editWidget.field_key || fields[0]?.field_key || "field1");

      const cfg = editWidget.config || {};
      setMinVal(cfg.min !== undefined ? String(cfg.min) : "0");
      setMaxVal(cfg.max !== undefined ? String(cfg.max) : "100");
      setAutoScale(cfg.autoScale !== undefined ? Boolean(cfg.autoScale) : true);
      setDisplayValue(cfg.displayValue !== undefined ? cfg.displayValue : true);
      setUnits(cfg.units || "");
      setTickInterval(cfg.tickInterval !== undefined ? String(cfg.tickInterval) : "10");
      setUpdateInterval(cfg.updateInterval !== undefined ? String(cfg.updateInterval) : "15");

      if (Array.isArray(cfg.ranges) && cfg.ranges.length > 0) {
        setRanges(cfg.ranges.map((r, i) => ({ id: i + 1, ...r })));
      }
    } else {
      setStep(1);
      setSelectedWidget("gauge");
      setName("");
      setFieldKey(fields[0]?.field_key || "field1");
      setMinVal("0");
      setMaxVal("100");
      setAutoScale(true);
      setDisplayValue(true);
      setUnits("");
      setTickInterval("10");
      setUpdateInterval("15");
      setRanges([{ id: 1, from: "90", to: "100", color: "#d62020" }]);
    }
  }, [editWidget, isOpen, fields]);

  if (!isOpen) return null;

  function handleSelectWidget(type) {
    setSelectedWidget(type);
    setName(type === "gauge" ? "Gauge" : type === "numeric" ? "Numeric Display" : type === "lamp" ? "Lamp Indicator" : "Image Display");
    setStep(2);
  }

  function handleAddRange() {
    setRanges([
      ...ranges,
      { id: Date.now(), from: "0", to: "50", color: "#137f3a" }
    ]);
  }

  function handleRemoveRange(id) {
    setRanges(ranges.filter((r) => r.id !== id));
  }

  function handleRangeChange(id, key, val) {
    setRanges(ranges.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  }

  async function handleSaveWidget(e) {
    e.preventDefault();
    const targetChannelId = channel?.id || channelId || (typeof channel === "string" ? channel : null);
    if (!targetChannelId) {
      console.error("No channel specified for widget");
      alert("Channel identifier is missing. Please reopen the channel.");
      return;
    }

    try {
      setLoading(true);
      const configObj = {
        min: Number(minVal) || 0,
        max: Number(maxVal) || 100,
        autoScale: Boolean(autoScale),
        displayValue: Boolean(displayValue),
        units: units || "",
        tickInterval: Number(tickInterval) || 10,
        updateInterval: Number(updateInterval) || 15,
        ranges: ranges.map((r) => ({
          from: Number(r.from) || 0,
          to: Number(r.to) || 0,
          color: r.color || "#d62020"
        }))
      };

      const widgetTitle = name && name.trim() ? name.trim() : (selectedWidget === "gauge" ? "Gauge" : selectedWidget === "numeric" ? "Numeric Display" : "Widget");

      if (isEditMode) {
        await api.updateWidget(editWidget.id, {
          title: widgetTitle,
          field_key: fieldKey,
          config: configObj
        });
      } else {
        const createFn = api.createWidget || api.addWidget;
        await createFn(targetChannelId, {
          title: widgetTitle,
          widget_type: selectedWidget,
          field_key: fieldKey,
          config: configObj
        });
      }

      if (onWidgetAdded) onWidgetAdded();
      handleClose();
    } catch (err) {
      console.error("Failed to save widget:", err);
      alert("Failed to save widget: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    setName((prev) => {
      if (prev && prev.trim() !== "") return prev;
      return selectedWidget === "gauge"
        ? "Gauge"
        : selectedWidget === "numeric"
        ? "Numeric Display"
        : selectedWidget === "lamp"
        ? "Lamp Indicator"
        : "Image Display";
    });
    setStep(2);
  }

  function handleClose() {
    onClose();
  }

  const widgetsList = [
    {
      id: "gauge",
      title: "Gauge",
      renderGraphic: (
        <svg viewBox="0 0 100 100" className="w-14 h-14 mx-auto">
          <circle cx="50" cy="50" r="42" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M 22 70 A 35 35 0 1 1 78 70" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="23" y="70" fontSize="6.5" fill="#64748b" textAnchor="middle" fontFamily="sans-serif">0</text>
          <text x="50" y="22" fontSize="6.5" fill="#64748b" textAnchor="middle" fontFamily="sans-serif">50</text>
          <text x="77" y="70" fontSize="6.5" fill="#64748b" textAnchor="middle" fontFamily="sans-serif">100</text>
          <line x1="50" y1="50" x2="30" y2="65" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3.5" fill="#ef4444" />
          <path d="M 72 70 A 35 35 0 0 1 78 70" fill="none" stroke="#ef4444" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: "numeric",
      title: "Numeric Display",
      renderGraphic: (
        <div className="w-full flex flex-col items-center justify-center">
          <div className="border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/70 rounded px-2.5 py-0.5 font-mono text-xs text-slate-500 tracking-wider">
            1516.12
          </div>
          <span className="text-[8px] font-mono text-slate-400 mt-0.5 uppercase tracking-widest">
            DB
          </span>
        </div>
      )
    },
    {
      id: "lamp",
      title: "Lamp Indicator",
      renderGraphic: (
        <div className="w-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-b from-white via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 shadow-sm flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 bg-gradient-to-tr from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 shadow-inner" />
          </div>
        </div>
      )
    },
    {
      id: "image",
      title: "Image Display",
      renderGraphic: (
        <div className="w-full flex items-center justify-center text-slate-400">
          <svg viewBox="0 0 24 24" className="w-9 h-9" fill="currentColor">
            <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Tight Content-Fitted Container in Middle without Extra Space */}
      <div className={`w-full ${step === 1 ? "max-w-[530px]" : "max-w-[480px]"} bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden transition-all text-slate-800 dark:text-slate-200 text-xs`}>
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-sm font-normal text-slate-800 dark:text-white tracking-tight">
            {step === 1 ? "Click on a widget to add it to the Channel" : "Configure widget parameters"}
          </h2>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-0.5 cursor-pointer"
                title="Help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Step 1: Choose Widget (Authentic 3-Column Grid matching media_1788286440379.png) */}
        {step === 1 && (
          <div className="p-3.5 space-y-3">
            <div className="grid grid-cols-3 gap-2.5">
              {widgetsList.map((w) => {
                const isSelected = selectedWidget === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWidget(w.id)}
                    className={`rounded border overflow-hidden cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-[#2b729f] ring-1 ring-[#2b729f] shadow-sm"
                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    {/* Header Banner */}
                    <div
                      className={`px-2 py-1 text-[11px] font-semibold text-white transition-colors truncate ${
                        isSelected ? "bg-[#24638c]" : "bg-[#7ba3c2] dark:bg-slate-800"
                      }`}
                    >
                      {w.title}
                    </div>

                    {/* Graphic Box */}
                    <div className="bg-white dark:bg-slate-900 h-[80px] flex items-center justify-center p-1">
                      {w.renderGraphic}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-1.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-xs rounded shadow transition-all cursor-pointer"
              >
                Next
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modal Step 2: Configure Widget Parameters */}
        {step === 2 && (
          <form onSubmit={handleSaveWidget} className="p-3.5 space-y-2 text-xs overflow-y-auto max-h-[80vh]">
            {showHelp && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-200 text-[11px] rounded leading-relaxed">
                Configure the measurement parameters, limits, intervals, and color threshold bands for your widget.
              </div>
            )}

            {/* 1. Name */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name for the widget"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#137f3a]"
                  required
                />
              </div>
            </div>

            {/* 2. Field */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Field
              </label>
              <div className="col-span-9">
                <select
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                >
                  {fields.length > 0 ? (
                    fields.map((f, i) => (
                      <option key={f.id || f.field_key || i} value={f.field_key || `field${i + 1}`}>
                        Field {i + 1} ({f.name || `Field ${i + 1}`})
                      </option>
                    ))
                  ) : (
                    <option value="field1">Field 1</option>
                  )}
                </select>
              </div>
            </div>

            {/* 3. Min */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Min
              </label>
              <div className="col-span-9">
                <input
                  type="number"
                  value={minVal}
                  onChange={(e) => setMinVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* 4. Max */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Max
              </label>
              <div className="col-span-9">
                <input
                  type="number"
                  value={maxVal}
                  onChange={(e) => setMaxVal(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* 4b. Auto Scale Range (Gauge only) */}
            {selectedWidget === "gauge" && (
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                  Auto Scale
                </label>
                <div className="col-span-9 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoScale}
                    onChange={(e) => setAutoScale(e.target.checked)}
                    className="w-4 h-4 rounded text-[#137f3a] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500">
                    Auto-scale dial to sensor readings (e.g. 0-100, 0-1000, 0-2000)
                  </span>
                </div>
              </div>
            )}

            {/* 5. Display Value */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Display Value
              </label>
              <div className="col-span-9 flex items-center">
                <input
                  type="checkbox"
                  checked={displayValue}
                  onChange={(e) => setDisplayValue(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0066cc] dark:text-[#3b82f6] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* 6. Units */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Units
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="Enter Measurement Units"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* 7. Tick Interval */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Tick Interval
              </label>
              <div className="col-span-9">
                <input
                  type="number"
                  value={tickInterval}
                  onChange={(e) => setTickInterval(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                />
              </div>
            </div>

            {/* 8. Update Interval */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Update Interval
              </label>
              <div className="col-span-9 flex items-center gap-2">
                <input
                  type="number"
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                />
                <span className="text-slate-500 whitespace-nowrap text-[11px]">second(s)</span>
              </div>
            </div>

            {/* 9. Range (Threshold color bands) */}
            <div className="grid grid-cols-12 gap-2 items-start pt-0.5">
              <label className="col-span-3 text-right font-medium text-slate-700 dark:text-slate-300 pt-1">
                Range
              </label>
              <div className="col-span-9 space-y-1.5">
                {ranges.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={r.from}
                      onChange={(e) => handleRangeChange(r.id, "from", e.target.value)}
                      className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white"
                      placeholder="From"
                    />
                    <input
                      type="number"
                      value={r.to}
                      onChange={(e) => handleRangeChange(r.id, "to", e.target.value)}
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white"
                      placeholder="To"
                    />
                    {/* Color Swatch */}
                    <input
                      type="color"
                      value={r.color}
                      onChange={(e) => handleRangeChange(r.id, "color", e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                    />
                    {ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRange(r.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 text-xs cursor-pointer"
                        title="Remove Range"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex justify-center w-52 pt-0.5">
                  <button
                    type="button"
                    onClick={handleAddRange}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-base cursor-pointer"
                    title="Add Range"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded border border-slate-300 dark:border-slate-700 transition-all cursor-pointer mr-auto"
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-1.5 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-xs rounded shadow transition-all cursor-pointer"
              >
                {loading ? "Saving..." : (isEditMode ? "Save" : "Create")}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
