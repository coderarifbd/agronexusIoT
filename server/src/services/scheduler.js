import { db } from "../db.js";
import { wsHub } from "./websocket.js";
import { v4 as uuidv4 } from "uuid";

class SchedulerService {
  constructor() {
    this.intervalId = null;
  }

  start() {
    this.intervalId = setInterval(() => this.tick(), 15000);
    console.log("? AgroNexus Scheduler Service active");
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async tick() {
    try {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMins = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const currentDay = String(now.getDay());

      const scheduled = await db.all(`
        SELECT s.*, a.name as actuator_name, a.channel_id, c.project_id, p.user_id
        FROM scheduled_rules s
        JOIN actuators a ON s.target_actuator_id = a.id
        JOIN channels c ON s.channel_id = c.id
        JOIN projects p ON c.project_id = p.id
        WHERE s.is_active = 1
      `);

      for (const item of scheduled) {
        if (item.time_schedule === currentTimeStr) {
          if (item.days_of_week !== "ALL" && !item.days_of_week.includes(currentDay)) {
            continue;
          }

          if (item.last_run) {
            const lastRunDate = new Date(item.last_run);
            const diffSeconds = (now - lastRunDate) / 1000;
            if (diffSeconds < 55) continue;
          }

          const targetState = String(item.target_value);
          await db.run("UPDATE actuators SET state = $1, updated_at = NOW() WHERE id = $2", [targetState, item.target_actuator_id]);
          await db.run("UPDATE scheduled_rules SET last_run = NOW() WHERE id = $1", [item.id]);

          wsHub.broadcastActuatorChange(item.channel_id, item.target_actuator_id, targetState, item.actuator_name);

          const logId = uuidv4();
          const description = `Scheduled Task "${item.name}" executed: turned ${item.actuator_name} ${targetState === '1' ? 'ON' : 'OFF'}`;
          
          await db.run(`
            INSERT INTO activity_logs (id, user_id, channel_id, event_type, description)
            VALUES ($1, $2, $3, $4, $5)
          `, [logId, item.user_id, item.channel_id, "SCHEDULE_EXECUTE", description]);

          wsHub.broadcastActivityLog({
            id: logId,
            user_id: item.user_id,
            channel_id: item.channel_id,
            event_type: "SCHEDULE_EXECUTE",
            description,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Scheduler tick error:", err);
    }
  }
}

export const scheduler = new SchedulerService();
