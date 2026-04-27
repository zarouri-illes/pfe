const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const packs = await prisma.creditPack.findMany();
  console.log(JSON.stringify(packs, null, 2));
}

main().finally(() => prisma.$disconnect());
