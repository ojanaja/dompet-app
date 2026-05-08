import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class BudgetRepository extends BaseRepository<Prisma.BudgetDelegate> {
  constructor() {
    super(prisma.budget);
  }

  async findUserBudgets(userId: string, month: number, year: number) {
    return this.model.findMany({
      where: { userId, month, year },
      include: { category: true }
    });
  }
}

export const budgetRepository = new BudgetRepository();
