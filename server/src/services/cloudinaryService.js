const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a raw memory Buffer strictly to Cloudinary without writing to local disk.
 * Streaming securely intercepts the multer RAM buffer and pushes it up via HTTPS.
 * 
 * @param {Buffer} buffer - The file buffer from multer.memoryStorage
 * @param {string} folder - The destination folder in Cloudinary
 * @returns {Promise<Object>} The Cloudinary asset response containing the secure_url
 */
const uploadBufferToCloudinary = (buffer, folder = 'bacprep/exams', customResourceType = null) => {
  return new Promise((resolve, reject) => {
    // Exams/PDFs must be uploaded as raw to preserve the exact file format and prevent 
    // Cloudinary from treating them as image transformations
    const resourceType = customResourceType || (folder.includes('exam') ? 'raw' : 'auto');

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    // Write buffer to stream and end
    uploadStream.end(buffer);
  });
};

/**
 * Extract publicId natively instead of storing it on the DB.
 * Allows safe cleanup when exams are deleted.
 */
const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts.pop().split('.')[0]; 
  const folder = parts.pop();
  const root = parts.pop();
  return `${root}/${folder}/${filename}`;
};

/**
 * Deletes an asset from Cloudinary using its constructed public_id
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadBufferToCloudinary, deleteFromCloudinary, extractPublicId };
