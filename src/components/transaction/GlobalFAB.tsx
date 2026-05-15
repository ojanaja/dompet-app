'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { fetchCategoriesAction } from '@/actions/core.actions';
import { fetchUserWalletsAction } from '@/actions/wallet.actions';

export function GlobalFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && categories.length === 0) {
            Promise.all([
                fetchCategoriesAction(),
                fetchUserWalletsAction()
            ]).then(([catRes, walRes]) => {
                if (catRes.success && catRes.data) setCategories(catRes.data);
                if (walRes.success && walRes.data) setWallets(walRes.data);
            });
        }
    }, [isOpen, categories.length]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-[88px] right-4 z-40 w-12 h-12 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                title="Catat Manual"
            >
                <Plus className="w-6 h-6" />
            </button>

            <BottomSheet
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Catat Transaksi"
            >
                <TransactionForm
                    categories={categories}
                    wallets={wallets}
                    onSuccess={() => setIsOpen(false)}
                />
            </BottomSheet>
        </>
    );
}
