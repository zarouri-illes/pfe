const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

// Helper to sign JWT
const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'student',
      creditBalance: 0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      creditBalance: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id, user.email, user.role);

  res.status(201).json({ data: { user, token } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // We must fetch passwordHash here to compare
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id, user.email, user.role);

  // Strip passwordHash before returning
  delete user.passwordHash;

  res.status(200).json({ data: { user, token } });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ data: req.user });
});

module.exports = { register, login, getMe };
