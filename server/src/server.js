require('dotenv').config();
const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt database connection first
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Only start server after DB connection is confirmed
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Database connection failed. Exiting process.', error);
    process.exit(1);
  }
}

// Handle unhandled rejections globally just in case
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // We don't necessarily crash here because asyncHandler should catch route-level stuff,
  // but if it's fatal, process.exit(1) can be called.
});

startServer();
