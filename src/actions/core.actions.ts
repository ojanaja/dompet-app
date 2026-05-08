'use server';

import { CategoryService } from '@/services/category.service';
import { BudgetService } from '@/services/budget.service';
import { DebtService } from '@/services/debt.service';
import { withActionHandler } from '@/lib/action-handler';
import { revalidatePath } from 'next/cache';
import type { Prisma, CategoryType } from '@prisma/client';

export async function fetchCategoriesAction() {
  return withActionHandler(() => CategoryService.getAllCategories());
}

export async function createCategoryAction(data: Prisma.CategoryCreateInput, pathToRevalidate: string = '/') {
  return withActionHandler(async () => {
    const result = await CategoryService.createCategory(data);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function fetchUserBudgetsAction(userId: string, month: number, year: number) {
  return withActionHandler(() => BudgetService.getUserBudgets(userId, month, year));
}

export async function createBudgetAction(data: Prisma.BudgetUncheckedCreateInput, pathToRevalidate: string = '/') {
  return withActionHandler(async () => {
    const result = await BudgetService.createBudget(data);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function fetchUnpaidDebtsAction(userId: string) {
  return withActionHandler(() => DebtService.getUnpaidDebts(userId));
}

export async function createDebtAction(data: Prisma.DebtUncheckedCreateInput, pathToRevalidate: string = '/') {
  return withActionHandler(async () => {
    const result = await DebtService.createDebt(data);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function markDebtAsPaidAction(debtId: string, pathToRevalidate: string = '/') {
  return withActionHandler(async () => {
    const result = await DebtService.markAsPaid(debtId);
    revalidatePath(pathToRevalidate);
    return result;
  });
}
