import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSituation = async (note: string, severity: string): Promise<AIAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this emergency SOS note: "${note}". Severity reported: ${severity}.
      Provide a JSON assessment including:
      1. riskLevel (Low, Medium, High, Extreme)
      2. recommendedGear (Array of strings, e.g., "Boat", "Rope", "First Aid", "Flashlight")
      3. hazards (Array of strings, e.g., "Hypothermia", "Electrocution", "Dehydration")`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            recommendedGear: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            hazards: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for offline/error
    return {
      riskLevel: "Unknown",
      recommendedGear: ["Standard Rescue Kit"],
      hazards: ["Proceed with caution"]
    };
  }
};