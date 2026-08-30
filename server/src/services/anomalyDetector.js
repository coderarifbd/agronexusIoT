import { db } from "../db.js";

export async function detectChannelAnomalies(channelId) {
  try {
    const rawRows = await db.all(`
      SELECT data_json, timestamp 
      FROM telemetry_data 
      WHERE channel_id = $1 
      ORDER BY id DESC LIMIT 100
    `, [channelId]);

    if (rawRows.length < 5) {
      return { anomalies: [], summary: "Insufficient telemetry data for statistical model." };
    }

    const fieldDataMap = {};

    for (const row of rawRows) {
      try {
        const parsed = typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === "number" && !isNaN(val)) {
            if (!fieldDataMap[key]) fieldDataMap[key] = [];
            fieldDataMap[key].push({ val, time: row.timestamp });
          }
        }
      } catch (e) {}
    }

    const anomalies = [];

    for (const [field, records] of Object.entries(fieldDataMap)) {
      if (records.length < 5) continue;
      const values = records.map(r => r.val);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const latest = records[0];
      const zScore = stdDev === 0 ? 0 : Math.abs((latest.val - mean) / stdDev);

      if (zScore > 2.2) {
        anomalies.push({
          field,
          currentValue: latest.val,
          normalMean: +mean.toFixed(2),
          normalRange: `${+(mean - 2 * stdDev).toFixed(1)} ? ${+(mean + 2 * stdDev).toFixed(1)}`,
          zScore: +zScore.toFixed(2),
          timestamp: latest.time,
          status: "CRITICAL_ANOMALY"
        });
      }
    }

    return {
      channelId,
      anomaliesFound: anomalies.length,
      anomalies,
      analyzedPoints: rawRows.length
    };
  } catch (err) {
    console.error("Anomaly detector error:", err);
    return { anomalies: [], error: err.message };
  }
}
