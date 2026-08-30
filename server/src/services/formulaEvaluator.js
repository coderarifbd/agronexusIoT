import { create, all } from "mathjs";
import { db } from "../db.js";

const math = create(all);
const limitedEvaluate = math.evaluate;

export async function evaluateCalculatedFields(channelId, dataPayload) {
  if (!dataPayload || typeof dataPayload !== "object") return dataPayload;
  const result = { ...dataPayload };

  try {
    const calcFields = await db.all(`
      SELECT target_field_key, formula 
      FROM calculated_fields 
      WHERE channel_id = $1 AND is_active = 1
    `, [channelId]);

    for (const cf of calcFields) {
      try {
        const computed = limitedEvaluate(cf.formula, result);
        if (typeof computed === "number" && !isNaN(computed) && isFinite(computed)) {
          result[cf.target_field_key] = +computed.toFixed(2);
        }
      } catch (formulaErr) {}
    }
  } catch (err) {
    console.error("Error evaluating calculated fields:", err);
  }

  return result;
}
