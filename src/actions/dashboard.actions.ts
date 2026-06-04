'use server';

import { transactionRepository } from '@/repositories/transaction.repository';
import { budgetRepository } from '@/repositories/budget.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { getDefaultUser } from '@/lib/user.server';
import { withActionHandler } from '@/lib/action-handler';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache';

export type DashboardData = {
    totalExpense: number;
    totalIncome: number;
    netIncome: number;
    totalBalance: number;
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
    ESSENTIAL: '#e5e7eb',
    LIFESTYLE: '#9ca3af',
    PROJECT: '#60a5fa',
    INCOME: '#34d399',
};

const CATEGORY_NAME_COLORS = [
    '#f8fafc',
    '#93c5fd',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#c4b5fd',
    '#2dd4bf',
    '#fb7185',
];

export async function fetchDashboardDataAction(month?: number, year?: number) {
    const user = await getDefaultUser();
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    // Cached dashboard computation: 5 minute TTL, invalidated on tx/wallet mutations
    const getCachedDashboard = unstable_cache(
        async (): Promise<DashboardData> => {
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

            const netIncome = totalIncome - totalExpense;
            
            const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

            // Group expenses by category name for practical insight.
            const categoryMap = new Map<string, { name: string; type: string; total: number }>();
            transactions
                .filter(t => t.type === 'EXPENSE')
                .forEach(t => {
                    const catType = t.category?.type || 'LIFESTYLE';
                    const catName = t.category?.name || 'Lainnya';
                    const existing = categoryMap.get(catName);
                    if (existing) {
                        existing.total += t.amount;
                    } else {
                        categoryMap.set(catName, { name: catName, type: catType, total: t.amount });
                    }
                });

            const categoryBreakdown = Array.from(categoryMap.values()).map((cat, index) => ({
                ...cat,
                color: CATEGORY_NAME_COLORS[index % CATEGORY_NAME_COLORS.length] || CATEGORY_COLORS[cat.type] || '#94a3b8',
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

            let cumulativeSpending = 0;
            const spendingTrend = Array.from(trendMap.entries()).map(([date, amount]) => ({
                date,
                amount: cumulativeSpending += amount
            }));

            return {
                totalExpense,
                totalIncome,
                netIncome,
                totalBalance,
                categoryBreakdown,
                recentTransactions,
                transactionCount: transactions.length,
                budgetsInfo,
                spendingTrend,
                wallets
            };
        },
        [`dashboard-${user.id}-${targetMonth}-${targetYear}`],
        {
            tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.TRANSACTIONS, CACHE_TAGS.WALLETS, `dashboard-${user.id}`],
            revalidate: CACHE_TTL.MEDIUM,
        }
    );

    return withActionHandler(() => getCachedDashboard());
}
