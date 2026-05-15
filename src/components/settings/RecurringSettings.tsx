'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/layout/GlassCard';
import { Plus, Edit2, Trash2, Loader2, Repeat, PlayCircle } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatRupiah } from '@/lib/format';
import { fetchUserRecurringAction, createRecurringAction, updateRecurringAction, deleteRecurringAction } from '@/actions/recurring.actions';
import { fetchCategoriesAction } from '@/actions/core.actions';
import { fetchUserWalletsAction } from '@/actions/wallet.actions';

export function RecurringSettings() {
    const [recurring, setRecurring] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [categoryId, setCategoryId] = useState('');
    const [walletId, setWalletId] = useState('');
    const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [startDate, setStartDate] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const [recRes, catRes, walRes] = await Promise.all([
            fetchUserRecurringAction(),
            fetchCategoriesAction(),
            fetchUserWalletsAction()
        ]);
        if (recRes.success && recRes.data) setRecurring(recRes.data);
        if (catRes.success && catRes.data) setCategories(catRes.data);
        if (walRes.success && walRes.data) setWallets(walRes.data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCreate = () => {
        setEditingTx(null);
        setTitle('');
        setAmount('');
        setType('EXPENSE');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setWalletId(wallets.length > 0 ? wallets[0].id : '');
        setFrequency('MONTHLY');
        setStartDate(new Date().toISOString().split('T')[0]);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (tx: any) => {
        setEditingTx(tx);
        setTitle(tx.title);
        setAmount(String(tx.amount));
        setType(tx.type);
        setCategoryId(tx.categoryId || '');
        setWalletId(tx.walletId || '');
        setFrequency(tx.frequency);
        setStartDate(new Date(tx.startDate).toISOString().split('T')[0]);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const numAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ""));

        try {
            const data = {
                title,
                amount: numAmount,
                type,
                categoryId: categoryId || null,
                walletId: walletId || null,
                frequency,
                startDate: new Date(startDate).toISOString(),
                isActive: true
            };

            if (editingTx) {
                await updateRecurringAction(editingTx.id, data);
            } else {
                await createRecurringAction(data);
            }
            setIsFormOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus transaksi berulang ini?')) return;
        setIsSubmitting(true);
        try {
            await deleteRecurringAction(id);
            loadData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRunCron = async () => {
        try {
            setIsSubmitting(true);
            const res = await fetch('/api/cron/recurring');
            const data = await res.json();
            alert(`Cron run success. Processed ${data.processedCount} transactions.`);
            loadData();
        } catch(e) {
            alert('Failed to run cron');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(c => 
        type === 'INCOME' ? c.type === 'INCOME' : c.type !== 'INCOME'
    );

    return (
        <section>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-muted" />
                    Transaksi Berulang
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleRunCron}
                        className="p-1.5 hover:bg-card-hover rounded-md text-foreground transition-colors"
                        title="Simulasikan Cron Job"
                        disabled={isSubmitting}
                    >
                        <PlayCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="p-1.5 hover:bg-card-hover rounded-md text-foreground transition-colors"
                        title="Tambah Transaksi Berulang"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <GlassCard className="divide-y divide-border-subtle">
                {isLoading ? (
                    <div className="p-4 flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    </div>
                ) : recurring.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">
                        Belum ada transaksi berulang
                    </div>
                ) : (
                    recurring.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">{tx.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs tabular-nums ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{formatRupiah(tx.amount)}
                                    </span>
                                    <span className="text-[10px] bg-border-subtle px-1.5 py-0.5 rounded uppercase">{tx.frequency}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleOpenEdit(tx)}
                                    className="p-1.5 text-muted hover:text-foreground hover:bg-card-hover rounded transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tx.id)}
                                    disabled={isSubmitting}
                                    className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </GlassCard>

            <BottomSheet
                isOpen={isFormOpen}
                onClose={() => !isSubmitting && setIsFormOpen(false)}
                title={editingTx ? "Edit Transaksi Berulang" : "Tambah Transaksi Berulang"}
            >
                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    {/* Tipe Transaksi */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-card rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setType('EXPENSE')}
                            className={`py-2 px-4 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all ${
                                type === 'EXPENSE'
                                    ? 'bg-danger text-white shadow-md'
                                    : 'text-muted-foreground hover:bg-card-hover'
                            }`}
                        >
                            Keluar
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('INCOME')}
                            className={`py-2 px-4 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all ${
                                type === 'INCOME'
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'text-muted-foreground hover:bg-card-hover'
                            }`}
                        >
                            Masuk
                        </button>
                    </div>

                    <div>
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                            Judul *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Contoh: Bayar Kos, Langganan Netflix"
                            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                            Nominal *
                        </label>
                        <input
                            type="number"
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                                Kategori
                            </label>
                            <select
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
                                Dompet
                            </label>
                            <select
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                                Frekuensi
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as any)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none"
                            >
                                <option value="DAILY">Harian</option>
                                <option value="WEEKLY">Mingguan</option>
                                <option value="MONTHLY">Bulanan</option>
                                <option value="YEARLY">Tahunan</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                                Mulai Tanggal
                            </label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting || !title || !amount}
                        className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {editingTx ? 'Simpan Perubahan' : 'Tambah'}
                    </button>
                </form>
            </BottomSheet>
        </section>
    );
}
