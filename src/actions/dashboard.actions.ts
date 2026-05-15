'use server';

import { transactionRepository } from '@/repositories/transaction.repository';
import { budgetRepository } from '@/repositories/budget.repository';
import { walletRepository } from '@/repositories/wallet.repository';
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
    spendingTrend: Array<{
        date: string;
        amount: number;
    }>;
    wallets: Array<{
        id: string;
        name: string;
        balance: number;
    }>;
};

const CATEGORY_COLORS: Record<string, string> = {
    ESSENTIAL: '#ffffff',
    LIFESTYLE: '#888888',
    PROJECT: '#555555',
    INCOME: '#cccccc',
};

export async function fetchDashboardDataAction(month?: number, year?: number) {
    const user = await getDefaultUser();
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    return withActionHandler(async (): Promise<DashboardData> => {
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const [transactions, budgets, wallets] = await Promise.all([
            transactionRepository.findByDateRange(user.id, startOfMonth, endOfMonth),
            budgetRepository.findUserBudgets(user.id, targetMonth, targetYear),
            walletRepository.findUserWallets(user.id)
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

        // Calculate spending trend (group by day)
        const trendMap = new Map<string, number>();
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        
        // Initialize all days up to current day (or end of month if past)
        const currentDay = (now.getMonth() + 1 === targetMonth && now.getFullYear() === targetYear) 
            ? now.getDate() 
            : daysInMonth;
            
        for (let i = 1; i <= currentDay; i++) {
            const dateStr = `${i.toString().padStart(2, '0')} ${new Date(targetYear, targetMonth - 1, i).toLocaleString('id-ID', { month: 'short' })}`;
            trendMap.set(dateStr, 0);
        }

        transactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(t => {
                const day = t.date.getDate();
                if (day <= currentDay) {
                    const dateStr = `${day.toString().padStart(2, '0')} ${t.date.toLocaleString('id-ID', { month: 'short' })}`;
                    const existing = trendMap.get(dateStr) || 0;
                    trendMap.set(dateStr, existing + t.amount);
                }
            });

        const spendingTrend = Array.from(trendMap.entries()).map(([date, amount]) => ({
            date,
            amount
        }));

        return {
            totalExpense,
            totalIncome,
            balance: totalIncome - totalExpense,
            categoryBreakdown,
            recentTransactions,
            transactionCount: transactions.length,
            budgetsInfo,
            spendingTrend,
            wallets
        };
    });
}
