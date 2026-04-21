const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    include: { subject: true }
  });
  console.log('Last 5 Exams:');
  console.log(JSON.stringify(exams, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
