import { v2 as cloudinary } from 'cloudinary';
import { getAppConfig } from './appConfig.js';
import { logger } from './logger.js';

const connectCloudinary = async () => {
    const { cloudinary: cloudinaryConfig } = getAppConfig();

    if (!cloudinaryConfig.isConfigured) {
        logger.warn('Cloudinary configuration is incomplete. Uploads will remain disabled.');
        return;
    }

    cloudinary.config({
        cloud_name: cloudinaryConfig.cloudName,
        api_key: cloudinaryConfig.apiKey,
        api_secret: cloudinaryConfig.apiSecret
    });

}

export default connectCloudinary;
