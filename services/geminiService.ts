import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMatchInsight = async (homeTeam: string, awayTeam: string, competition: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Provide a short, punchy, professional sports analyst prediction (max 3 sentences) for a rugby match between ${homeTeam} and ${awayTeam} in the ${competition}. Focus on key strengths or recent form. Do not start with "Here is a prediction". Just give the insight.`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text || "Insight currently unavailable.";
  } catch (error) {
    console.error("Error fetching match insight:", error);
    return "Unable to retrieve AI insights at this moment.";
  }
};
