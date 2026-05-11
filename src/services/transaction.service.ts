import { transactionRepository } from '@/repositories/transaction.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { budgetRepository } from '@/repositories/budget.repository';
import { debtRepository } from '@/repositories/debt.repository';
import { AIService } from './ai.service';
import type { Prisma } from '@prisma/client';

export class TransactionService {
    /**
     * Mendapatkan semua transaksi untuk user spesifik dengan pagination.
     */
    static async getUserTransactions(userId: string, take?: number, skip?: number) {
        if (!userId) throw new Error("User ID is required");
        return transactionRepository.findAll({
            where: { userId },
            include: { category: true },
            orderBy: { date: 'desc' },
            take,
            skip
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

        return transactionRepository.delete(transactionId);
    }

    /**
     * Membuat transaksi baru beserta validasi bisnis logik dan AI Feedback.
     */
    static async createTransaction(data: Prisma.TransactionUncheckedCreateInput) {
        if (data.amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        const metadata = data.metadata as any;

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

        // 2. Simpan transaksi
        const transaction = await transactionRepository.create({
            ...data,
            categoryId
        });

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

        if (transaction.type === 'EXPENSE' && !metadata?.isDebt) {
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
}
