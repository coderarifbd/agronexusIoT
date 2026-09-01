import { db } from "../db.js";
import { applySensorCalibration } from "./calibrationEngine.js";
import { evaluateCalculatedFields } from "./formulaEvaluator.js";
import { evaluateAutomationRules } from "./ruleEngine.js";
import { wsHub } from "./websocket.js";

class SimulatorService {
  constructor() {
    this.interval = null;
    this.isRunning = false;
    this.step = 0;
  }

  start() {
    if (this.interval) clearInterval(this.interval);
    this.isRunning = true;
    this.interval = setInterval(() => this.tick(), 4000);
    console.log("? Virtual IoT Simulator enabled by user request");
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.isRunning = false;
    console.log("⏹ Virtual IoT Simulator stopped");
  }

  async tick() {
    if (!this.isRunning) return;
    // Only runs if explicitly started by user
  }
}

export const simulator = new SimulatorService();
