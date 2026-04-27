const { GoogleGenAI } = require('@google/genai');

/** Model id must exist for `generateContent` on the API version used by @google/genai (v1beta). */
const GEMINI_FLASH_MODEL = 'gemini-3-flash-preview';

// The system prompt is defined strictly at initialization so the user cannot override it via standard messages.
const systemInstruction = `
You are an AI assistant for BacPrep Hub, an Algerian Baccalaureate preparation platform.
Strict Rules:
1. ONLY respond to questions related to Mathematics and Physics at the Algerian Terminale (high school senior) curriculum level.
2. If a student asks about any other subject or topic, politely decline and DO NOT provide any hints on how to bypass this restriction.
3. Provide hints and guidance rather than direct, complete answers. Encourage the student to think for themselves.
4. Detect the student's language and respond in that same language (e.g., if they ask in English, respond in English; if in Arabic, respond in Arabic; if in French, respond in French).
5. Maintain an encouraging, academic, and age-appropriate tone.
`;

const getChatbotResponse = async (message) => {
  // Initialize the new SDK
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: message,
    config: {
      systemInstruction: systemInstruction
    }
  });

  const text = response?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty or invalid model response');
  }
  return text;
};

/**
 * Generates brief, personalized study recommendations based on weakest chapters.
 */
const getStudyRecommendations = async (weakestChapters) => {
  if (!weakestChapters || weakestChapters.length === 0) {
    return "Great job! You don't have any specific weak spots right now. Keep practicing all subjects to maintain your level.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const chapterList = weakestChapters.map(c => `${c.chapterName} (${c.averagePercentage}% average)`).join(', ');
  
  const prompt = `
    Student performance data: Their weakest chapters are: ${chapterList}.
    Action: Provide a 2-3 sentence encouraging study recommendation in French, Arabic, or English (detect based on inputs/language of the chapters).
    Focus: Tell them where to focus first and give one specific study tip (e.g. review theory, do more MCQs, etc.).
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'You are a study motivator for Algerian Baccalaureate students. Be concise, professional, and encouraging.'
    }
  });

  const text = response?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty or invalid model response');
  }
  return text;
};

module.exports = { getChatbotResponse, getStudyRecommendations };
