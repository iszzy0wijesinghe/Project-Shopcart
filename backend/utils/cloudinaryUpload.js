// utils/cloudinaryUpload.js
import cloudinary from '../configs/cloudinaryConfig.js';
import streamifier from 'streamifier';

/**
 * Upload a file buffer to Cloudinary using the provided options.
 * @param {Buffer} fileBuffer - The buffer of the file to upload.
 * @param {Object} options - Cloudinary upload options (e.g., { folder: '...', resource_type: 'raw' }).
 * @returns {Promise<Object>} - The Cloudinary upload result (including the secure_url).
 */
export const uploadToCloudinary = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Extracts the Cloudinary public ID from a typical Cloudinary URL.
 * Example URL:
 *    https://res.cloudinary.com/<cloudName>/image/upload/v123456/folder/imgName.jpg
 * This function returns something like:
 *    v123456/folder/imgName
 */
const getCloudinaryPublicIdFromUrl = (cloudinaryUrl) => {
  try {
    // 1) Split on "/"
    const urlParts = cloudinaryUrl.split('/');
    // Remove the first 6 elements: ["https:", "", "res.cloudinary.com", "<cloudName>", "image", "upload"]
    // The remainder might look like: ["v123456", "folder", "imgName.jpg"]
    const filePathArray = urlParts.slice(6);
    // Join them back
    const filePath = filePathArray.join('/');
    // filePath => "v123456/folder/imgName.jpg"
    // 2) Remove the file extension
    const [publicId] = filePath.split('.');
    // publicId => "v123456/folder/imgName"
    return publicId;
  } catch (err) {
    // If parsing fails, return null or empty string
    return null;
  }
};

/**
 * Deletes an old image from Cloudinary given a full URL.
 */
export const deleteOldImageFromCloudinary = async (oldImageUrl) => {
  const publicId = getCloudinaryPublicIdFromUrl(oldImageUrl);
  if (!publicId) return; // or throw an error if you want to enforce it

  await cloudinary.uploader.destroy(publicId);
};
