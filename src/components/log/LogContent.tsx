'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ArrowDownLeft, ArrowUpRight, Trash2, Loader2, Edit2, Download } from 'lucide-react';
import { formatRupiah, formatDate, formatTime, formatRelativeDate } from '@/lib/format';
import { GlassCard } from '@/components/layout/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteTransactionAction } from '@/actions/transaction.actions';
import { fetchCategoriesAction } from '@/actions/core.actions';
import { fetchUserWalletsAction } from '@/actions/wallet.actions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
    wallet: {
        id: string;
        name: string;
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
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);

    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');

    useEffect(() => {
        if (editTx && categories.length === 0) {
            Promise.all([
                fetchCategoriesAction(),
                fetchUserWalletsAction()
            ]).then(([catRes, walRes]) => {
                if (catRes.success && catRes.data) setCategories(catRes.data);
                if (walRes.success && walRes.data) setWallets(walRes.data);
            });
        }
    }, [editTx, categories.length]);

    const handleDateChange = () => {
        const params = new URLSearchParams(searchParams);
        if (startDate) params.set('start', startDate);
        else params.delete('start');
        
        if (endDate) params.set('end', endDate);
        else params.delete('end');
        
        params.set('page', '1'); // Reset pagination
        router.push(`${pathname}?${params.toString()}`);
    };

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
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const exportToCSV = () => {
        const headers = ['Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Dompet', 'Judul', 'Nominal', 'Catatan'];
        const rows = transactions.map(tx => [
            formatDate(tx.date).replace(/,/g, ''), // remove comma
            formatTime(tx.date),
            tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
            tx.category?.name || 'Lainnya',
            tx.wallet?.name || 'Lainnya',
            `"${tx.title}"`,
            tx.amount,
            `"${tx.notes || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dompet_log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            {/* Search, Filter & Date Pickers */}
            <div className="flex flex-col gap-2">
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

                {/* Date Filters & Export */}
                <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            onBlur={handleDateChange}
                            className="w-full bg-transparent text-xs text-foreground focus:outline-none [color-scheme:dark]"
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            onBlur={handleDateChange}
                            className="w-full bg-transparent text-xs text-foreground focus:outline-none [color-scheme:dark]"
                        />
                    </div>
                    <button 
                        onClick={exportToCSV}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-200 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        CSV Halaman Ini
                    </button>
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
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>{formatDate(tx.date)} · {formatTime(tx.date)}</span>
                                                        {tx.wallet && (
                                                            <span className="bg-border-subtle px-1.5 py-0.5 rounded text-[10px]">
                                                                {tx.wallet.name}
                                                            </span>
                                                        )}
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
                        wallets={wallets}
                        initialData={{
                            id: editTx.id,
                            title: editTx.title,
                            amount: editTx.amount,
                            type: editTx.type as any,
                            categoryId: editTx.category?.id || null,
                            walletId: editTx.wallet?.id || null,
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
