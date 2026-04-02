const multer = require('multer');

// Memory storage keeps the file entirely in RAM instead of dropping it onto the local disk.
// This is the premier security setup for handling untrusted files before pushing them to cloud storage.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Enforce precise MIME type covering both PDFs (exams) and Images (questions)
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    // 20 MB absolute limit to protect RAM from crashing under DDoS
    fileSize: 20 * 1024 * 1024, 
  },
  fileFilter,
});

module.exports = upload;
