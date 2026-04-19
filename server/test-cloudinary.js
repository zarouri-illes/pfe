const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary Credentials...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);

cloudinary.api.root_folders()
  .then(result => {
    console.log('✅ Success! Credentials are valid.');
    console.log('Folders found:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error! Cloudinary Authentication Failed.');
    console.error(error);
    process.exit(1);
  });
