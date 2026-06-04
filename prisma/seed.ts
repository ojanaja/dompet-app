import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../src/lib/category-defaults';

async function main() {
  const prisma = new PrismaClient();

  console.log('🌱 Seeding database...');

  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  for (const user of users) {
    for (const category of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: category.name,
          },
        },
        update: { type: category.type },
        create: { ...category, userId: user.id },
      });
      console.log(`✅ Category: ${category.name} [${category.type}] for ${user.email}`);
    }
  }

  console.log('🎉 Seeding complete!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed error:', e);
  process.exit(1);
});
