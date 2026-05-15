'use client';

import { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/actions/core.actions';
import { useRouter } from 'next/navigation';

interface Category {
    id: string;
    name: string;
    type: string;
}

export function CategorySettings({ initialCategories }: { initialCategories: Category[] }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [editCat, setEditCat] = useState<Category | null>(null);
    
    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState('EXPENSE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const openCreate = () => {
        setEditCat(null);
        setName('');
        setType('EXPENSE');
        setError('');
        setIsOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditCat(cat);
        setName(cat.name);
        setType(cat.type);
        setError('');
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name) {
            setError('Nama kategori tidak boleh kosong');
            return;
        }

        setLoading(true);
        try {
            let res;
            if (editCat) {
                res = await updateCategoryAction(editCat.id, { name, type: type as any }, '/settings');
            } else {
                res = await createCategoryAction({ name, type: type as any }, '/settings');
            }

            if (res.success) {
                setIsOpen(false);
                router.refresh();
            } else {
                setError(res.error || 'Terjadi kesalahan sistem');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus kategori ini? Semua transaksi yang menggunakan kategori ini akan kehilangan kategorinya.')) return;
        
        try {
            const res = await deleteCategoryAction(id, '/settings');
            if (res.success) {
                router.refresh();
            } else {
                alert(res.error || 'Gagal menghapus');
            }
        } catch (err: any) {
            alert('Gagal menghapus');
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {initialCategories.map(cat => (
                    <div
                        key={cat.id}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border text-foreground bg-card"
                    >
                        <span>{cat.name}</span>
                        <div className="flex items-center gap-1 ml-1 border-l border-border-subtle pl-1.5">
                            <button
                                onClick={() => openEdit(cat)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => handleDelete(cat.id)}
                                className="text-muted-foreground hover:text-danger transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
                
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-dashed border-border-subtle text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                </button>
            </div>

            <BottomSheet
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={editCat ? "Edit Kategori" : "Kategori Baru"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                            Nama Kategori
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Misal: Jajan Kopi"
                            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1.5">
                            Tipe
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none"
                        >
                            <option value="ESSENTIAL">Kebutuhan Pokok</option>
                            <option value="LIFESTYLE">Gaya Hidup</option>
                            <option value="INCOME">Pendapatan</option>
                            <option value="PROJECT">Proyek / Bisnis</option>
                        </select>
                    </div>

                    {error && (
                        <p className="text-xs text-danger font-mono">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-foreground text-background font-semibold text-xs py-3 rounded-lg hover:bg-neutral-200 transition-colors duration-150 flex items-center justify-center gap-1.5 uppercase tracking-widest font-mono disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Kategori'}
                    </button>
                </form>
            </BottomSheet>
        </>
    );
}
