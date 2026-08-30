import { db } from "../db.js";

export async function applySensorCalibration(channelId, rawData) {
  if (!rawData || typeof rawData !== "object") return rawData;
  const processed = { ...rawData };

  try {
    const calibrations = await db.all(`
      SELECT field_key, points_json, slope, intercept, is_active 
      FROM sensor_calibrations 
      WHERE channel_id = $1 AND is_active = 1
    `, [channelId]);

    for (const calib of calibrations) {
      const field = calib.field_key;
      if (processed[field] !== undefined && typeof processed[field] === "number") {
        const rawVal = processed[field];
        const calibratedVal = +(calib.slope * rawVal + calib.intercept).toFixed(2);
        processed[field] = calibratedVal;
      }
    }
  } catch (err) {
    console.error("Error applying calibration:", err);
  }

  return processed;
}

export function computeCalibrationLinearFit(points) {
  if (!points || points.length < 2) {
    return { slope: 1.0, intercept: 0.0 };
  }

  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (const pt of points) {
    const x = Number(pt.reading);
    const y = Number(pt.buffer);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 1.0, intercept: 0.0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope: +slope.toFixed(4),
    intercept: +intercept.toFixed(4)
  };
}
