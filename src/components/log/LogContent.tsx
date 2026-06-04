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
import type { CategoryType, Prisma, TransactionSource, TransactionType } from '@prisma/client';

interface Category {
    id: string;
    name: string;
    type: CategoryType;
}

interface Wallet {
    id: string;
    name: string;
}

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    date: string | Date;
    notes: string | null;
    metadata: Prisma.JsonValue;
    source: TransactionSource;
    category: {
        id: string;
        name: string;
        type: CategoryType;
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
    hasActiveFilters: boolean;
}

type FilterType = 'ALL' | 'EXPENSE' | 'INCOME';

const walletAdjustmentSources: TransactionSource[] = ['WALLET_INITIAL_BALANCE', 'WALLET_ADJUSTMENT'];

const getDebtMetadata = (metadata: Prisma.JsonValue) => {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
    const value = metadata as Record<string, unknown>;
    return {
        isDebt: value.isDebt === true,
        debtorName: typeof value.debtorName === 'string' ? value.debtorName : null,
    };
};

export function LogContent({ transactions, currentPage, hasMore, hasActiveFilters }: LogContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);

    const searchParamString = searchParams.toString();
    const currentFilter: FilterType = searchParams.get('type') === 'INCOME' || searchParams.get('type') === 'EXPENSE'
        ? searchParams.get('type') as FilterType
        : 'ALL';
    const exportHref = (() => {
        const params = new URLSearchParams(searchParamString);
        params.delete('page');
        const query = params.toString();
        return query ? `/api/log/export?${query}` : '/api/log/export';
    })();

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

    const pushQuery = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        params.set('page', '1');
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const query = String(formData.get('q') || '').trim();
        pushQuery({ q: query || null });
    };

    const handleFilterChange = (nextFilter: FilterType) => {
        pushQuery({ type: nextFilter === 'ALL' ? null : nextFilter });
    };

    const handleDateChange = (key: 'start' | 'end', value: string) => {
        pushQuery({ [key]: value || null });
    };

    const handleResetFilters = () => {
        router.push(pathname);
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

    const isWalletAdjustment = (tx: Transaction) => walletAdjustmentSources.includes(tx.source);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    // Group by relative date
    const grouped = new Map<string, Transaction[]>();
    transactions.forEach(tx => {
        const dateKey = formatRelativeDate(tx.date);
        const group = grouped.get(dateKey) || [];
        group.push(tx);
        grouped.set(dateKey, group);
    });

    return (
        <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto">
            {/* Search, Filter & Date Pickers */}
            <div className="flex flex-col gap-2">
                <form key={`search-${searchParamString}`} onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={searchParams.get('q') || ''}
                            placeholder="Cari transaksi..."
                            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-muted placeholder-muted-foreground transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-card border border-border px-3 py-2.5 rounded-lg text-xs text-foreground hover:bg-card-hover transition-colors"
                    >
                        Cari
                    </button>
                    <div className="relative">
                        <select
                            value={currentFilter}
                            onChange={(e) => handleFilterChange(e.target.value as FilterType)}
                            className="appearance-none bg-card border border-border rounded-lg px-3 pr-7 py-2.5 text-sm text-foreground focus:outline-none focus:border-muted cursor-pointer transition-colors"
                        >
                            <option value="ALL">Semua</option>
                            <option value="EXPENSE">Keluar</option>
                            <option value="INCOME">Masuk</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                    </div>
                </form>

                {/* Date Filters & Export */}
                <div key={`dates-${searchParamString}`} className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input 
                            type="date" 
                            defaultValue={searchParams.get('start') || ''}
                            onBlur={(e) => handleDateChange('start', e.target.value)}
                            className="w-full bg-transparent text-xs text-foreground focus:outline-none [color-scheme:dark]"
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <input 
                            type="date" 
                            defaultValue={searchParams.get('end') || ''}
                            onBlur={(e) => handleDateChange('end', e.target.value)}
                            className="w-full bg-transparent text-xs text-foreground focus:outline-none [color-scheme:dark]"
                        />
                    </div>
                    <a
                        href={exportHref}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-200 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        CSV Filter
                    </a>
                </div>
            </div>

            {/* Count */}
            <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">{transactions.length} transaksi</span>
                {hasActiveFilters && (
                    <button
                        onClick={handleResetFilters}
                        className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                        Reset filter
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
                            <TransactionRow
                                key={tx.id}
                                tx={tx}
                                isExpanded={expandedId === tx.id}
                                isDeleting={isDeleting === tx.id}
                                onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                                onEdit={setEditTx}
                                onDelete={handleDelete}
                                isWalletAdjustment={isWalletAdjustment(tx)}
                            />
                        ))}
                    </GlassCard>
                </div>
            ))}

            {/* Pagination */}
            {transactions.length > 0 && (currentPage > 1 || hasMore) && (
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
            {transactions.length === 0 && (
                <GlassCard className="p-8 text-center">
                    <p className="text-muted text-sm">
                        {hasActiveFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada riwayat transaksi'}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                        {hasActiveFilters ? 'Reset filter atau coba kata kunci lain' : 'Mulai catat di Chat'}
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
                            type: editTx.type,
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

interface TransactionRowProps {
    tx: Transaction;
    isExpanded: boolean;
    isDeleting: boolean;
    isWalletAdjustment: boolean;
    onToggle: () => void;
    onEdit: (tx: Transaction) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
}

function TransactionRow({ tx, isExpanded, isDeleting, isWalletAdjustment, onToggle, onEdit, onDelete }: TransactionRowProps) {
    const debtMetadata = getDebtMetadata(tx.metadata);

    return (
        <div
            className="px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors"
            onClick={onToggle}
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
                                                {isWalletAdjustment && (
                                                    <span className="text-[10px] text-muted-foreground bg-border-subtle px-1.5 py-0.5 rounded">
                                                        Adjustment
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
                                    {isExpanded && (
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
                                                    {debtMetadata?.isDebt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Utang: {debtMetadata.debtorName}
                                                        </p>
                                                    )}
                                                </div>
                                                {!isWalletAdjustment && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit(tx);
                                                            }}
                                                            className="p-1.5 rounded-md hover:bg-card-hover text-muted-foreground transition-colors"
                                                            title="Edit transaksi"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => onDelete(e, tx.id)}
                                                            disabled={isDeleting}
                                                            className="p-1.5 rounded-md hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
                                                            title="Hapus transaksi"
                                                        >
                                                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
        </div>
    );
}
