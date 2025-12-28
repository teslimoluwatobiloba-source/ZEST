
import { GoogleGenAI, Type } from "@google/genai";
import { ExcitementIdea } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateBoredomBustingIdeas(mood: string): Promise<ExcitementIdea[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 6 unique, highly exciting things to do for someone who is feeling ${mood}. 
    Each idea should be detailed and creative.
    Mood context: ${mood}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['creative', 'active', 'chill', 'educational', 'gaming'] },
            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
          },
          required: ["title", "description", "category", "difficulty"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateVisualForIdea(idea: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A vibrant, high-energy concept art illustration for the following activity: ${idea}. Cinematic lighting, 8k resolution, modern digital art style.` }]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return 'https://picsum.photos/800/600';
}
