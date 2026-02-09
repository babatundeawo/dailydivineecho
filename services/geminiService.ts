
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

    WRITEUP STYLE REQUIREMENTS (CRITICAL):
    - Tone: Deeply human, expressive, energetic, slightly sarcastic where appropriate, and full of personality.
    - Literary Devices: Use metaphors, rhetorical questions, human exclamations (e.g., "Goodness!", "Imagine that!"), and witty asides.
    - ABSOLUTELY NO HYPHENS: Use commas, colons, or periods instead. Do not use the "-" character at all.
    - NO AI CLICHES: Avoid words like "tapestry", "delve", "beacon", "testament", "embark", or "realm".

    PLATFORM SPECIFIC CONSTRAINTS:
    1. LinkedIn: Target ~3000 characters. Professional yet deeply personal. High impact storytelling.
    2. Facebook: Target ~3000 characters. Conversational, community focused, and heartwarming.
    3. WeChat: Target ~3000 characters. Philosophical, detailed, and rich in context.
    4. Instagram: Target ~500 characters. Visual storytelling. 5 trending hashtags.
    5. Threads: Target ~500 characters. Quick thoughts, punchy, engagement focused. 5 hashtags.
    6. WhatsApp: Target ~500 characters. Direct, punchy, shareable wisdom. 5 hashtags.
    7. X (Twitter): Target ~280 characters. Extremely concise and viral. Exactly 3 trending hashtags.

    JSON STRUCTURE:
    {
      "eventTitle": "...",
      "eventDescription": "...",
      "imageOverlayText": "...", (MAX 4 WORDS)
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
