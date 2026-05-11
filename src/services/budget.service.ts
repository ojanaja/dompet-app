import { budgetRepository } from '@/repositories/budget.repository';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class BudgetService {
  static async getUserBudgets(userId: string, month: number, year: number) {
    return budgetRepository.findUserBudgets(userId, month, year);
  }

  static async createBudget(data: Prisma.BudgetUncheckedCreateInput) {
    if (data.amount <= 0) throw new Error("Budget amount must be positive");
    
    // Upsert budget to avoid unique constraint violations
    return prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: data.userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year
        }
      },
      update: { amount: data.amount },
      create: data
    });
  }
}
