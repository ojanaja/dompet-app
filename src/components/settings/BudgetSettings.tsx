'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { createBudgetAction, deleteBudgetAction, updateBudgetAction } from '@/actions/core.actions';
import { formatRupiah } from '@/lib/format';

type Category = {
    id: string;
    name: string;
    type: string;
};

type Budget = {
    id: string;
    categoryId: string;
    amount: number;
    category: Category;
};

interface BudgetSettingsProps {
    categories: Category[];
    budgets: Budget[];
    selectedMonth: number;
    selectedYear: number;
}

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: new Date(2026, index, 1).toLocaleDateString('id-ID', { month: 'long' }),
}));

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);

const parseAmount = (value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

export function BudgetSettings({ categories, budgets, selectedMonth, selectedYear }: BudgetSettingsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const expenseCategories = categories.filter(c => c.type !== 'INCOME');
    const selectedPeriodLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
    });

    const updatePeriod = (month: number, year: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('budgetMonth', String(month));
        params.set('budgetYear', String(year));
        router.push(`${pathname}?${params.toString()}`);
    };

    const resetForm = () => {
        setSelectedCategory('');
        setAmount('');
        setEditingBudgetId(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsedAmount = parseAmount(amount);
        if (!selectedCategory) {
            setError('Pilih kategori dulu.');
            return;
        }
        if (parsedAmount <= 0) {
            setError('Nominal anggaran harus lebih dari Rp0.');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = editingBudgetId
                ? await updateBudgetAction(editingBudgetId, parsedAmount, '/settings')
                : await createBudgetAction({
                    categoryId: selectedCategory,
                    amount: parsedAmount,
                    month: selectedMonth,
                    year: selectedYear,
                }, '/settings');

            if (!result.success) {
                setError(result.error || 'Gagal menyimpan anggaran.');
                return;
            }

            resetForm();
            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Gagal menyimpan anggaran.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setAmount(value ? Number(value).toLocaleString('id-ID') : '');
    };

    const handleEdit = (budget: Budget) => {
        setEditingBudgetId(budget.id);
        setSelectedCategory(budget.categoryId);
        setAmount(budget.amount.toLocaleString('id-ID'));
        setError('');
    };

    const handleDelete = async (budget: Budget) => {
        if (!confirm(`Hapus anggaran ${budget.category.name} untuk ${selectedPeriodLabel}?`)) return;
        setIsSubmitting(true);
        setError('');
        try {
            const result = await deleteBudgetAction(budget.id, '/settings');
            if (!result.success) {
                setError(result.error || 'Gagal menghapus anggaran.');
                return;
            }
            if (editingBudgetId === budget.id) resetForm();
            router.refresh();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Gagal menghapus anggaran.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                        Bulan
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => updatePeriod(Number(e.target.value), selectedYear)}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    >
                        {monthOptions.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                        Tahun
                    </label>
                    <select
                        value={selectedYear}
                        onChange={(e) => updatePeriod(selectedMonth, Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted uppercase tracking-widest font-medium">{selectedPeriodLabel}</p>
                    {budgets.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{budgets.length} kategori</span>
                    )}
                </div>
                {budgets.length > 0 ? (
                    <div className="divide-y divide-border-subtle border-y border-border-subtle">
                        {budgets.map((budget) => (
                            <div key={budget.id} className="flex items-center justify-between py-3">
                                <div className="min-w-0">
                                    <p className="text-sm text-foreground truncate">{budget.category.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatRupiah(budget.amount)}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(budget)}
                                        className="p-1.5 text-muted hover:text-foreground hover:bg-card-hover rounded transition-colors"
                                        title="Edit anggaran"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(budget)}
                                        disabled={isSubmitting}
                                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                                        title="Hapus anggaran"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">Belum ada anggaran untuk bulan ini.</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div className="flex items-center gap-2">
                    {editingBudgetId ? <Edit2 className="w-3.5 h-3.5 text-muted" /> : <Plus className="w-3.5 h-3.5 text-muted" />}
                    <p className="text-xs text-muted uppercase tracking-widest font-medium">
                        {editingBudgetId ? 'Edit Anggaran' : 'Tambah Anggaran'}
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Kategori</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        disabled={!!editingBudgetId}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-60"
                        required
                    >
                        <option value="">Pilih kategori...</option>
                        {expenseCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Jumlah Anggaran</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                            required
                        />
                    </div>
                </div>

                {error && <p className="text-xs text-danger">{error}</p>}

                <div className="flex gap-2">
                    {editingBudgetId && (
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={isSubmitting}
                            className="flex-1 border border-border text-foreground py-2 rounded-md text-sm font-medium hover:bg-card-hover transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedCategory || !amount}
                        className="flex-1 bg-foreground text-background py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Menyimpan...' : editingBudgetId ? 'Simpan Perubahan' : 'Tambah Anggaran'}
                    </button>
                </div>
            </form>
        </div>
    );
}
