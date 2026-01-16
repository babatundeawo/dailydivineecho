
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
    1. LinkedIn Post (2000-2500 characters):
       - TONE: Spellbinding, humanized, and profoundly captivating.
       - AUDIENCE: Global (professionals, beginners, young, old, leaders, followers).
       - STYLE: Use diverse literary devices—metaphors, euphemisms, light sarcasm where appropriate, and calculated exaggeration to drive points home. Carry the reader along like a master storyteller. 
       - CONSTRAINTS: NO unnecessary hyphens. Avoid robotic "AI-sounding" listicles. Use localized references from any relevant global location to add flavor, but keep the core message universal.
       - THEME: Accurate historical context blended with modern leadership and life lessons.

    2. Bible Verse & Reference:
       - CRITICAL: Select a verse that is DIRECTLY and INTIMATELY related to the themes of the historical event (e.g., if it's about a discovery, use a verse about light or hidden wisdom; if it's about a battle, use a verse about peace or courage).

    3. Image Overlay Text:
       - A very short, punchy summary (max 12 words) that captures the soul of the event. This will be the centerpiece of the visual.

    4. Twitter/X Resonance: Concise (max 260 characters).

    5. Image Prompt:
       - Technical details for EXTREME photorealism. Specify: "Kodak Portra 400 feel", "sharp 85mm lens details", "natural cinematic lighting", "highly detailed skin/surface textures", "realistic shadows", "no distortions".

    Return as JSON:
    {
      "eventTitle": "...",
      "eventDescription": "...",
      "imageOverlayText": "...",
      "bibleVerse": "...",
      "bibleReference": "...",
      "reflectionPrompt": "...",
      "linkedInPost": "...",
      "twitterPost": "...",
      "imagePrompt": "..."
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
  // Emphasizing extreme realism to the image model
  const prompt = `A masterwork of photography, hyper-realistic, 8k resolution. Subject: ${data.eventTitle}. Scene details: ${data.imagePrompt}. Lighting: Dramatic natural lighting, realistic atmosphere. Quality: National Geographic award-winning quality, sharp textures, perfectly realistic, no digital artifacts, NO TEXT on image.`;

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
