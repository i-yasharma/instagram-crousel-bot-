const { fetchUnreadNews } = require('./fetchNews');
const { generateCarouselContent } = require('./generateContent');
const { generateImages } = require('./generateImages');
const { postToInstagram } = require('./instagramApi');
const fs = require('fs');

async function main() {
    console.log("🤖 Starting Daily AI News Carousel Bot...");
    
    // 1. Fetch News
    const { newItems, historyPath, history } = await fetchUnreadNews();
    
    if (newItems.length === 0) {
        console.log("No new topics to post about today. Exiting.");
        return;
    }

    // 2. Generate Content
    console.log("✍️  Generating content with Gemini...");
    const content = await generateCarouselContent(newItems);
    
    if (!content) {
        console.log("Failed to generate content. Exiting.");
        return;
    }

    // 3. Generate Images
    console.log("📸 Generating perfectly styled images...");
    const imagePaths = await generateImages(content.slides);

    // 4. Post to Instagram
    console.log("🚀 Posting to Instagram...");
    await postToInstagram(imagePaths, content.caption);

    // 5. Update History
    console.log("💾 Updating history to prevent repeats...");
    const newHistory = [...history, ...(content.selectedLinks || [])];
    fs.writeFileSync(historyPath, JSON.stringify(newHistory, null, 2));

    console.log("✅ All done for today! 🎉");
}

main().catch(console.error);
