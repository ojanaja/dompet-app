'use server';

import { transactionRepository } from '@/repositories/transaction.repository';
import { budgetRepository } from '@/repositories/budget.repository';
import { getDefaultUser } from '@/lib/user.server';
import { withActionHandler } from '@/lib/action-handler';

export type DashboardData = {
    totalExpense: number;
    totalIncome: number;
    balance: number;
    categoryBreakdown: Array<{
        name: string;
        type: string;
        total: number;
        color: string;
    }>;
    recentTransactions: Array<{
        id: string;
        title: string;
        amount: number;
        type: string;
        date: Date;
        categoryName: string | null;
    }>;
    transactionCount: number;
    budgetsInfo: Array<{
        categoryId: string;
        categoryName: string;
        categoryType: string;
        budget: number;
        spent: number;
    }>;
};

const CATEGORY_COLORS: Record<string, string> = {
    ESSENTIAL: '#3b82f6',
    LIFESTYLE: '#ec4899',
    PROJECT: '#8b5cf6',
    INCOME: '#10b981',
};

export async function fetchDashboardDataAction(month?: number, year?: number) {
    const user = await getDefaultUser();
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    return withActionHandler(async (): Promise<DashboardData> => {
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const [transactions, budgets] = await Promise.all([
            transactionRepository.findByDateRange(user.id, startOfMonth, endOfMonth),
            budgetRepository.findUserBudgets(user.id, targetMonth, targetYear)
        ]);

        const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        // Group expenses by category type
        const categoryMap = new Map<string, { name: string; type: string; total: number }>();
        transactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(t => {
                const catType = t.category?.type || 'ESSENTIAL';
                const catName = t.category?.name || 'Lainnya';
                const existing = categoryMap.get(catType);
                if (existing) {
                    existing.total += t.amount;
                } else {
                    categoryMap.set(catType, { name: catName, type: catType, total: t.amount });
                }
            });

        const categoryBreakdown = Array.from(categoryMap.values()).map(cat => ({
            ...cat,
            color: CATEGORY_COLORS[cat.type] || '#94a3b8',
        }));

        const recentTransactions = transactions.slice(0, 5).map(t => ({
            id: t.id,
            title: t.title,
            amount: t.amount,
            type: t.type,
            date: t.date,
            categoryName: t.category?.name || null,
        }));

        // Calculate progress for each budget
        const budgetsInfo = budgets.map(b => {
             const spent = transactions
                 .filter(t => t.categoryId === b.categoryId && t.type === 'EXPENSE')
                 .reduce((sum, t) => sum + t.amount, 0);

             return {
                 categoryId: b.categoryId,
                 categoryName: b.category.name,
                 categoryType: b.category.type,
                 budget: b.amount,
                 spent
             };
        });

        return {
            totalExpense,
            totalIncome,
            balance: totalIncome - totalExpense,
            categoryBreakdown,
            recentTransactions,
            transactionCount: transactions.length,
            budgetsInfo
        };
    });
}
