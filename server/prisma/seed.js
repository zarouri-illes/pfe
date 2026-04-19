// prisma/seed.js
// Populates the database with foundational data.
// Uses upsert throughout — safe to run multiple times.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── 1. Admin Account ──────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bacprephub.dz' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@bacprephub.dz',
      passwordHash: adminPasswordHash,
      role: 'admin',
      creditBalance: 9999,
    },
  });
  console.log(`  Admin account: ${admin.email}`);

  // ─── 2. Subjects ───────────────────────────────────────
  const maths = await prisma.subject.upsert({
    where: { id: 1 },
    update: { name: 'Mathématiques' },
    create: { name: 'Mathématiques' },
  });

  const physics = await prisma.subject.upsert({
    where: { id: 2 },
    update: { name: 'Physique' },
    create: { name: 'Physique' },
  });
  console.log(`  Subjects: ${maths.name}, ${physics.name}`);

  // ─── 3. Chapters — Mathématiques ───────────────────────
  const mathChapters = [
    'Suites numériques',
    'Limites et continuité',
    'Dérivation',
    'Étude de fonctions',
    'Calcul intégral',
    'Équations différentielles',
    'Nombres complexes',
    'Probabilités',
    'Géométrie dans l\'espace',
    'Statistiques',
  ];

  for (let i = 0; i < mathChapters.length; i++) {
    await prisma.chapter.upsert({
      where: { id: i + 1 },
      update: {
        name: mathChapters[i],
        orderIndex: i + 1,
        creditCost: 5,
      },
      create: {
        subjectId: maths.id,
        name: mathChapters[i],
        orderIndex: i + 1,
        creditCost: 5,
      },
    });
  }
  console.log(`  ${mathChapters.length} Maths chapters`);

  // ─── 4. Chapters — Physique ────────────────────────────
  const physicsChapters = [
    'Mécanique — Cinématique',
    'Mécanique — Dynamique',
    'Mécanique — Travail et Énergie',
    'Électricité — Circuits RC et RL',
    'Électricité — Oscillations',
    'Optique géométrique',
    'Ondes mécaniques',
    'Radioactivité et noyau',
    'Spectroscopie',
  ];

  const mathChapterCount = mathChapters.length;
  for (let i = 0; i < physicsChapters.length; i++) {
    await prisma.chapter.upsert({
      where: { id: mathChapterCount + i + 1 },
      update: {
        name: physicsChapters[i],
        orderIndex: i + 1,
        creditCost: 5,
      },
      create: {
        subjectId: physics.id,
        name: physicsChapters[i],
        orderIndex: i + 1,
        creditCost: 5,
      },
    });
  }
  console.log(`  ${physicsChapters.length} Physics chapters`);

  // ─── 5. Credit Packs ──────────────────────────────────
  // Deactivate all existing packs first to ensure only the 3 new tiers are active
  await prisma.creditPack.updateMany({
    data: { isActive: false },
  });

  const packs = [
    { 
      name: 'Standard', 
      credits: 100, 
      priceDa: 500, 
      features: ['Full Access to Exams PDF', 'Advanced Stats Dashboard (Limited)', 'Standard Chatbot Assistant'],
      isActive: true 
    },
    { 
      name: 'Passioned', 
      credits: 300, 
      priceDa: 1200, 
      features: ['All Standard perks', 'Priority AI Chatbot Support', 'Personalized Study Goals'],
      isActive: true 
    },
    { 
      name: 'Premium', 
      credits: 800, 
      priceDa: 2500, 
      features: ['All Passioned perks', 'Unlimited Chapter Quizzes', 'Early Access to Corrections', 'Batch PDF Downloads'],
      isActive: true 
    },
  ];

  for (let i = 0; i < packs.length; i++) {
    await prisma.creditPack.upsert({
      where: { id: i + 1 },
      update: packs[i],
      create: packs[i],
    });
  }
  console.log(`  ${packs.length} Credit packs`);

  // ─── 6. Dummy Students ──────────────────────────────────
  const studentPasswordHash = await bcrypt.hash('student123', 12);
  const students = [];
  for (let i = 1; i <= 5; i++) {
    const s = await prisma.user.upsert({
      where: { email: `student${i}@example.dz` },
      update: {},
      create: {
        name: `Étudiant ${i}`,
        email: `student${i}@example.dz`,
        passwordHash: studentPasswordHash,
        role: 'student',
        creditBalance: 100,
      },
    });
    students.push(s);
  }
  console.log(`  ${students.length} Student accounts created`);

  // ─── 7. Dummy Questions ──────────────────────────────────
  const chapters = await prisma.chapter.findMany({ take: 5 });
  for (const chapter of chapters) {
    await prisma.question.upsert({
      where: { id: chapter.id * 100 }, // Safe dummy ID
      update: {},
      create: {
        id: chapter.id * 100,
        chapterId: chapter.id,
        type: 'MCQ',
        content: `Question de test pour le chapitre ${chapter.name}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 5,
      }
    });
  }
  console.log('  Questions created for first 5 chapters');

  // ─── 8. Historical Transactions (Last 30 Days) ──────────
  console.log('  Seeding historical transactions...');
  const packList = await prisma.creditPack.findMany({ where: { isActive: true } });
  for (let i = 0; i < 20; i++) {
    const randomPack = packList[Math.floor(Math.random() * packList.length)];
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
    
    await prisma.transaction.create({
      data: {
        userId: students[Math.floor(Math.random() * students.length)].id,
        packId: randomPack.id,
        creditsAdded: randomPack.credits,
        amountDa: randomPack.priceDa,
        status: 'COMPLETED',
        chargilyId: `test_tx_${i}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        createdAt: randomDate
      }
    });
  }

  // ─── 9. Historical Attempts (Last 7 Days) ───────────────
  console.log('  Seeding historical attempts...');
  for (let i = 0; i < 40; i++) {
    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 7));

    await prisma.attempt.create({
      data: {
        userId: students[Math.floor(Math.random() * students.length)].id,
        chapterId: randomChapter.id,
        totalScore: Math.floor(Math.random() * 100),
        maxScore: 100,
        creditsSpent: 5,
        startedAt: randomDate,
        submittedAt: randomDate
      }
    });
  }

  console.log('\nSeeding complete with historical data!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
