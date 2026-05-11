'use server';

import { CategoryService } from '@/services/category.service';
import { BudgetService } from '@/services/budget.service';
import { DebtService } from '@/services/debt.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
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

export async function fetchUserBudgetsAction(month: number, year: number) {
  const user = await getDefaultUser();
  return withActionHandler(() => BudgetService.getUserBudgets(user.id, month, year));
}

export async function createBudgetAction(data: Omit<Prisma.BudgetUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await BudgetService.createBudget({ ...data, userId: user.id });
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function fetchUnpaidDebtsAction() {
  const user = await getDefaultUser();
  return withActionHandler(() => DebtService.getUnpaidDebts(user.id));
}

export async function createDebtAction(data: Omit<Prisma.DebtUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await DebtService.createDebt({ ...data, userId: user.id });
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
