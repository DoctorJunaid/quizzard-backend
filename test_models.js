const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
    try {
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
        console.log("Available Models:");
        result.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } catch (err) {
        // If listModels isn't directly on the model, it might be on a different client or version
        console.error("Error listing models:", err.message);

        // Fallback: try to just check the standard names via generateContent with a tiny prompt
        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("hi");
                console.log(`[SUCCESS] Model '${m}' is available.`);
            } catch (e) {
                console.log(`[FAILED] Model '${m}': ${e.message}`);
            }
        }
    }
}

list();
