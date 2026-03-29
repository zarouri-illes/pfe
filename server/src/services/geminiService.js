const { GoogleGenAI } = require('@google/genai');

// The system prompt is defined strictly at initialization so the user cannot override it via standard messages.
const systemInstruction = `
You are an AI assistant for BacPrep Hub, an Algerian Baccalaureate preparation platform.
Strict Rules:
1. ONLY respond to questions related to Mathematics and Physics at the Algerian Terminale (high school senior) curriculum level.
2. If a student asks about any other subject or topic, politely decline and DO NOT provide any hints on how to bypass this restriction.
3. Provide hints and guidance rather than direct, complete answers. Encourage the student to think for themselves.
4. Detect the student's language and respond in either French or Arabic accordingly.
5. Maintain an encouraging, academic, and age-appropriate tone.
`;

const getChatbotResponse = async (message) => {
  // Initialize the new SDK
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: systemInstruction
    }
  });

  return response.text;
};

module.exports = { getChatbotResponse };
