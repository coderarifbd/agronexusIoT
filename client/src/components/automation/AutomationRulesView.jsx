import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { api } from "../../services/api";
import {
  Workflow,
  Plus,
  Clock,
  Zap,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export function AutomationRulesView() {
  const { activeChannel } = useProject();
  const [rules, setRules] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  // Rule Builder Modal State
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [conditionField, setConditionField] = useState("temperature");
  const [conditionOp, setConditionOp] = useState(">");
  const [conditionVal, setConditionVal] = useState("35");
  const [actionType, setActionType] = useState("ACTUATOR");
  const [targetActuatorId, setTargetActuatorId] = useState("");
  const [targetState, setTargetState] = useState("1");
  const [alertSeverity, setAlertSeverity] = useState("warning");
  const [alertMessage, setAlertMessage] = useState("");

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedName, setSchedName] = useState("");
  const [schedTime, setSchedTime] = useState("08:00");
  const [schedActuatorId, setSchedActuatorId] = useState("");
  const [schedState, setSchedState] = useState("1");

  useEffect(() => {
    if (activeChannel?.id) {
      loadAutomationData();
    }
  }, [activeChannel?.id]);

  async function loadAutomationData() {
    try {
      setLoading(true);
      const resRules = await api.getRules(activeChannel.id);
      setRules(resRules.rules || []);
      setScheduled(resRules.scheduled || []);

      const resCh = await api.getChannel(activeChannel.id);
      setActuators(resCh.actuators || []);
      setFields(resCh.fields || []);
      if (resCh.actuators?.length > 0) {
        setTargetActuatorId(resCh.actuators[0].id);
        setSchedActuatorId(resCh.actuators[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRule(e) {
    e.preventDefault();
    if (!ruleName || !activeChannel?.id) return;

    const conditions = [
      {
        field_key: conditionField,
        operator: conditionOp,
        value: parseFloat(conditionVal),
        logical_op: "AND"
      }
    ];

    const actions = [];
    if (actionType === "ACTUATOR" && targetActuatorId) {
      actions.push({
        action_type: "ACTUATOR",
        target_id: targetActuatorId,
        target_value: targetState,
        message: `Set actuator to ${targetState === '1' ? 'ON' : 'OFF'}`
      });
    }

    if (alertMessage) {
      actions.push({
        action_type: "ALERT",
        target_id: "system",
        severity: alertSeverity,
        message: alertMessage
      });
    }

    try {
      await api.createRule({
        channel_id: activeChannel.id,
        name: ruleName,
        conditions,
        actions
      });
      setShowRuleModal(false);
      setRuleName("");
      setAlertMessage("");
      loadAutomationData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateSchedule(e) {
    e.preventDefault();
    if (!schedName || !schedActuatorId || !activeChannel?.id) return;

    try {
      await api.createScheduledRule({
        channel_id: activeChannel.id,
        name: schedName,
        time_schedule: schedTime,
        target_actuator_id: schedActuatorId,
        target_value: schedState
      });
      setShowScheduleModal(false);
      setSchedName("");
      loadAutomationData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleRule(id) {
    try {
      await api.toggleRule(id);
      loadAutomationData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteRule(id) {
    try {
      await api.deleteRule(id);
      loadAutomationData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteScheduled(id) {
    try {
      await api.deleteScheduledRule(id);
      loadAutomationData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Automation & Trigger Rule Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build IF-THEN sensor triggers, emergency shutoffs, and scheduled automated time routines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>+ Scheduled Routine</span>
          </button>

          <button
            onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New IF-THEN Rule</span>
          </button>
        </div>
      </div>

      {/* 1. Real-time IF-THEN Automation Rules */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Sensor Threshold Trigger Rules ({rules.length})
        </h3>

        <div className="space-y-3">
          {rules.length === 0 && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-mono">
              No automation rules configured for this channel yet.
            </div>
          )}

          {rules.map((rule) => {
            let conditions = [];
            let actions = [];
            try {
              conditions = JSON.parse(rule.conditions_json);
              actions = JSON.parse(rule.actions_json);
            } catch (e) {}

            return (
              <div
                key={rule.id}
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rule.is_active ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                      }`}
                    />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</h4>
                  </div>

                  {/* Logic Expression Badge */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/30 font-semibold">
                      IF{" "}
                      {conditions.map((c, i) => (
                        <span key={i}>
                          <strong className="text-slate-900 dark:text-white">{c.field_key}</strong> {c.operator} {c.value}
                        </span>
                      ))}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-bold">➔</span>
                    <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-500/30 font-semibold">
                      THEN{" "}
                      {actions.map((a, i) => (
                        <span key={i}>
                          {a.action_type === "ACTUATOR" ? `Actuator ➔ ${a.target_value === '1' ? 'ON' : 'OFF'}` : "Trigger Alert"}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    title={rule.is_active ? "Deactivate" : "Activate"}
                  >
                    {rule.is_active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Scheduled Time-Based Automations */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Scheduled Cron Routines ({scheduled.length})
        </h3>

        <div className="space-y-3">
          {scheduled.length === 0 && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-mono">
              No time-scheduled routines configured yet.
            </div>
          )}

          {scheduled.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-500/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-mono font-bold text-xs">
                  {item.time_schedule}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h4>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Target: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.actuator_name || "Actuator Relay"}</span> ➔ Set to{" "}
                    <strong>{item.target_value === "1" ? "ON" : "OFF"}</strong> (Every Day)
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteScheduled(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create IF-THEN Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create IF-THEN Automation Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. High Heat Emergency Fan Trigger"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              {/* Condition Row */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                  IF Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {fields.map((f) => (
                      <option key={f.field_key} value={f.field_key}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={conditionOp}
                    onChange={(e) => setConditionOp(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value=">">Greater than (&gt;)</option>
                    <option value="<">Less than (&lt;)</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="==">Equals (==)</option>
                  </select>

                  <input
                    type="number"
                    value={conditionVal}
                    onChange={(e) => setConditionVal(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Action Row */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                  THEN Action (Hardware Actuator Relay)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select
                    value={targetActuatorId}
                    onChange={(e) => setTargetActuatorId(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {actuators.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={targetState}
                    onChange={(e) => setTargetState(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="1">Turn ON (State = 1)</option>
                    <option value="0">Turn OFF (State = 0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Send In-App Alert (Optional)</label>
                  <input
                    type="text"
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="e.g. Temperature spiked above threshold. Fan turned ON."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Save Automation Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create Scheduled Time Routine</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Routine Name</label>
                <input
                  type="text"
                  value={schedName}
                  onChange={(e) => setSchedName(e.target.value)}
                  placeholder="e.g. Morning Farm Irrigation Cycle"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Trigger Time (HH:MM)</label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Target Actuator Relay</label>
                <select
                  value={schedActuatorId}
                  onChange={(e) => setSchedActuatorId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                >
                  {actuators.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Action State</label>
                <select
                  value={schedState}
                  onChange={(e) => setSchedState(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="1">Turn ON (1)</option>
                  <option value="0">Turn OFF (0)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
