/**
 * utils/cloudinary.utils.js
 * 
 * Secure Cloudinary integration using signed uploads.
 * This ensures the client cannot upload malicious files or exceed 
 * their permissions.
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a signature for a signed upload to Cloudinary.
 * The signature is sent to the frontend (axios) and then 
 * attached to the FormData during upload.
 * 
 * @param {string} folder - Destination folder on Cloudinary
 * @param {string} source - Source type (e.g., 'image')
 * @returns {Object} - Signature, timestamp, cloud name, and API key
 */
const generateUploadSignature = (folder = 'quizapp/avatars') => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET
    );

    return {
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder,
    };
};

module.exports = { generateUploadSignature };
