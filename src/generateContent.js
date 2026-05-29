require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function generateCarouselContent(newsItems) {
    if (!process.env.GEMINI_API_KEY) {
        console.error("Missing GEMINI_API_KEY in .env");
        return null;
    }
    
    if (newsItems.length === 0) {
        console.log("No new news items to process.");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Send the top 15 newest items to Gemini so it has choices
    const prompt = `You are an expert Instagram content creator for a tech/AI page (@ya5h.ai).
I have the following recent AI news items:
${JSON.stringify(newsItems.slice(0, 15))}

Task 1: Select the top 3 or 4 most exciting and important news items.
Task 2: Format them into data for Instagram carousel slides.
Slide 1 should be a hook/title slide (e.g., "Top AI News Today"). For slide 1, leave "content" empty.
Slides 2 to N should each cover one of the selected news items. Give a short, punchy title and a 2-3 sentence engaging description for each.
The "tag" should be a short 1-2 word badge (like "AI NEWS", "NEW TOOL", "UPDATE").
Task 3: Write an engaging Instagram caption including emojis and relevant hashtags.

Respond STRICTLY with valid JSON matching this structure:
{
  "caption": "Your highly engaging instagram caption here...",
  "selectedLinks": ["url1", "url2"],
  "slides": [
    { "tag": "DAILY UPDATE", "title": "Top AI News You Missed", "content": "" },
    { "tag": "OPENAI", "title": "GPT-5 is coming", "content": "The details..." }
  ]
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const resultText = response.text();
        return JSON.parse(resultText);
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        return null;
    }
}

module.exports = { generateCarouselContent };
