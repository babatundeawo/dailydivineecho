
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
       - CONTENT: Blend the historical legacy of ${dayInfo.selectedEvent.title} with deep life reflections and a modern Christian perspective (faith, providence, resilience). Speak to everyone from beginners to veterans.
       - STYLE: Use literary devices (metaphor, euphemism, sarcasm, exaggeration). NO unnecessary hyphens. Avoid robotic lists.

    2. Twitter/X Post (Max 260 characters):
       - STYLE: Same depth as LinkedIn but punchy. Humanized, captivating, and carrying a Christian/life-wisdom heartbeat.
    
    3. Platform Hashtags:
       - Provide "linkedInHashtags": 6-8 tags (leadership, life-lessons, faith, 2026-trends).
       - Provide "twitterHashtags": 4-5 trending/high-reach tags for X.

    4. Bible Verse & Reference: Select a verse INTIMATELY related to the historical themes.

    5. Image Overlay Text: Short, punchy summary (max 10 words) for the hero visual.

    6. Image Prompt:
       - Technical details for EXTREME photorealism (35mm f/1.4, cinematic natural light, sharp textures). Ensure NO TEXT in the image.

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
      "linkedInHashtags": "...",
      "twitterHashtags": "...",
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
  const prompt = `A masterwork of photography, hyper-realistic, 8k. Subject: ${data.eventTitle}. Scene: ${data.imagePrompt}. Lighting: Dramatic cinematic natural light. Detail: Sharp textures, award-winning clarity, NO TEXT ON IMAGE.`;

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
