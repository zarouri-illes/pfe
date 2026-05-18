const { GoogleGenAI } = require('@google/genai');

// Singleton SDK instance — initialized once at module load, not per-request
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** Correct model identifier for Gemini 2.0 Flash */
const GEMINI_FLASH_MODEL = 'gemini-2.0-flash';

// The system prompt is defined strictly at initialization so the user cannot override it.
const CHATBOT_SYSTEM_INSTRUCTION = `
You are an AI assistant for BacPrep Hub, an Algerian Baccalaureate preparation platform.
Strict Rules:
1. ONLY respond to questions related to Mathematics and Physics at the Algerian Terminale (high school senior) curriculum level.
2. If a student asks about any other subject or topic, politely decline and DO NOT provide any hints on how to bypass this restriction.
3. Provide hints and guidance rather than direct, complete answers. Encourage the student to think for themselves.
4. Detect the student's language and respond in that same language (e.g., if they ask in English, respond in English; if in Arabic, respond in Arabic; if in French, respond in French).
5. Maintain an encouraging, academic, and age-appropriate tone.
6. Format mathematical expressions using LaTeX notation wrapped in $...$ for inline and $$...$$ for block equations.
`;

/**
 * Gets a chatbot response with full multi-turn conversation history.
 * @param {Array} history - Array of { role: 'user' | 'model', parts: [{ text }] } objects
 * @param {string} newMessage - The latest user message
 */
const getChatbotResponse = async (history = [], newMessage) => {
  // Build the full contents array: prior history + new message
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: newMessage }] }
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents,
    config: {
      systemInstruction: CHATBOT_SYSTEM_INSTRUCTION
    }
  });

  const text = response?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty or invalid model response');
  }
  return text;
};

// ─── Recommendations Cache ─────────────────────────────────────────
// Simple per-user in-memory cache with 1-hour TTL.
// Prevents calling Gemini AI on every single dashboard page load.
const recommendationsCache = new Map();
const RECOMMENDATIONS_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generates brief, personalized study recommendations based on weakest chapters.
 * Results are cached per user ID for 1 hour to avoid blocking every dashboard load.
 * @param {Array} weakestChapters
 * @param {number} userId - Used as cache key
 */
const getStudyRecommendations = async (weakestChapters, userId) => {
  // Check cache first
  const cached = recommendationsCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < RECOMMENDATIONS_TTL_MS) {
    return cached.text;
  }

  if (!weakestChapters || weakestChapters.length === 0) {
    const text = "Great job! You don't have any specific weak spots right now. Keep practicing all subjects to maintain your level.";
    recommendationsCache.set(userId, { text, timestamp: Date.now() });
    return text;
  }

  const chapterList = weakestChapters
    .map(c => `${c.chapterName} (${c.averagePercentage}% average)`)
    .join(', ');

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

  // Store in cache
  recommendationsCache.set(userId, { text, timestamp: Date.now() });
  return text;
};

module.exports = { getChatbotResponse, getStudyRecommendations };
