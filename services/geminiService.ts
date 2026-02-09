
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

    WRITEUP STRUCTURE (THE RESONANCE ARC):
    Every platform post must follow this 3 stage flow:
    1. THE SPARK: Retell the historical event with high energy and vivid metaphors.
    2. THE PIVOT: A natural conversational bridge to modern life.
    3. THE LIGHT: A spiritual insight grounded in a specific Bible verse.

    CORE PHILOSOPHY:
    - Tone: Humanly enthusiastic, witty, and caffeinated.
    - ZERO HYPHEN POLICY: ABSOLUTELY NO HYPHENS ALLOWED.
    - NO AI CLICHES: Do not use "tapestry", "delve", "beacon", "testament", "embark", or "realm".

    STRICT PLATFORM CONSTRAINTS:
    1. LinkedIn: Target exactly 3000 chars.
    2. Facebook: Target exactly 3000 chars.
    3. WeChat: Target exactly 5000 chars.
    4. Instagram: Max 2200 chars. Include exactly 5 hashtags.
    5. Threads: Max 500 chars.
    6. X (Twitter): Max 280 chars.
    7. WhatsApp: Max 500 chars.

    REQUIREMENTS:
    - Bible Verse: Select one INTIMATELY related to the themes of ${dayInfo.selectedEvent.title}.
    - Image Overlay Text: ABSOLUTELY MAX 4 WORDS. This text will be centered and massive. It must be a powerful "Echo" of the event.
    - Image Prompt: Detailed, photorealistic, cinematic (35mm lens, f/1.8). No text on image. Focus on the core imagery of the event: ${dayInfo.selectedEvent.title}.

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
