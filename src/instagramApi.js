const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function uploadImageToImgBB(imagePath) {
    if (!process.env.IMGBB_API_KEY) {
        throw new Error("Missing IMGBB_API_KEY");
    }
    
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    
    try {
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, form, {
            headers: form.getHeaders()
        });
        return response.data.data.url;
    } catch (error) {
        console.error("Error uploading to ImgBB:", error.response?.data || error.message);
        throw error;
    }
}

async function postToInstagram(imagePaths, caption) {
    const igUserId = process.env.IG_USER_ID;
    const accessToken = process.env.IG_ACCESS_TOKEN;
    
    if (!igUserId || !accessToken) {
        console.error("Missing Instagram credentials.");
        return;
    }

    console.log("Uploading images to temporary public URL (ImgBB)...");
    const publicUrls = [];
    for (const path of imagePaths) {
        const url = await uploadImageToImgBB(path);
        publicUrls.push(url);
    }
    
    try {
        console.log("Creating Instagram Carousel Items...");
        const creationIds = [];
        for (const url of publicUrls) {
            const response = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
                image_url: url,
                is_carousel_item: true,
                access_token: accessToken
            });
            creationIds.push(response.data.id);
        }
        
        console.log("Creating Carousel Container...");
        const carouselResponse = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
            media_type: 'CAROUSEL',
            children: creationIds,
            caption: caption,
            access_token: accessToken
        });
        
        const carouselContainerId = carouselResponse.data.id;
        
        console.log("Publishing Carousel...");
        let publishResponse;
        const maxRetries = 6;
        const delayMs = 15000; // 15 seconds delay between retries
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                publishResponse = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                    creation_id: carouselContainerId,
                    access_token: accessToken
                });
                break; // Success! Exit the loop.
            } catch (error) {
                const isNotReady = error.response?.data?.error?.error_subcode === 2207027 || error.response?.data?.error?.message?.includes("not ready");
                if (isNotReady && attempt < maxRetries) {
                    console.log(`[Attempt ${attempt}/${maxRetries}] Carousel is not ready to be published yet. Waiting 15s to retry...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                } else {
                    throw error; // Rethrow if it's a different error or we ran out of retries
                }
            }
        }
        
        console.log("Successfully posted to Instagram! ID:", publishResponse.data.id);
    } catch (error) {
        if (error.response?.data) {
            console.error("Meta Graph API Error Details:", JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

module.exports = { postToInstagram };
