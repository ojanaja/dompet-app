'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/layout/GlassCard';
import { Plus, Edit2, Trash2, Loader2, Wallet as WalletIcon } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { fetchUserWalletsAction, createWalletAction, updateWalletAction, deleteWalletAction } from '@/actions/wallet.actions';
import { formatRupiah } from '@/lib/format';

export function WalletSettings() {
    const [wallets, setWallets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [name, setName] = useState('');

    const loadWallets = async () => {
        setIsLoading(true);
        const res = await fetchUserWalletsAction();
        if (res.success && res.data) {
            setWallets(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadWallets();
    }, []);

    const handleOpenCreate = () => {
        setEditingWallet(null);
        setName('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (w: any) => {
        setEditingWallet(w);
        setName(w.name);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingWallet) {
                await updateWalletAction(editingWallet.id, { name });
            } else {
                await createWalletAction({ name, balance: 0 });
            }
            setIsFormOpen(false);
            loadWallets();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus dompet ini? Transaksi yang terkait akan kehilangan referensi dompet.')) return;
        setIsSubmitting(true);
        try {
            await deleteWalletAction(id);
            loadWallets();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <WalletIcon className="w-4 h-4 text-muted" />
                    Manajemen Dompet
                </h2>
                <button
                    onClick={handleOpenCreate}
                    className="p-1.5 hover:bg-card-hover rounded-md text-foreground transition-colors"
                    title="Tambah Dompet"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            
            <GlassCard className="divide-y divide-border-subtle">
                {isLoading ? (
                    <div className="p-4 flex justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">
                        Belum ada dompet
                    </div>
                ) : (
                    wallets.map(w => (
                        <div key={w.id} className="flex items-center justify-between p-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">{w.name}</p>
                                <p className="text-xs text-muted-foreground">{formatRupiah(w.balance)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleOpenEdit(w)}
                                    className="p-1.5 text-muted hover:text-foreground hover:bg-card-hover rounded transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(w.id)}
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
                title={editingWallet ? "Edit Dompet" : "Tambah Dompet"}
            >
                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    <div>
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                            Nama Dompet *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Contoh: BCA, GoPay, Tunai"
                            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting || !name}
                        className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {editingWallet ? 'Simpan Perubahan' : 'Tambah Dompet'}
                    </button>
                </form>
            </BottomSheet>
        </section>
    );
}
