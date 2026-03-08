/**
 * services/ai.service.js
 * 
 * Handles interaction with the Google Gemini API to generate custom quizzes.
 * Uses a strict system prompt to ensure the output is valid JSON matching
 * the database schema.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini (API key should be in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a complete quiz (metadata + questions) based on a topic string.
 * @param {string} topic - The user's requested topic (e.g. "Space Exploration")
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {Promise<Object>} - Formatted quiz data
 */
const generateAIQuiz = async (topic, difficulty = 'medium') => {
  // Ultra-latest models from screenshots and docs (Gemini 3 & 2.5)
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-1.5-pro"
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI Service]: Attempting with ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const systemPrompt = `
You are a professional Quiz Architect. Your task is to generate a high-quality, challenging, and educational quiz in JSON format based on the topic provided.

STRICT JSON STRUCTURE REQUIREMENTS:
{
  "quiz": {
    "title": "A catchy title for the quiz",
    "description": "A short engaging description",
    "difficulty": "${difficulty}",
    "tags": ["tag1", "tag2"],
    "timeLimit": 30
  },
  "questions": [
    {
      "text": "The question text?",
      "options": [
        {"text": "Option 1 text", "isCorrect": true},
        {"text": "Option 2 text", "isCorrect": false},
        {"text": "Option 3 text", "isCorrect": false},
        {"text": "Option 4 text", "isCorrect": false}
      ],
      "explanation": "Brief educational explanation of why the answer is correct.",
      "points": 10,
      "order": 0
    }
  ]
}

STRICT RULES:
1. Generate exactly 10 questions.
2. Every question MUST have exactly 4 options.
3. Exactly ONE option per question MUST have "isCorrect": true.
4. Do NOT include any markdown characters like \`\`\`json or text outside the JSON.
5. The output must be PARSABLE JSON.
6. Difficulty should be "${difficulty}".
7. Ensure questions are diverse and factually accurate.
`;

      const userPrompt = `Topic: ${topic}`;
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      const text = response.text();

      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);

    } catch (err) {
      lastError = err;
      console.warn(`[AI Model Fallback]: ${modelName} failed.`);
      console.dir(err, { depth: null }); // LOG FULL ERROR FOR DEBUGGING
      // If it's a quota error, we should keep trying other models
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.warn(`[AI Quota]: ${modelName} hit limit. Trying other models...`);
        continue;
      }
      continue;
    }
  }

  console.error('[AI Service Error]: All models failed.', lastError?.message);
  if (lastError?.message.includes('429') || lastError?.message.includes('quota')) {
    throw new Error('QUOTA_EXCEEDED');
  }
  throw new Error('Failed to generate AI quiz content.');
};

module.exports = { generateAIQuiz };
