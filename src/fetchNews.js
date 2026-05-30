const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();

// Good sources for AI, new tools, and startup news
const RSS_FEEDS = [
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'https://www.wired.com/feed/category/ai/latest/rss',
    'https://www.producthunt.com/feed',
    'https://techcrunch.com/category/startups/feed/'
];

async function fetchUnreadNews() {
    const historyPath = path.join(__dirname, '../data/history.json');
    let history = [];
    if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    let allItems = [];
    for (const url of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(url);
            // Grab the title, link, and snippet
            feed.items.forEach(item => {
                allItems.push({
                    title: item.title,
                    link: item.link,
                    contentSnippet: item.contentSnippet || item.content || ''
                });
            });
        } catch (e) {
            console.error(`Error fetching feed ${url}:`, e.message);
        }
    }

    // Filter out items already in history
    const newItems = allItems.filter(item => !history.includes(item.link));

    console.log(`Fetched ${newItems.length} new unread AI news items.`);
    return { newItems, historyPath, history };
}

module.exports = { fetchUnreadNews };
