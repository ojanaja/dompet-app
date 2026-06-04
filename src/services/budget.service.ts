import { budgetRepository } from '@/repositories/budget.repository';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

const validateBudgetInput = (amount: number, month?: number, year?: number) => {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Budget amount must be positive");
  }
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
    throw new Error("Budget month is invalid");
  }
  if (year !== undefined && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
    throw new Error("Budget year is invalid");
  }
};

export class BudgetService {
  static async getUserBudgets(userId: string, month: number, year: number) {
    if (!userId) throw new Error("User ID is required");
    validateBudgetInput(1, month, year);
    return budgetRepository.findUserBudgets(userId, month, year);
  }

  static async createBudget(data: Prisma.BudgetUncheckedCreateInput) {
    validateBudgetInput(data.amount, data.month, data.year);
    
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

  static async updateBudget(id: string, userId: string, amount: number) {
    validateBudgetInput(amount);
    const budget = await budgetRepository.findUserBudgetById(id, userId);
    if (!budget) {
      throw new Error("Budget not found or unauthorized");
    }
    return budgetRepository.update(id, { amount });
  }

  static async deleteBudget(id: string, userId: string) {
    const budget = await budgetRepository.findUserBudgetById(id, userId);
    if (!budget) {
      throw new Error("Budget not found or unauthorized");
    }
    return budgetRepository.delete(id);
  }
}
