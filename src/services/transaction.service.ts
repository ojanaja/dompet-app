import { transactionRepository } from '@/repositories/transaction.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { budgetRepository } from '@/repositories/budget.repository';
import { debtRepository } from '@/repositories/debt.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import { AIService } from './ai.service';
import type { CategoryType, Prisma, TransactionSource, TransactionType } from '@prisma/client';

type TransactionMetadata = {
    categorySuggested?: CategoryType;
    isDebt?: boolean;
    debtorName?: string;
};

export type TransactionQuery = {
    take?: number;
    skip?: number;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    type?: TransactionType;
};

export class TransactionService {
    /**
     * Mendapatkan semua transaksi untuk user spesifik dengan pagination.
     */
    static async getUserTransactions(userId: string, query: TransactionQuery = {}) {
        if (!userId) throw new Error("User ID is required");
        
        const where: Prisma.TransactionWhereInput = { userId };
        
        if (query.startDate || query.endDate) {
            where.date = {};
            if (query.startDate) where.date.gte = query.startDate;
            if (query.endDate) where.date.lte = query.endDate;
        }

        if (query.type) {
            where.type = query.type;
        }

        const search = query.search?.trim();
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { category: { is: { name: { contains: search, mode: 'insensitive' } } } },
                { wallet: { is: { name: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        return transactionRepository.findUserTransactions({
            where,
            orderBy: { date: 'desc' },
            take: query.take,
            skip: query.skip
        });
    }

    /**
     * Menghapus transaksi
     */
    static async deleteTransaction(transactionId: string, userId: string) {
        if (!transactionId || !userId) throw new Error("Transaction ID and User ID are required");
        
        // Verifikasi kepemilikan transaksi
        const transaction = await transactionRepository.findById(transactionId);
        if (!transaction || transaction.userId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }
        if (transaction.source === 'WALLET_INITIAL_BALANCE' || transaction.source === 'WALLET_ADJUSTMENT') {
            throw new Error("Adjustment saldo tidak bisa dihapus dari Log");
        }

        // Revert wallet balance
        if (transaction.walletId) {
            const revertType = transaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME';
            await walletRepository.updateBalance(transaction.walletId, transaction.amount, revertType);
        }

        return transactionRepository.delete(transactionId);
    }

    /**
     * Membuat transaksi baru beserta validasi bisnis logik dan AI Feedback.
     */
    static async createTransaction(data: Prisma.TransactionUncheckedCreateInput) {
        if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        const metadata = data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
            ? data.metadata as TransactionMetadata
            : null;

        // 1. Cari atau buat categoryId berdasarkan metadata AI jika categoryId belum ada
        let categoryId = data.categoryId;
        let categoryType = 'ESSENTIAL'; // default fallback

        if (!categoryId && metadata) {
            const suggestedType = metadata.categorySuggested || 'ESSENTIAL';

            // Cari category yang sesuai dengan type
            const existingCategories = await categoryRepository.findByType(suggestedType);

            if (existingCategories.length > 0) {
                categoryId = existingCategories[0].id;
                categoryType = existingCategories[0].type;
            } else {
                // Auto create category jika belum ada
                const newCat = await categoryRepository.create({
                    name: suggestedType,
                    type: suggestedType
                });
                categoryId = newCat.id;
                categoryType = newCat.type;
            }
        }

        // 1.5 Handle Wallet
        let walletId = data.walletId;
        if (!walletId) {
            const wallets = await walletRepository.findUserWallets(data.userId);
            const defaultWallet = wallets[0] || await walletRepository.createDefaultWallet(data.userId);
            walletId = defaultWallet.id;
        }

        // 2. Simpan transaksi
        const transaction = await transactionRepository.create({
            ...data,
            categoryId,
            walletId
        });

        // 2.5 Update Wallet Balance
        if (walletId) {
            await walletRepository.updateBalance(walletId, transaction.amount, transaction.type);
        }

        // 3. Logika Debt Tracker (Day 6)
        if (metadata?.isDebt) {
            await debtRepository.create({
                userId: transaction.userId,
                transactionId: transaction.id,
                debtorName: metadata.debtorName || "Orang Random",
                amount: transaction.amount,
                isPaid: false
            });
        }

        // 4. LOGIKA ADVANCED: Sarcastic AI Feedback (Day 6)
        let aiFeedback = metadata?.isDebt
            ? `Oke, utang si ${metadata.debtorName || "Orang Random"} udah gue catet. Inget ya, nagihnya jangan galakan yang ngutang.`
            : "Transaksi berhasil dicatat.";

        if (transaction.type === 'EXPENSE' && !metadata?.isDebt && categoryId) {
            const now = new Date();
            const budgets = await budgetRepository.findUserBudgets(
                transaction.userId,
                now.getMonth() + 1,
                now.getFullYear()
            );

            // Cari budget yang spesifik untuk kategori ini
            const budget = budgets.find(b => b.categoryId === categoryId);

            if (budget) {
                // Hitung total pengeluaran bulan ini untuk kategori tersebut
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const monthTransactions = await transactionRepository.findByDateRange(
                    transaction.userId,
                    startOfMonth,
                    endOfMonth
                );

                const totalSpent = monthTransactions
                    .filter(t => t.type === 'EXPENSE' && t.categoryId === categoryId)
                    .reduce((acc, curr) => acc + curr.amount, 0);

                const remaining = budget.amount - totalSpent;

                // Trigger AI Sarcasm
                aiFeedback = await AIService.generateSarcasticFeedback(
                    transaction.title,
                    transaction.amount,
                    categoryType,
                    remaining
                );
            }
        }

        return {
            transaction,
            aiFeedback
        };
    }

    static async createSystemWalletAdjustment(data: {
        userId: string;
        walletId: string;
        amount: number;
        type: TransactionType;
        title: string;
        notes: string;
        source: Extract<TransactionSource, 'WALLET_INITIAL_BALANCE' | 'WALLET_ADJUSTMENT'>;
    }) {
        if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        return transactionRepository.createWalletAdjustment(data);
    }

    /**
     * Memperbarui transaksi manual
     */
    static async updateTransaction(transactionId: string, userId: string, data: Prisma.TransactionUpdateInput) {
        if (!transactionId || !userId) throw new Error("Transaction ID and User ID are required");

        const transaction = await transactionRepository.findById(transactionId);
        if (!transaction || transaction.userId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }
        if (transaction.source === 'WALLET_INITIAL_BALANCE' || transaction.source === 'WALLET_ADJUSTMENT') {
            throw new Error("Adjustment saldo tidak bisa diedit dari Log");
        }

        // Revert old wallet balance
        if (transaction.walletId) {
            const revertType = transaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME';
            await walletRepository.updateBalance(transaction.walletId, transaction.amount, revertType);
        }

        const updatedTransaction = await transactionRepository.update(transactionId, data);

        // Apply new wallet balance
        if (updatedTransaction.walletId) {
            await walletRepository.updateBalance(updatedTransaction.walletId, updatedTransaction.amount, updatedTransaction.type);
        }

        return updatedTransaction;
    }
}
