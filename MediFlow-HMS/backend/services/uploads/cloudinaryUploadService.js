import { v2 as cloudinary } from 'cloudinary';

const uploadImageIfPresent = async (file) => {
    if (!file?.path) {
        return '';
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, { resource_type: 'image' });
    return uploadResult.secure_url;
};

export { uploadImageIfPresent };
