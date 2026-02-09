
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { InspirationData, HistoricalRecommendation, HistoricalEra, ImpactCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const fetchHistoricalRecommendations = async (
  dateString: string, 
  count: number = 10
): Promise<HistoricalRecommendation[]> => {
  const prompt = `
    Find exactly ${count} highly significant, intriguing, and world changing events that happened on ${dateString} throughout history.
    Prioritize events with profound spiritual, scientific, or cultural resonance.
    Return them as a JSON array of objects with:
    - id: a unique short string
    - title: max 5 words
    - description: max 25 words (make it humanly intriguing and evocative)
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
  const prompt = `
    The year is 2026. Date: ${dayInfo.dateString}, 2026.
    Historical Focus: ${dayInfo.selectedEvent.title} (${dayInfo.selectedEvent.year}) - ${dayInfo.selectedEvent.description}

    CONTENT STRUCTURE (THE THREE PILLARS):
    Every single platform post (LinkedIn, FB, WeChat, etc.) MUST weave through these three specific phases:
    1. THE SPARK (History): Retell the historical node with vivid, cinematic energy. Make us feel the era and the moment.
    2. THE RESONANCE (Universal Wisdom): Extract a profound life lesson for EVERYONE. This must be inclusive: old or young, professional or artisan, master or servant. Address the universal human condition—how this history relates to our shared struggles and triumphs today.
    3. THE LIGHT (Spiritual Essence): A deep Christian insight that bridges the wisdom to the Divine. Anchor this with the specific Bible verse selected.

    CORE PHILOSOPHY:
    - Tone: Humanly enthusiastic, soulful, and witty.
    - ZERO HYPHEN POLICY: ABSOLUTELY NO HYPHENS ALLOWED (Use commas or colons).
    - NO AI CLICHES: Do not use "tapestry", "delve", "beacon", "testament", "embark", or "realm".

    PLATFORM CONSTRAINTS:
    - LinkedIn/FB/WeChat: Long-form storytelling (~3000-5000 chars).
    - Instagram/Threads/WhatsApp/Twitter: Short, punchy highlights.

    REQUIREMENTS:
    - Bible Verse: Select one INTIMATELY related to the themes of the historical event.
    - Image Overlay Text: MAX 4 WORDS. This text will be centered and massive.
    - Image Prompt: Breathtaking, photorealistic, cinematic (clear, bright, and vibrant).

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
  data: InspirationData
): Promise<string> => {
  const prompt = `A breathtaking masterwork of photorealism, award-winning photography, National Geographic style. Subject: ${data.eventTitle}. ${data.imagePrompt}. Lighting: Vibrant, luminous, and bright natural light. Ensure sharp clarity, vivid colors, and visible details even in shadows. NO TEXT ON IMAGE. 8k resolution, cinematic depth of field, clear and bright atmosphere.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "4:5" } }
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
