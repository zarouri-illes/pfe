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
  const packs = [
    { name: 'Pack Débutant',  credits: 50,  priceDa: 300,  isActive: true },
    { name: 'Pack Standard',  credits: 120, priceDa: 600,  isActive: true },
    { name: 'Pack Premium',   credits: 300, priceDa: 1200, isActive: true },
    { name: 'Pack Révision',  credits: 600, priceDa: 2000, isActive: true },
  ];

  for (let i = 0; i < packs.length; i++) {
    await prisma.creditPack.upsert({
      where: { id: i + 1 },
      update: packs[i],
      create: packs[i],
    });
  }
  console.log(`  ${packs.length} Credit packs`);

  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
