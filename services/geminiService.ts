
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { InspirationData, HistoricalRecommendation } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchHistoricalRecommendations = async (
  dateString: string, 
  count: number = 10,
  excludeTitles: string[] = []
): Promise<HistoricalRecommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const exclusionContext = excludeTitles.length > 0 
    ? `\nDO NOT include these events: ${excludeTitles.join(', ')}.` 
    : '';

  const prompt = `
    Find exactly ${count} highly significant historical or world-changing events that happened on ${dateString} throughout history.${exclusionContext}
    Return them as a JSON array of objects with:
    - id: a unique short string
    - title: max 5 words
    - description: max 12 words
    - year: the year it happened
    
    Focus on monumental global shifts or discoveries with universal resonance.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    throw new Error("Failed to fetch historical archives.");
  }
};

export const fetchDailyInspiration = async (dayInfo: { 
  current: number;
  total: number;
  formatted: string; 
  dateString: string; 
  userName: string;
  selectedEvent: HistoricalRecommendation;
}): Promise<InspirationData> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    The year is 2026. Date: ${dayInfo.dateString}, 2026.
    Selected Event: ${dayInfo.selectedEvent.title} (${dayInfo.selectedEvent.year})

    TASKS:
    1. Expand into a FULL-LENGTH LinkedIn post (2000-2500 characters).
       TONE: Human-centered, professional, conversational, and resonant.
       STYLE: Infuse a distinctive Nigerian conversational flavor—expressed through warmth, rhythm, and familiarity (e.g., "You see, my friend," "The elders say..."). Use metaphors and storytelling to carry the reader. Do not reference specific Nigerian locations.
       CONTENT: Connect the historical event ${dayInfo.selectedEvent.title} to modern leadership, resilience, or personal growth. Make it globally relevant for professionals, educators, and students.
    2. Provide a concise Twitter/X post (max 260 characters).
    3. Provide a related Bible verse and reference (theme: resilience/legacy).
    4. Provide a universal reflection prompt (max 25 words).
    5. Provide a 35-word cinematic image prompt focusing on high-detail realism. Ensure the scene is bright, luminous, and visually striking. NO TEXT.

    Return as JSON:
    {
      "eventTitle": "...",
      "eventDescription": "...",
      "bibleVerse": "...",
      "bibleReference": "...",
      "reflectionPrompt": "...",
      "linkedInPost": "...",
      "twitterPost": "...",
      "imagePrompt": "..."
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  try {
    const rawData = JSON.parse(response.text || "{}");
    return {
      ...rawData,
      dayCount: dayInfo.formatted,
      dayNumber: dayInfo.current,
      totalDays: dayInfo.total,
      dateString: `${dayInfo.dateString}, 2026`,
      userName: dayInfo.userName
    };
  } catch (e) {
    throw new Error("Failed to weave the narrative threads.");
  }
};

export const generateInspirationalImage = async (
  data: InspirationData, 
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4"
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Hyper-realistic, bright, and vibrant masterpiece. Subject: ${data.eventTitle}. Vision: ${data.imagePrompt}. Aesthetic: High luminosity, golden hour daylight, crystal clear sharpness, 8K resolution. NO TEXT, NO LOGOS. The image should be extremely bright and visible.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio } }
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Visual manifestation failed.");
};

export const generateTTS = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio synthesis failed.");
  return base64Audio;
};
