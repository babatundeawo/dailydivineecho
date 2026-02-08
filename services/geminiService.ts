
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { InspirationData, HistoricalRecommendation, HistoricalEra, ImpactCategory } from "../types";

const API_KEY = process.env.API_KEY || "";

export const fetchHistoricalRecommendations = async (
  dateString: string, 
  count: number = 10,
  filter: { era: HistoricalEra, category: ImpactCategory } = { era: 'All', category: 'All' }
): Promise<HistoricalRecommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const filterContext = `
    Era Filter: ${filter.era !== 'All' ? filter.era : 'Any historical era'}
    Category Filter: ${filter.category !== 'All' ? filter.category : 'Any impact category'}
  `;

  const prompt = `
    Find exactly ${count} highly significant historical or world-changing events that happened on ${dateString} throughout history.
    ${filterContext}
    Return them as a JSON array of objects with:
    - id: a unique short string
    - title: max 5 words
    - description: max 25 words (make it humanly intriguing and slightly dramatic)
    - year: the year it happened
    - era: the era it belongs to
    - category: the category of impact
    
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
    Historical Focus: ${dayInfo.selectedEvent.title} (${dayInfo.selectedEvent.year}) - ${dayInfo.selectedEvent.description}

    GENERATE SEVEN DISTINCT NARRATIVE VERSIONS:
    CORE PHILOSOPHY:
    - Spiritual Undertone: Every post must weave in a spiritual truth or perspective derived from Christian scriptures.
    - Tone: Humanly enthusiastic, witty, and profoundly engaging. Use human euphemisms, light sarcasm, and vivid metaphors. 
    - NO ROBOTIC PHRASING: Avoid words like "delve", "tapestry", "embark", "testament", "realm", "beacon", or "unfold". Speak like a brilliant, slightly caffeinated visionary who is obsessed with history and God's providence.
    - ZERO HYPHEN POLICY: ABSOLUTELY NO HYPHENS ALLOWED (e.g., use "long term" instead of "long-term", "heart felt" instead of "heart-felt"). If a word requires a hyphen, find a better word or use a space. This is strict.
    - Natural Conversational Flow: The transition from history to scripture must feel like a "eureka" moment, not a forced lesson.

    STRICT CHARACTER LIMITS (INCLUDE HASHTAGS IN COUNT):
    1. LinkedIn: < 3000 chars. (Professional brilliance meets spiritual depth)
    2. Facebook: < 3000 chars. (Community connection with a human soul)
    3. WeChat: < 5000 chars. (In-depth thought leadership with a spiritual heartbeat)
    4. Instagram: < 2200 chars. (Visual storytelling style. MAX 5 hashtags)
    5. Threads: < 500 chars. (Punchy, fast paced insight)
    6. X (Twitter): < 280 chars. (Provocative and viral spiritual resonance)
    7. WhatsApp: < 500 chars. (Relatable, personal status style wisdom)

    REQUIREMENTS:
    - Bible Verse: Select one INTIMATELY related to the historical themes.
    - Image Overlay Text: Max 8 words. No hyphens.
    - Image Prompt: Technical photorealistic details (35mm, cinematic). NO TEXT on the image itself.

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
