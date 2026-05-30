const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateImages(slides) {
    const templatePath = `file://${path.resolve(__dirname, '../templates/slide.html').replace(/\\/g, '/')}`;
    const outputDir = path.resolve(__dirname, '../data/images');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch headless browser
    const browser = await puppeteer.launch({ 
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport to 1080x1080 for Instagram 1:1 aspect ratio
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

    const imagePaths = [];

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await page.goto(templatePath, { waitUntil: 'networkidle0' });

        // Inject content into the HTML template
        await page.evaluate((slideData, isLast) => {
            document.getElementById('slide-tag').innerText = slideData.tag || 'AI UPDATE';
            document.getElementById('slide-title').innerText = slideData.title || '';
            
            const contentEl = document.getElementById('slide-content');
            if (slideData.content && slideData.content.trim() !== '') {
                contentEl.innerText = slideData.content;
                contentEl.style.display = 'block';
            } else {
                contentEl.style.display = 'none';
            }
            
            // If it's the last slide, hide the "Swipe" text
            if (isLast) {
                const swipeEl = document.getElementById('swipe-text');
                if (swipeEl) swipeEl.style.display = 'none';
            }
        }, slide, i === slides.length - 1);

        // Capture screenshot
        const imgPath = path.join(outputDir, `slide_${i}.jpeg`);
        await page.screenshot({ path: imgPath, type: 'jpeg', quality: 90 });
        imagePaths.push(imgPath);
        console.log(`Successfully generated slide ${i}`);
    }

    await browser.close();
    return imagePaths;
}

module.exports = { generateImages };
