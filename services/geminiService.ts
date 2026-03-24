
import { GoogleGenAI, Type } from "@google/genai";
import { SeverityLevel, GeminiAnalysisResult } from '../types';

export const analyzeIncident = async (incident: string, location: string): Promise<GeminiAnalysisResult> => {
  if (!process.env.API_KEY) {
    // Fallback if no API key is present
    return {
      formattedMessage: `ALERTA: ${incident} en ${location}`,
      severity: SeverityLevel.INFO
    };
  }

  try {
    // Initialize the AI client using the provided API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analiza el siguiente reporte de incidente y ubicación.
      Incidente: "${incident}"
      Ubicación: "${location}"
      
      Tareas:
      1. Determina la severidad (CRITICAL, WARNING, o INFO). Incendios, robos activos o accidentes graves son CRITICAL. Tráfico o clima moderado son WARNING. Noticias generales son INFO.
      2. Redacta un mensaje de notificación corto, urgente y profesional (máximo 15 palabras).
    `;

    // Use gemini-3-flash-preview for basic text analysis and classification tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: {
              type: Type.STRING,
              description: "The severity level of the incident: CRITICAL, WARNING, or INFO"
            },
            formattedMessage: {
              type: Type.STRING,
              description: "A short, urgent notification message"
            }
          },
          required: ["severity", "formattedMessage"]
        }
      }
    });

    // Extract text output using the .text property as per guidelines
    const result = JSON.parse(response.text || "{}");
    
    return {
      formattedMessage: result.formattedMessage || `${incident} en ${location}`,
      severity: result.severity as SeverityLevel || SeverityLevel.INFO
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      formattedMessage: `ALERTA: ${incident} en ${location}`,
      severity: SeverityLevel.INFO
    };
  }
};
