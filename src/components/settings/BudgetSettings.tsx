'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBudgetAction } from '@/actions/core.actions';

interface BudgetSettingsProps {
    categories: Array<{ id: string; name: string; type: string }>;
    budgets: Array<{ categoryId: string; amount: number }>;
}

export function BudgetSettings({ categories, budgets }: BudgetSettingsProps) {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const expenseCategories = categories.filter(c => c.type !== 'INCOME');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory || !amount) return;

        setIsSubmitting(true);
        const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10);
        
        try {
            const now = new Date();
            await createBudgetAction({
                categoryId: selectedCategory,
                amount: parsedAmount,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            }, '/settings');
            
            setAmount('');
            setSelectedCategory('');
            router.refresh();
        } catch (error) {
            console.error('Failed to set budget', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val) {
            setAmount(Number(val).toLocaleString('id-ID'));
        } else {
            setAmount('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Kategori</label>
                <select 
                    value={selectedCategory}
                    onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        const existing = budgets.find(b => b.categoryId === e.target.value);
                        if (existing) {
                            setAmount(existing.amount.toLocaleString('id-ID'));
                        } else {
                            setAmount('');
                        }
                    }}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    required
                >
                    <option value="">Pilih kategori...</option>
                    {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name} {budgets.find(b => b.categoryId === cat.id) ? '(Sudah diatur)' : ''}
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
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || !selectedCategory || !amount}
                className="w-full bg-foreground text-background py-2 rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Anggaran'}
            </button>
        </form>
    );
}
