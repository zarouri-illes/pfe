require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const multer = require('multer');

// Import routes
const authRoutes = require('./routes/auth.routes');
const subjectsRoutes = require('./routes/subjects.routes');
const examsRoutes = require('./routes/exams.routes');
const quizRoutes = require('./routes/quiz.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const creditsRoutes = require('./routes/credits.routes');
const adminRoutes = require('./routes/admin.routes');
const goalsRoutes = require('./routes/goals.routes');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://pfe-delta-coral.vercel.app',
    'http://localhost:5173'
  ].filter(Boolean),
  credentials: true
}));

// 3. Rate Limiting (Global)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Request Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 5. Chargily Webhook (MUST be before express.json() to verify HMAC signature)
app.use('/api/credits/webhook', express.raw({ type: 'application/json' }));

// 6. Body Parsers (for all other routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/goals', goalsRoutes);

// 8. Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 9. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// 10. Global Error Handler
app.use((err, req, res, next) => {
  // Handle Multer file upload errors cleanly
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 20MB limit' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Handle Multer file filter rejection
  if (err.message === 'Only PDF and Image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  const response = { error: message };
  
  // Include validation details if present
  if (err.details) {
    response.details = err.details;
  }
  
  // Don't expose stack traces in production
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    console.error(err);
  }
  
  res.status(status).json(response);
});

module.exports = app;
