import { budgetRepository } from '@/repositories/budget.repository';
import type { Prisma } from '@prisma/client';

export class BudgetService {
  static async getUserBudgets(userId: string, month: number, year: number) {
    return budgetRepository.findUserBudgets(userId, month, year);
  }

  static async createBudget(data: Prisma.BudgetUncheckedCreateInput) {
    if (data.amount <= 0) throw new Error("Budget amount must be positive");
    return budgetRepository.create(data);
  }
}
