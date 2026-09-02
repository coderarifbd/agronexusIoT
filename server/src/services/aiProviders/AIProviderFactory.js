import { GeminiProvider } from "./GeminiProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { AnalyticalEngineProvider } from "./AnalyticalEngineProvider.js";

/**
 * AI Provider Factory with automatic resilient fallback
 */
export class AIProviderFactory {
  static getProvider() {
    const analyticalEngine = new AnalyticalEngineProvider();

    // Check for Gemini
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
      const gemini = new GeminiProvider(process.env.GEMINI_API_KEY.trim());
      return {
        name: "Google-Gemini (with AgroNexus Analytical Fallback)",
        async processQuery(options) {
          try {
            return await gemini.processQuery(options);
          } catch (err) {
            console.warn("⚠️ Gemini API invocation failed, falling back to Analytical Engine:", err.message);
            return await analyticalEngine.processQuery(options);
          }
        }
      };
    }

    // Check for OpenAI
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
      const openai = new OpenAIProvider(process.env.OPENAI_API_KEY.trim());
      return {
        name: "OpenAI (with AgroNexus Analytical Fallback)",
        async processQuery(options) {
          try {
            return await openai.processQuery(options);
          } catch (err) {
            console.warn("⚠️ OpenAI API invocation failed, falling back to Analytical Engine:", err.message);
            return await analyticalEngine.processQuery(options);
          }
        }
      };
    }

    // Default: Built-in zero-downtime Analytical Engine
    return analyticalEngine;
  }
}
