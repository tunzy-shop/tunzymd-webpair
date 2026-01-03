// mega.js - Updated for tunzymd-webpair
const Mega = require('megajs');

const megaConfig = {
    email: 'your-email@mega.nz',    // Replace with your Mega email
    password: 'your-password',      // Replace with your Mega password
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function uploadFile(filePath, fileName) {
    try {
        const storage = await new Mega(megaConfig).ready;
        const file = await storage.upload(filePath, { 
            name: fileName,
            attributes: {
                description: 'TUNZYMD Session File'
            }
        }).complete;
        
        const link = await file.link();
        console.log(`File uploaded successfully: ${link}`);
        return link;
    } catch (error) {
        console.error('Mega upload failed:', error);
        throw error;
    }
}

module.exports = { uploadFile, megaConfig };
