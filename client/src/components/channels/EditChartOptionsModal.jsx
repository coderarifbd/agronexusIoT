import React, { useState } from "react";
import { X, HelpCircle } from "lucide-react";

export function EditChartOptionsModal({ isOpen, onClose, field, fieldIndex, chartOptions, onSave }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(chartOptions?.title || "");
  const [xAxisLabel, setXAxisLabel] = useState(chartOptions?.xAxisLabel || "");
  const [yAxisLabel, setYAxisLabel] = useState(chartOptions?.yAxisLabel || "");
  const [color, setColor] = useState(chartOptions?.color || "#d62020");
  const [background, setBackground] = useState(chartOptions?.background || "#ffffff");
  const [chartType, setChartType] = useState(chartOptions?.chartType || "line");
  const [dynamic, setDynamic] = useState(chartOptions?.dynamic !== undefined ? String(chartOptions.dynamic) : "true");
  const [days, setDays] = useState(chartOptions?.days || "");
  const [results, setResults] = useState(chartOptions?.results || "60");

  const [timescale, setTimescale] = useState(chartOptions?.timescale || "");
  const [average, setAverage] = useState(chartOptions?.average || "");
  const [median, setMedian] = useState(chartOptions?.median || "");
  const [sum, setSum] = useState(chartOptions?.sum || "");
  const [rounding, setRounding] = useState(chartOptions?.rounding || "");
  const [dataMin, setDataMin] = useState(chartOptions?.dataMin || "");
  const [dataMax, setDataMax] = useState(chartOptions?.dataMax || "");
  const [yAxisMin, setYAxisMin] = useState(chartOptions?.yAxisMin || "");
  const [yAxisMax, setYAxisMax] = useState(chartOptions?.yAxisMax || "");

  const [showHelp, setShowHelp] = useState(false);

  function handleFormSubmit(e) {
    e.preventDefault();
    if (onSave) {
      onSave({
        title,
        xAxisLabel,
        yAxisLabel,
        color,
        background,
        chartType,
        dynamic: dynamic === "true",
        days,
        results: Number(results) || 60,
        timescale,
        average,
        median,
        sum,
        rounding,
        dataMin,
        dataMax,
        yAxisMin: yAxisMin !== "" ? Number(yAxisMin) : null,
        yAxisMax: yAxisMax !== "" ? Number(yAxisMax) : null
      });
    }
    onClose();
  }

  const fieldNum = fieldIndex !== undefined ? fieldIndex + 1 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden transition-all text-slate-800 dark:text-slate-200 text-sm">
        {/* Header (Matches media_1788287658461.png) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-base sm:text-xl font-normal text-slate-800 dark:text-white tracking-tight">
            {title ? `${title} Options` : `Field ${fieldNum} Chart Options`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 cursor-pointer"
              title="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-200 text-xs rounded leading-relaxed shrink-0">
            Customize chart axes, line color, background, time aggregation (averaging/median), and display parameters for this field.
          </div>
        )}

        {/* 2-Column Form (Matches media_1788287658461.png) */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Title */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Title:
                </label>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                  />
                </div>
              </div>

              {/* X-Axis */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  X-Axis:
                </label>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={xAxisLabel}
                    onChange={(e) => setXAxisLabel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                  />
                </div>
              </div>

              {/* Y-Axis */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Y-Axis:
                </label>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={yAxisLabel}
                    onChange={(e) => setYAxisLabel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#137f3a]"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Color:
                </label>
                <div className="col-span-8 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="color"
                    value={color.startsWith("#") ? color : "#d62020"}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>

              {/* Background */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Background:
                </label>
                <div className="col-span-8 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="color"
                    value={background.startsWith("#") ? background : "#ffffff"}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Type:
                </label>
                <div className="col-span-8">
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value="line">line</option>
                    <option value="bar">bar</option>
                    <option value="column">column</option>
                    <option value="spline">spline</option>
                    <option value="step">step</option>
                    <option value="area">area</option>
                  </select>
                </div>
              </div>

              {/* Dynamic? */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Dynamic?:
                </label>
                <div className="col-span-8">
                  <select
                    value={dynamic}
                    onChange={(e) => setDynamic(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
              </div>

              {/* Days */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Days:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Results:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Timescale */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Timescale:
                </label>
                <div className="col-span-8">
                  <select
                    value={timescale}
                    onChange={(e) => setTimescale(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value=""></option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="240">240</option>
                    <option value="720">720</option>
                    <option value="1440">1440</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                  </select>
                </div>
              </div>

              {/* Average */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Average:
                </label>
                <div className="col-span-8">
                  <select
                    value={average}
                    onChange={(e) => setAverage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value=""></option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="240">240</option>
                    <option value="720">720</option>
                    <option value="1440">1440</option>
                    <option value="daily">daily</option>
                  </select>
                </div>
              </div>

              {/* Median */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Median:
                </label>
                <div className="col-span-8">
                  <select
                    value={median}
                    onChange={(e) => setMedian(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value=""></option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="240">240</option>
                    <option value="720">720</option>
                    <option value="1440">1440</option>
                    <option value="daily">daily</option>
                  </select>
                </div>
              </div>

              {/* Sum */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Sum:
                </label>
                <div className="col-span-8">
                  <select
                    value={sum}
                    onChange={(e) => setSum(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white"
                  >
                    <option value=""></option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="240">240</option>
                    <option value="720">720</option>
                    <option value="1440">1440</option>
                    <option value="daily">daily</option>
                  </select>
                </div>
              </div>

              {/* Rounding */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Rounding:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={rounding}
                    onChange={(e) => setRounding(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Data Min */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Data Min:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={dataMin}
                    onChange={(e) => setDataMin(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Data Max */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Data Max:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={dataMax}
                    onChange={(e) => setDataMax(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Y-Axis Min */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Y-Axis Min:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={yAxisMin}
                    onChange={(e) => setYAxisMin(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Y-Axis Max */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-right font-medium text-slate-700 dark:text-slate-300">
                  Y-Axis Max:
                </label>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={yAxisMax}
                    onChange={(e) => setYAxisMax(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons (Matches media_1788287658461.png) */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              className="px-7 py-2 bg-[#137f3a] hover:bg-[#0f682f] text-white font-semibold text-sm rounded shadow transition-all cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
