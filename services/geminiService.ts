
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
    Historical Focus: ${dayInfo.selectedEvent.title} (${dayInfo.selectedEvent.year})

    TASKS:
    1. Narrative Group 1 (LinkedIn/Facebook/Wechat): 
       - Long-form master storytelling (2000-2500 characters). 
       - Humanized tone, blending historical legacy with deep life wisdom and a modern Christian perspective. 
       - Use metaphors, sarcasm, and exaggeration to keep all audiences spellbound.

    2. Narrative Group 2 (Instagram/Threads): 
       - Visual-first caption (400-600 characters). 
       - Punchy, aesthetic, emoji-rich, focusing on the "Vibe" of the visual and the spiritual takeaway.

    3. Narrative Group 3 (X/WhatsApp): 
       - Viral/Status style (Max 260 characters). 
       - Provocative, concise, and high-resonance.

    4. Hashtags: Provide specific trending hashtag strings for each group.

    5. Bible Verse: Select a verse INTIMATELY related to the historical themes.

    6. Image Overlay Text: Short, punchy summary (max 8 words) for the hero visual.

    7. Image Prompt:
       - Technical details for EXTREME photorealism (Kodak Portra, 35mm f/1.4 lens, cinematic natural light, sharp textures). NO TEXT in the image.

    Return as JSON:
    {
      "eventTitle": "...",
      "eventDescription": "...",
      "imageOverlayText": "...",
      "bibleVerse": "...",
      "bibleReference": "...",
      "reflectionPrompt": "...",
      "linkedInPost": "...",
      "linkedInHashtags": "...",
      "instaThreadsPost": "...",
      "instaHashtags": "...",
      "twitterWhatsAppPost": "...",
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
