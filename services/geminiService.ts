
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { InspirationData, HistoricalRecommendation, HistoricalEra, ImpactCategory } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchHistoricalRecommendations = async (
  dateString: string, 
  count: number = 10,
  filter: { era: HistoricalEra, category: ImpactCategory } = { era: 'All', category: 'All' }
): Promise<HistoricalRecommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    Find exactly ${count} highly significant, intriguing, and world-changing events that happened on ${dateString} throughout history.
    Prioritize events with profound spiritual, scientific, or cultural resonance.
    Return them as a JSON array of objects with:
    - id: a unique short string
    - title: max 5 words
    - description: max 25 words (make it humanly intriguing)
    - year: the year it happened
    - era: the era it belongs to
    - category: the category of impact
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
    Historical Focus: ${dayInfo.selectedEvent.title} (${dayInfo.selectedEvent.year}) - ${dayInfo.selectedEvent.description}

    WRITEUP STRUCTURE (THE RESONANCE ARC):
    Every post must follow this 3-stage flow:
    1. THE SPARK: Retell the historical event with high energy and vivid metaphors.
    2. THE PIVOT: A natural "eureka" transition to modern life.
    3. THE LIGHT: A spiritual insight grounded in a specific Bible verse.

    CORE PHILOSOPHY:
    - Tone: Humanly enthusiastic, witty, and caffeinated.
    - ZERO HYPHEN POLICY: ABSOLUTELY NO HYPHENS ALLOWED (e.g. "long term" not "long-term").
    - NO AI CLICHES: No "tapestry", "delve", "beacon", "testament", etc.

    STRICT PLATFORM CONSTRAINTS (EXACT CHARACTER LIMITS):
    1. LinkedIn: Target exactly 3000 chars. (Professional brilliance)
    2. Facebook: Target exactly 3000 chars. (Community soul)
    3. WeChat: Target exactly 5000 chars. (In depth thought leadership)
    4. Instagram: Max 2200 chars. Include exactly 5 hashtags.
    5. Threads: Max 500 chars.
    6. X (Twitter): Max 280 chars. (Provocative and punchy)
    7. WhatsApp: Max 500 chars. (Relatable status wisdom)

    REQUIREMENTS:
    - Bible Verse: Select one INTIMATELY related.
    - Image Overlay Text: Max 8 words. No hyphens.
    - Image Prompt: Technical photorealistic details (35mm, cinematic). No text on image.

    Return as JSON:
    {
      "eventTitle": "...",
      "eventDescription": "...",
      "imageOverlayText": "...",
      "bibleVerse": "...",
      "bibleReference": "...",
      "reflectionPrompt": "...",
      "linkedInPost": "...", "linkedInHashtags": "...",
      "facebookPost": "...", "facebookHashtags": "...",
      "wechatPost": "...", "wechatHashtags": "...",
      "instagramPost": "...", "instagramHashtags": "...",
      "threadsPost": "...", "threadsHashtags": "...",
      "twitterPost": "...", "twitterHashtags": "...",
      "whatsappPost": "...", "whatsappHashtags": "...",
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
  const prompt = `A masterwork of photography, hyper-realistic, 8k. Subject: ${data.eventTitle}. Scene: ${data.imagePrompt}. Lighting: Dramatic cinematic natural light. Detail: Sharp textures, NO TEXT ON IMAGE.`;

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
