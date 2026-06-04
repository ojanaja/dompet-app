import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma, CategoryType } from '@prisma/client';

class CategoryRepository extends BaseRepository<Prisma.CategoryDelegate> {
  constructor() {
    super(prisma.category);
  }

  async findUserCategories(userId: string) {
    return this.model.findMany({
      where: { userId },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findByType(userId: string, type: CategoryType) {
    return this.model.findMany({
      where: { userId, type },
      orderBy: { name: 'asc' },
    });
  }

  async findUserCategoryById(id: string, userId: string) {
    return this.model.findFirst({
      where: { id, userId },
    });
  }
}

export const categoryRepository = new CategoryRepository();
