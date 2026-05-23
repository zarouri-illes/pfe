const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function buildOfflineRecommendations(weakestChapters) {
  if (!weakestChapters?.length) return null;
  const names = weakestChapters
    .slice(0, 3)
    .map((c) => c.chapterName)
    .join(', ');
  return `Priorisez ${names}. Revoyez la théorie, puis refaites des QCM sur ces chapitres pour progresser.`;
}

function createGroqError(message, providerStatus) {
  const err = new Error(message);
  err.isGroqError = true;
  err.providerStatus = providerStatus;
  err.isProviderUnavailable =
    providerStatus === 429 ||
    providerStatus === 402 ||
    providerStatus === 403 ||
    /rate limit|quota|insufficient|capacity/i.test(String(message));
  // Do not use HTTP 402 here — BacPrep uses 402 for student credit checks
  err.status = err.isProviderUnavailable ? 503 : 502;
  return err;
}

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
 * Converts frontend Gemini-style history to OpenAI message roles.
 */
function historyToMessages(history = []) {
  return history
    .map((turn) => {
      const content = turn.parts?.[0]?.text ?? turn.content ?? '';
      if (!content.trim()) return null;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user';
      return { role, content };
    })
    .filter(Boolean);
}

async function callGroq(systemInstruction, messages, { maxTokens = 2048 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemInstruction }, ...messages],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errMsg = data?.error?.message || `Groq API error (${res.status})`;
    throw createGroqError(errMsg, res.status);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty or invalid model response');
  }
  return text;
}

const getChatbotResponse = async (history = [], newMessage) => {
  const messages = historyToMessages(history);
  messages.push({ role: 'user', content: newMessage });
  return callGroq(CHATBOT_SYSTEM_INSTRUCTION, messages);
};

const recommendationsCache = new Map();
const RECOMMENDATIONS_TTL_MS = 60 * 60 * 1000;

const getStudyRecommendations = async (weakestChapters, userId) => {
  const cached = recommendationsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < RECOMMENDATIONS_TTL_MS) {
    return cached.text;
  }

  if (!weakestChapters || weakestChapters.length === 0) {
    const text =
      "Great job! You don't have any specific weak spots right now. Keep practicing all subjects to maintain your level.";
    recommendationsCache.set(userId, { text, timestamp: Date.now() });
    return text;
  }

  const chapterList = weakestChapters
    .map((c) => `${c.chapterName} (${c.averagePercentage}% average)`)
    .join(', ');

  const prompt = `
    Student performance data: Their weakest chapters are: ${chapterList}.
    Action: Provide a 2-3 sentence encouraging study recommendation in French, Arabic, or English (detect based on inputs/language of the chapters).
    Focus: Tell them where to focus first and give one specific study tip (e.g. review theory, do more MCQs, etc.).
  `;

  try {
    const text = await callGroq(
      'You are a study motivator for Algerian Baccalaureate students. Be concise, professional, and encouraging.',
      [{ role: 'user', content: prompt }],
      { maxTokens: 300 }
    );
    recommendationsCache.set(userId, { text, timestamp: Date.now() });
    return text;
  } catch (error) {
    if (error.isProviderUnavailable) {
      console.warn(
        'Groq API unavailable (rate limit or quota) — using offline recommendations. Check https://console.groq.com'
      );
      return buildOfflineRecommendations(weakestChapters);
    }
    throw error;
  }
};

module.exports = { getChatbotResponse, getStudyRecommendations, buildOfflineRecommendations };
