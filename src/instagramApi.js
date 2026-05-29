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
    const publishResponse = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
        creation_id: carouselContainerId,
        access_token: accessToken
    });
    
    console.log("Successfully posted to Instagram! ID:", publishResponse.data.id);
}

module.exports = { postToInstagram };
