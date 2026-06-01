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

    const theme = process.env.POST_THEME || 'news';
    let prompt = '';
    
    if (theme === 'tools') {
        prompt = `You are an expert Instagram content creator for a tech/AI page (@ya5h.ai).
I have the following recent new software and tool launch items:
${JSON.stringify(newsItems.slice(0, 15))}

Task 1: Select the top 3 or 4 most exciting new AI tools, platforms, or content creator apps.
CRITICAL RULE: Do NOT select or write about image-generation, art-generation, or visual design tools that require showcasing a visual result or "image prompt" to be understood. Focus purely on software, utilities, video/audio editors, writing assistants, developer tools, and automation builders that can be described effectively with text alone.
Task 2: Format them into data for Instagram carousel slides.
Slide 1 should be a hook/title slide (e.g., "Trending AI & Tech Tools" or "Must-Try Tools This Week" or "Game-Changing AI Tools"). For slide 1, leave "content" empty.
Slides 2 to N should each cover one of the selected tools. Give a short, punchy title and a 2-3 sentence engaging description focusing on how it helps creators/builders.
The "tag" should be a short 1-2 word badge (like "AI TOOL", "CREATOR", "AUTOMATION", "DESIGN", "UTILITY").
Task 3: Write an engaging Instagram caption including emojis, how to try them, and relevant hashtags.

Respond STRICTLY with valid JSON matching this structure:
{
  "caption": "Your highly engaging instagram caption here...",
  "selectedLinks": ["url1", "url2"],
  "slides": [
    { "tag": "DAILY UPDATE", "title": "Top Tech & AI Tools Today", "content": "" },
    { "tag": "CREATOR", "title": "New Tool for Video Editing", "content": "The details..." }
  ]
}`;
    } else {
        prompt = `You are an expert Instagram content creator for a tech/AI page (@ya5h.ai).
I have the following recent tech and AI news items:
${JSON.stringify(newsItems.slice(0, 15))}

Task 1: Select the top 3 or 4 most exciting and important tech and AI news updates or startup announcements.
Task 2: Format them into data for Instagram carousel slides.
Slide 1 should be a hook/title slide (e.g., "Top Tech & AI News Today" or "AI Updates You Missed"). For slide 1, leave "content" empty.
Slides 2 to N should each cover one of the selected news stories. Give a short, punchy title and a 2-3 sentence engaging description summarizing what happened.
The "tag" should be a short 1-2 word badge (like "AI NEWS", "TECH NEWS", "STARTUP", "UPDATE", "BREAKING").
Task 3: Write an engaging Instagram caption including emojis, your analysis/thoughts, and relevant hashtags.

Respond STRICTLY with valid JSON matching this structure:
{
  "caption": "Your highly engaging instagram caption here...",
  "selectedLinks": ["url1", "url2"],
  "slides": [
    { "tag": "DAILY UPDATE", "title": "Top Tech & AI News Today", "content": "" },
    { "tag": "AI NEWS", "title": "New Model Release", "content": "The details..." }
  ]
}`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const resultText = response.text;
        return JSON.parse(resultText);
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        return null;
    }
}

module.exports = { generateCarouselContent };
