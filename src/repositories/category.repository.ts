import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma, CategoryType } from '@prisma/client';

class CategoryRepository extends BaseRepository<Prisma.CategoryDelegate> {
  constructor() {
    super(prisma.category);
  }

  async findByType(type: CategoryType) {
    return this.model.findMany({ where: { type } });
  }
}

export const categoryRepository = new CategoryRepository();
