'use server';

import { CategoryService } from '@/services/category.service';
import { BudgetService } from '@/services/budget.service';
import { DebtService } from '@/services/debt.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath, updateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache';
import type { Prisma } from '@prisma/client';

export async function fetchCategoriesAction() {
  const user = await getDefaultUser();
  const getCachedCategories = unstable_cache(
    () => CategoryService.getUserCategories(user.id),
    [`categories-${user.id}`],
    { tags: [CACHE_TAGS.CATEGORIES, `categories-${user.id}`], revalidate: CACHE_TTL.LONG }
  );
  return withActionHandler(() => getCachedCategories());
}

export async function createCategoryAction(data: Omit<Prisma.CategoryUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await CategoryService.createCategory(user.id, data);
    updateTag(CACHE_TAGS.CATEGORIES);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function updateCategoryAction(id: string, data: Prisma.CategoryUpdateInput, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await CategoryService.updateCategory(id, user.id, data);
    updateTag(CACHE_TAGS.CATEGORIES);
    updateTag(CACHE_TAGS.DASHBOARD);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function deleteCategoryAction(id: string, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await CategoryService.deleteCategory(id, user.id);
    updateTag(CACHE_TAGS.CATEGORIES);
    updateTag(CACHE_TAGS.DASHBOARD);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function fetchUserBudgetsAction(month: number, year: number) {
  const user = await getDefaultUser();
  const getCachedBudgets = unstable_cache(
    () => BudgetService.getUserBudgets(user.id, month, year),
    [`budgets-${user.id}-${month}-${year}`],
    { tags: [CACHE_TAGS.BUDGETS, `budgets-${user.id}`], revalidate: CACHE_TTL.MEDIUM }
  );
  return withActionHandler(() => getCachedBudgets());
}

export async function createBudgetAction(data: Omit<Prisma.BudgetUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await BudgetService.createBudget({ ...data, userId: user.id });
    updateTag(CACHE_TAGS.BUDGETS);
    updateTag(CACHE_TAGS.DASHBOARD);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function updateBudgetAction(id: string, amount: number, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await BudgetService.updateBudget(id, user.id, amount);
    updateTag(CACHE_TAGS.BUDGETS);
    updateTag(CACHE_TAGS.DASHBOARD);
    revalidatePath(pathToRevalidate);
    revalidatePath('/dashboard');
    return result;
  });
}

export async function deleteBudgetAction(id: string, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await BudgetService.deleteBudget(id, user.id);
    updateTag(CACHE_TAGS.BUDGETS);
    updateTag(CACHE_TAGS.DASHBOARD);
    revalidatePath(pathToRevalidate);
    revalidatePath('/dashboard');
    return result;
  });
}

export async function fetchUnpaidDebtsAction() {
  const user = await getDefaultUser();
  const getCachedDebts = unstable_cache(
    () => DebtService.getUnpaidDebts(user.id),
    [`debts-${user.id}`],
    { tags: [CACHE_TAGS.DEBTS, `debts-${user.id}`], revalidate: CACHE_TTL.MEDIUM }
  );
  return withActionHandler(() => getCachedDebts());
}

export async function createDebtAction(data: Omit<Prisma.DebtUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
  const user = await getDefaultUser();
  return withActionHandler(async () => {
    const result = await DebtService.createDebt({ ...data, userId: user.id });
    updateTag(CACHE_TAGS.DEBTS);
    revalidatePath(pathToRevalidate);
    return result;
  });
}

export async function markDebtAsPaidAction(debtId: string, pathToRevalidate: string = '/') {
  return withActionHandler(async () => {
    const result = await DebtService.markAsPaid(debtId);
    updateTag(CACHE_TAGS.DEBTS);
    revalidatePath(pathToRevalidate);
    return result;
  });
}
