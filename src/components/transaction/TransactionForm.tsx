'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createTransactionAction, updateTransactionAction } from '@/actions/transaction.actions';

interface Category {
    id: string;
    name: string;
    type: string;
}

interface Wallet {
    id: string;
    name: string;
}

interface TransactionFormProps {
    categories: Category[];
    wallets: Wallet[];
    onSuccess: () => void;
    initialData?: {
        id: string;
        title: string;
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        categoryId: string | null;
        walletId: string | null;
        date: Date | string;
        notes: string | null;
    };
}

export function TransactionForm({ categories, wallets, onSuccess, initialData }: TransactionFormProps) {
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialData?.type || 'EXPENSE');
    const [title, setTitle] = useState(initialData?.title || '');
    const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [walletId, setWalletId] = useState(initialData?.walletId || (wallets.length > 0 ? wallets[0].id : ''));
    
    const defaultDate = () => {
        const d = initialData?.date ? new Date(initialData.date) : new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const [date, setDate] = useState(defaultDate());
    const [notes, setNotes] = useState(initialData?.notes || '');

    const filteredCategories = categories.filter(c => 
        type === 'INCOME' ? c.type === 'INCOME' : c.type !== 'INCOME'
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title || !amount || !categoryId || !date || !walletId) {
            setError('Mohon lengkapi semua field wajib.');
            return;
        }

        const numAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Nominal tidak valid.');
            return;
        }

        setLoading(true);

        try {
            const data = {
                title,
                amount: numAmount,
                type,
                categoryId,
                walletId,
                date: new Date(date).toISOString(),
                notes: notes || null,
            };

            let res;
            if (isEdit && initialData?.id) {
                res = await updateTransactionAction(initialData.id, data);
            } else {
                res = await createTransactionAction(data);
            }

            if (res.success) {
                onSuccess();
            } else {
                setError(res.error || 'Terjadi kesalahan sistem.');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe Transaksi (Pill Switch) */}
            <div className="flex p-1 bg-card border border-border rounded-lg">
                <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        type === 'EXPENSE' 
                            ? 'bg-foreground text-background shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Pengeluaran
                </button>
                <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        type === 'INCOME' 
                            ? 'bg-foreground text-background shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Pemasukan
                </button>
            </div>

            {/* Nominal */}
            <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                    Nominal *
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">Rp</span>
                    <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors font-mono tabular-nums"
                    />
                </div>
            </div>

            {/* Judul */}
            <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                    Judul *
                </label>
                <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Makan siang"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
            </div>

            {/* Kategori & Dompet */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                        Kategori *
                    </label>
                    <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none"
                    >
                        <option value="" disabled>Pilih Kategori</option>
                        {filteredCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                        Dompet *
                    </label>
                    <select
                        required
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none"
                    >
                        <option value="" disabled>Pilih Dompet</option>
                        {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tanggal */}
            <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                    Tanggal *
                </label>
                <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors [color-scheme:dark]"
                />
            </div>

            {/* Catatan */}
            <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                    Catatan (Opsional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Info tambahan..."
                    rows={2}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
                />
            </div>

            {error && (
                <p className="text-xs text-danger font-mono">{error}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-foreground text-background font-semibold text-xs py-3 rounded-lg hover:bg-neutral-200 transition-colors duration-150 flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? 'Simpan Perubahan' : 'Catat Transaksi')}
            </button>
        </form>
    );
}
