import { recurringRepository } from '@/repositories/recurring.repository';
import { TransactionService } from '@/services/transaction.service';
import type { Prisma } from '@prisma/client';

export class RecurringService {
    static async getUserRecurringTransactions(userId: string) {
        if (!userId) throw new Error("User ID is required");
        return recurringRepository.findUserRecurring(userId);
    }

    static async createRecurringTransaction(data: Prisma.RecurringTransactionUncheckedCreateInput) {
        return recurringRepository.create(data);
    }

    static async updateRecurringTransaction(id: string, userId: string, data: Prisma.RecurringTransactionUpdateInput) {
        const tx = await recurringRepository.findById(id);
        if (!tx || tx.userId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }
        return recurringRepository.update(id, data);
    }

    static async deleteRecurringTransaction(id: string, userId: string) {
        const tx = await recurringRepository.findById(id);
        if (!tx || tx.userId !== userId) {
            throw new Error("Transaction not found or unauthorized");
        }
        return recurringRepository.delete(id);
    }

    /**
     * Called by Cron job to process all due recurring transactions.
     */
    static async processDueTransactions() {
        const now = new Date();
        const dueTransactions = await recurringRepository.findActiveDueTransactions(now);
        
        let processedCount = 0;

        for (const rt of dueTransactions) {
            const shouldRun = this.checkIfShouldRun(rt, now);
            if (shouldRun) {
                // Create transaction
                try {
                    await TransactionService.createTransaction({
                        userId: rt.userId,
                        categoryId: rt.categoryId,
                        walletId: rt.walletId,
                        recurringTransactionId: rt.id,
                        amount: rt.amount,
                        type: rt.type,
                        title: rt.title,
                        notes: `Automated recurring transaction (${rt.frequency})`,
                        date: now,
                    });

                    // Update last run
                    await recurringRepository.updateLastRun(rt.id, now);
                    processedCount++;
                } catch (e) {
                    console.error(`Failed to process recurring tx ${rt.id}:`, e);
                }
            }
        }

        return processedCount;
    }

    private static checkIfShouldRun(rt: any, now: Date): boolean {
        if (!rt.lastRunAt) return true;

        const lastRun = new Date(rt.lastRunAt);
        const diffMs = now.getTime() - lastRun.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        switch (rt.frequency) {
            case 'DAILY':
                return diffDays >= 1;
            case 'WEEKLY':
                // Check if 7 days passed or if it's the specific day of week
                if (rt.dayOfWeek !== null && now.getDay() === rt.dayOfWeek && diffDays >= 6) {
                    return true;
                }
                return diffDays >= 7;
            case 'MONTHLY':
                // Check if specific day of month matches
                if (rt.dayOfMonth !== null && now.getDate() === rt.dayOfMonth && diffDays >= 25) {
                    return true;
                }
                // Fallback: roughly 30 days
                return diffDays >= 30;
            case 'YEARLY':
                return diffDays >= 365;
            default:
                return false;
        }
    }
}
