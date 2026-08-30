import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import { wsHub } from "./websocket.js";

export async function evaluateAutomationRules(channelId, telemetryPayload, deviceId) {
  try {
    const rules = await db.all(`
      SELECT id, name, description, conditions_json, actions_json, is_active, last_triggered
      FROM automation_rules
      WHERE channel_id = $1 AND is_active = 1
    `, [channelId]);

    for (const rule of rules) {
      let conditions = [];
      let actions = [];

      try {
        conditions = JSON.parse(rule.conditions_json);
        actions = JSON.parse(rule.actions_json);
      } catch (err) {
        continue;
      }

      if (!conditions.length) continue;

      let results = conditions.map(cond => {
        const val = telemetryPayload[cond.field_key];
        if (val === undefined || val === null) return false;

        const targetVal = Number(cond.value);
        const sensorVal = Number(val);

        switch (cond.operator) {
          case ">": return sensorVal > targetVal;
          case ">=": return sensorVal >= targetVal;
          case "<": return sensorVal < targetVal;
          case "<=": return sensorVal <= targetVal;
          case "==": return sensorVal === targetVal;
          case "!=": return sensorVal !== targetVal;
          default: return false;
        }
      });

      let ruleMatched = false;
      if (results.length === 1) {
        ruleMatched = results[0];
      } else {
        ruleMatched = results[0];
        for (let i = 1; i < results.length; i++) {
          const logicalOp = conditions[i].logical_op || "AND";
          if (logicalOp === "AND") {
            ruleMatched = ruleMatched && results[i];
          } else {
            ruleMatched = ruleMatched || results[i];
          }
        }
      }

      if (ruleMatched) {
        await executeRuleActions(rule, actions, channelId, telemetryPayload, deviceId);
      }
    }
  } catch (err) {
    console.error("Rule engine evaluation error:", err);
  }
}

async function executeRuleActions(rule, actions, channelId, telemetryPayload, deviceId) {
  await db.run("UPDATE automation_rules SET last_triggered = NOW() WHERE id = $1", [rule.id]);

  const channelInfo = await db.get(`
    SELECT c.id, c.name as channel_name, p.user_id, p.name as project_name 
    FROM channels c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = $1
  `, [channelId]);

  const userId = channelInfo ? channelInfo.user_id : null;

  for (const act of actions) {
    if (act.action_type === "ACTUATOR") {
      const actuatorId = act.target_id;
      const targetState = String(act.target_value);

      const existingActuator = await db.get("SELECT id, name, state FROM actuators WHERE id = $1", [actuatorId]);
      if (existingActuator && existingActuator.state !== targetState) {
        await db.run("UPDATE actuators SET state = $1, updated_at = NOW() WHERE id = $2", [targetState, actuatorId]);
        
        wsHub.broadcastActuatorChange(channelId, actuatorId, targetState, existingActuator.name);

        if (userId) {
          const log = {
            id: uuidv4(),
            user_id: userId,
            channel_id: channelId,
            device_id: deviceId,
            event_type: "AUTOMATION_ACTUATOR",
            description: `Automation rule "${rule.name}" set ${existingActuator.name} to ${targetState === '1' ? 'ON' : 'OFF'}`,
            timestamp: new Date().toISOString()
          };

          await db.run(`
            INSERT INTO activity_logs (id, user_id, channel_id, device_id, event_type, description)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [log.id, log.user_id, log.channel_id, log.device_id, log.event_type, log.description]);

          wsHub.broadcastActivityLog(log);
        }
      }
    } else if (act.action_type === "ALERT") {
      if (userId) {
        const alertId = uuidv4();
        const severity = act.severity || "warning";
        const title = `?? ${rule.name}`;
        const message = act.message || `Rule triggered for channel ${channelInfo?.channel_name || ""}`;

        await db.run(`
          INSERT INTO alerts (id, user_id, channel_id, device_id, rule_id, severity, title, message)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [alertId, userId, channelId, deviceId, rule.id, severity, title, message]);

        const alertObj = {
          id: alertId,
          user_id: userId,
          channel_id: channelId,
          severity,
          title,
          message,
          is_read: 0,
          created_at: new Date().toISOString()
        };

        wsHub.broadcastAlert(userId, alertObj);
      }
    }
  }
}
