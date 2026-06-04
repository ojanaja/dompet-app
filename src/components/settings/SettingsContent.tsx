'use client';

import { GlassCard } from '@/components/layout/GlassCard';
import { Tag, CreditCard, Info, Check, Bell, Target } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { markDebtAsPaidAction } from '@/actions/core.actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationSettings } from './NotificationSettings';
import { BudgetSettings } from './BudgetSettings';
import { CategorySettings } from './CategorySettings';
import { WalletSettings } from './WalletSettings';
import { RecurringSettings } from './RecurringSettings';

interface SettingsContentProps {
    user: { id: string; name: string | null; email: string };
    categories: Array<{ id: string; name: string; type: string }>;
    debts: Array<{
        id: string;
        debtorName: string;
        amount: number;
        isPaid: boolean;
        transaction: { title: string } | null;
    }>;
    budgets: Array<{
        id: string;
        categoryId: string;
        amount: number;
        category: {
            id: string;
            name: string;
            type: string;
        };
    }>;
    budgetMonth: number;
    budgetYear: number;
}

export function SettingsContent({ user, categories, debts, budgets, budgetMonth, budgetYear }: SettingsContentProps) {
    const router = useRouter();
    const [payingId, setPayingId] = useState<string | null>(null);

    const handlePayDebt = async (debtId: string) => {
        setPayingId(debtId);
        try {
            await markDebtAsPaidAction(debtId, '/settings');
            router.refresh();
        } catch {
            // handled by action
        } finally {
            setPayingId(null);
        }
    };

    return (
        <>
            {/* Profile */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                        <span className="text-lg font-semibold text-background">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="text-base font-medium text-foreground">{user.name || 'User'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </GlassCard>

            {/* Notifications */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-3.5 h-3.5 text-muted" />
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium">Notifikasi</h2>
                </div>
                <NotificationSettings userId={user.id} />
            </GlassCard>

            {/* Categories */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-3.5 h-3.5 text-muted" />
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium">Kategori</h2>
                </div>
                <CategorySettings initialCategories={categories} />
            </GlassCard>

            {/* Wallets */}
            <GlassCard className="p-5">
                <WalletSettings />
            </GlassCard>

            {/* Recurring Transactions */}
            <GlassCard className="p-5">
                <RecurringSettings />
            </GlassCard>

            {/* Debts */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-3.5 h-3.5 text-muted" />
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium">Utang</h2>
                    {debts.length > 0 && (
                        <span className="text-[10px] bg-foreground text-background font-medium px-1.5 py-0.5 rounded">
                            {debts.length}
                        </span>
                    )}
                </div>
                {debts.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                        {debts.map(debt => (
                            <div key={debt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="text-sm text-foreground truncate">{debt.debtorName}</p>
                                    <p className="text-xs text-muted-foreground">{debt.transaction?.title || '—'}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                    <span className="text-sm font-mono tabular-nums text-foreground">
                                        {formatRupiah(debt.amount)}
                                    </span>
                                    <button
                                        onClick={() => handlePayDebt(debt.id)}
                                        disabled={payingId === debt.id}
                                        className="p-1.5 rounded-md border border-border hover:bg-card-hover text-muted hover:text-foreground transition-colors disabled:opacity-40"
                                        title="Lunas"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">Tidak ada utang</p>
                )}
            </GlassCard>

            {/* Info */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3.5 h-3.5 text-muted" />
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium">Tentang</h2>
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">dompet v0.1.0</p>
                    <p className="text-xs text-muted-foreground">Powered by Gemini 2.5 Flash</p>
                </div>
            </GlassCard>
            
            {/* Budgets */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-3.5 h-3.5 text-muted" />
                    <h2 className="text-xs text-muted uppercase tracking-widest font-medium">Anggaran Bulanan</h2>
                </div>
                <BudgetSettings
                    categories={categories}
                    budgets={budgets}
                    selectedMonth={budgetMonth}
                    selectedYear={budgetYear}
                />
            </GlassCard>
        </>
    );
}
