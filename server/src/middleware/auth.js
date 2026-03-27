const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware
 * Validates JWT from Authorization header and attaches fresh user record to req.user.
 * Rejects requests with invalid or missing tokens, or if user record no longer exists.
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up user fresh from DB to invalidate token if user was deleted
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        creditBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
});

module.exports = { verifyToken };
