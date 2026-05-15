'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ArrowDownLeft, ArrowUpRight, Trash2, Loader2, Edit2 } from 'lucide-react';
import { formatRupiah, formatDate, formatTime, formatRelativeDate } from '@/lib/format';
import { GlassCard } from '@/components/layout/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteTransactionAction } from '@/actions/transaction.actions';
import { fetchCategoriesAction } from '@/actions/core.actions';
import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TransactionForm } from '@/components/transaction/TransactionForm';

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: string;
    date: string | Date;
    notes: string | null;
    metadata: any;
    category: {
        id: string;
        name: string;
        type: string;
    } | null;
}

interface LogContentProps {
    transactions: Transaction[];
    currentPage: number;
    hasMore: boolean;
}

type FilterType = 'ALL' | 'EXPENSE' | 'INCOME';

export function LogContent({ transactions, currentPage, hasMore }: LogContentProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        if (editTx && categories.length === 0) {
            fetchCategoriesAction().then(res => {
                if (res.success && res.data) {
                    setCategories(res.data);
                }
            });
        }
    }, [editTx, categories.length]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Hapus transaksi ini?')) return;
        
        setIsDeleting(id);
        try {
            await deleteTransactionAction(id, '/log');
            router.refresh();
        } catch (error) {
            console.error('Failed to delete transaction', error);
        } finally {
            setIsDeleting(null);
            setExpandedId(null);
        }
    };

    const handlePageChange = (newPage: number) => {
        router.push(`/log?page=${newPage}`);
    };

    const filtered = transactions.filter(tx => {
        const matchesSearch = search === '' ||
            tx.title.toLowerCase().includes(search.toLowerCase()) ||
            tx.notes?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'ALL' || tx.type === filter;
        return matchesSearch && matchesFilter;
    });

    // Group by relative date
    const grouped = new Map<string, Transaction[]>();
    filtered.forEach(tx => {
        const dateKey = formatRelativeDate(tx.date);
        const group = grouped.get(dateKey) || [];
        group.push(tx);
        grouped.set(dateKey, group);
    });

    return (
        <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto">
            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari transaksi..."
                        className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-muted placeholder-muted-foreground transition-colors"
                    />
                </div>
                <div className="relative">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as FilterType)}
                        className="appearance-none bg-card border border-border rounded-lg px-3 pr-7 py-2.5 text-sm text-foreground focus:outline-none focus:border-muted cursor-pointer transition-colors"
                    >
                        <option value="ALL">Semua</option>
                        <option value="EXPENSE">Keluar</option>
                        <option value="INCOME">Masuk</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Count */}
            <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">{filtered.length} transaksi</span>
                {filter !== 'ALL' && (
                    <button
                        onClick={() => setFilter('ALL')}
                        className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Groups */}
            {Array.from(grouped.entries()).map(([dateLabel, txs]) => (
                <div key={dateLabel}>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2 px-1 font-medium">
                        {dateLabel}
                    </p>
                    <GlassCard className="divide-y divide-border-subtle">
                        {txs.map((tx) => (
                            <div
                                key={tx.id}
                                className="px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
                                onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-border-subtle flex items-center justify-center flex-shrink-0">
                                            {tx.type === 'EXPENSE'
                                                ? <ArrowDownLeft className="w-3.5 h-3.5 text-muted" />
                                                : <ArrowUpRight className="w-3.5 h-3.5 text-muted" />
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-foreground truncate">{tx.title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {tx.category && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {tx.category.name}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-muted-foreground">· {formatTime(tx.date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-mono tabular-nums flex-shrink-0 ml-3 text-foreground">
                                        {tx.type === 'EXPENSE' ? '−' : '+'}{formatRupiah(tx.amount)}
                                    </p>
                                </div>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                    {expandedId === tx.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-end">
                                                <div className="space-y-1.5">
                                                    {tx.notes && (
                                                        <p className="text-xs text-muted">{tx.notes}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(tx.date)} · {formatTime(tx.date)}
                                                    </p>
                                                    {tx.metadata?.isDebt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Utang: {tx.metadata.debtorName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditTx(tx as any);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-card-hover text-muted-foreground transition-colors"
                                                        title="Edit transaksi"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, tx.id)}
                                                        disabled={isDeleting === tx.id}
                                                        className="p-1.5 rounded-md hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
                                                        title="Hapus transaksi"
                                                    >
                                                        {isDeleting === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </GlassCard>
                </div>
            ))}

            {/* Pagination */}
            {filtered.length > 0 && (currentPage > 1 || hasMore) && (
                <div className="flex justify-between items-center mt-2 px-1">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-card border border-border text-xs text-foreground font-medium rounded-md hover:bg-card-hover transition-colors disabled:opacity-50"
                    >
                        Sebelumnya
                    </button>
                    <span className="text-xs text-muted-foreground">Hal {currentPage}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasMore}
                        className="px-3 py-1.5 bg-card border border-border text-xs text-foreground font-medium rounded-md hover:bg-card-hover transition-colors disabled:opacity-50"
                    >
                        Selanjutnya
                    </button>
                </div>
            )}

            {/* Empty */}
            {filtered.length === 0 && (
                <GlassCard className="p-8 text-center">
                    <p className="text-muted text-sm">
                        {search ? 'Tidak ditemukan' : 'Belum ada riwayat transaksi'}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                        {search ? 'Coba kata kunci lain' : 'Mulai catat di Chat'}
                    </p>
                </GlassCard>
            )}

            {/* Edit Bottom Sheet */}
            <BottomSheet
                isOpen={!!editTx}
                onClose={() => setEditTx(null)}
                title="Edit Transaksi"
            >
                {editTx && (
                    <TransactionForm
                        categories={categories}
                        initialData={{
                            id: editTx.id,
                            title: editTx.title,
                            amount: editTx.amount,
                            type: editTx.type as any,
                            categoryId: editTx.category?.id || null,
                            date: editTx.date,
                            notes: editTx.notes,
                        }}
                        onSuccess={() => {
                            setEditTx(null);
                            router.refresh();
                        }}
                    />
                )}
            </BottomSheet>
        </div>
    );
}
