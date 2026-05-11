'use client';

import { GlassCard } from '@/components/layout/GlassCard';
import { ExpenseDonutChart } from '@/components/charts/ExpenseDonutChart';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import type { DashboardData } from '@/actions/dashboard.actions';

interface DashboardContentProps {
    data: DashboardData | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    ESSENTIAL: 'Kebutuhan',
    LIFESTYLE: 'Gaya Hidup',
    PROJECT: 'Proyek',
    INCOME: 'Pendapatan',
};

// Monochrome palette for chart segments
const MONO_COLORS: Record<string, string> = {
    ESSENTIAL: '#ffffff',
    LIFESTYLE: '#888888',
    PROJECT: '#555555',
    INCOME: '#cccccc',
};

export function DashboardContent({ data }: DashboardContentProps) {
    if (!data) {
        return (
            <GlassCard className="p-6 text-center">
                <p className="text-muted text-sm">Gagal memuat data</p>
            </GlassCard>
        );
    }

    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <>
            {/* Month */}
            <div className="px-1">
                <p className="text-xs text-muted uppercase tracking-widest font-medium">{monthName}</p>
            </div>

            {/* Balance */}
            <GlassCard className="p-5">
                <p className="text-xs text-muted mb-1">Saldo</p>
                <p className={`text-3xl font-semibold tabular-nums tracking-tight ${
                    data.balance >= 0 ? 'text-foreground' : 'text-danger'
                }`}>
                    {data.balance >= 0 ? '+' : ''}{formatRupiah(data.balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{data.transactionCount} transaksi</p>
            </GlassCard>

            {/* Income / Expense Row */}
            <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5 text-foreground" />
                        <span className="text-xs text-muted">Masuk</span>
                    </div>
                    <p className="text-base font-semibold text-foreground tabular-nums">
                        {data.totalIncome > 0 ? formatRupiah(data.totalIncome) : 'Rp0'}
                    </p>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-foreground" />
                        <span className="text-xs text-muted">Keluar</span>
                    </div>
                    <p className="text-base font-semibold text-foreground tabular-nums">
                        {data.totalExpense > 0 ? formatRupiah(data.totalExpense) : 'Rp0'}
                    </p>
                </GlassCard>
            </div>

            {/* Chart */}
            <GlassCard className="p-5">
                <h2 className="text-xs text-muted uppercase tracking-widest font-medium mb-4">Distribusi</h2>
                <ExpenseDonutChart
                    data={data.categoryBreakdown.map(cat => ({
                        name: CATEGORY_LABELS[cat.type] || cat.name,
                        value: cat.total,
                        color: MONO_COLORS[cat.type] || '#666',
                    }))}
                />
                {data.categoryBreakdown.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
                        {data.categoryBreakdown.map((cat) => (
                            <div key={cat.type} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MONO_COLORS[cat.type] || '#666' }} />
                                <span className="text-xs text-muted">{CATEGORY_LABELS[cat.type] || cat.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Trend Chart */}
            <GlassCard className="p-5">
                <h2 className="text-xs text-muted uppercase tracking-widest font-medium mb-4">Tren Pengeluaran</h2>
                <SpendingTrendChart data={data.spendingTrend} />
            </GlassCard>

            {/* Budgets */}
            {data.budgetsInfo && data.budgetsInfo.length > 0 && (
                <GlassCard className="p-5">
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium mb-4">Anggaran</h2>
                    <div className="space-y-4">
                        {data.budgetsInfo.map((budget) => {
                            const percent = Math.min((budget.spent / budget.budget) * 100, 100);
                            const isOver = budget.spent > budget.budget;
                            return (
                                <div key={budget.categoryId}>
                                    <div className="flex justify-between items-end mb-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{budget.categoryName}</p>
                                            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[budget.categoryType] || budget.categoryType}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm tabular-nums font-medium ${isOver ? 'text-danger' : 'text-foreground'}`}>
                                                {formatRupiah(budget.spent)}
                                            </p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                dari {formatRupiah(budget.budget)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${isOver ? 'bg-danger' : 'bg-foreground'}`} 
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            )}

            {/* Recent Transactions */}
            {data.recentTransactions.length > 0 && (
                <GlassCard className="p-5">
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium mb-4">Terbaru</h2>
                    <div className="space-y-0 divide-y divide-border-subtle">
                        {data.recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="text-sm text-foreground truncate">{tx.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{tx.categoryName || '—'}</p>
                                </div>
                                <p className={`text-sm font-mono tabular-nums flex-shrink-0 ml-3 ${
                                    tx.type === 'EXPENSE' ? 'text-foreground' : 'text-foreground'
                                }`}>
                                    {tx.type === 'EXPENSE' ? '−' : '+'}{formatRupiah(tx.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Empty */}
            {data.transactionCount === 0 && (
                <GlassCard className="p-8 text-center">
                    <p className="text-muted text-sm">Belum ada transaksi bulan ini</p>
                    <p className="text-muted-foreground text-xs mt-1">Mulai catat di Chat</p>
                </GlassCard>
            )}
        </>
    );
}
