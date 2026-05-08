import { transactionRepository } from '@/repositories/transaction.repository';
import type { Prisma } from '@prisma/client';

export class TransactionService {
    /**
     * Mendapatkan semua transaksi untuk user spesifik.
     */
    static async getUserTransactions(userId: string) {
        if (!userId) throw new Error("User ID and is required");
        return transactionRepository.findAll({
            where: { userId },
            include: { category: true },
            orderBy: { date: 'desc' }
        });
    }

    /**
     * Membuat transaksi baru beserta validasi bisnis logik.
     */
    static async createTransaction(data: Prisma.TransactionUncheckedCreateInput) {
        if (data.amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }
        return transactionRepository.create(data);
    }
}
