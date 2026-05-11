import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('🌱 Seeding database...');

  // Seed default categories (shared across all users)
  const categories = [
    { name: 'Kebutuhan Pokok', type: 'ESSENTIAL' as const },
    { name: 'Gaya Hidup', type: 'LIFESTYLE' as const },
    { name: 'Pendapatan', type: 'INCOME' as const },
    { name: 'Proyek & Bisnis', type: 'PROJECT' as const },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { type: cat.type },
      create: { name: cat.name, type: cat.type },
    });
    console.log(`✅ Category: ${cat.name} [${cat.type}]`);
  }

  console.log('🎉 Seeding complete!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed error:', e);
  process.exit(1);
});
