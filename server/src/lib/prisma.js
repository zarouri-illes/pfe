const { PrismaClient } = require('@prisma/client');

/**
 * Prisma client singleton.
 * Prevents exhausting database connections during development hot-reloads
 * and ensures a single shared instance throughout the application.
 */

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
