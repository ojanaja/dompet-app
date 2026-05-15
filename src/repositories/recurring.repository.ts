import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class RecurringRepository extends BaseRepository<Prisma.RecurringTransactionDelegate> {
    constructor() {
        super(prisma.recurringTransaction);
    }

    async findUserRecurring(userId: string) {
        return this.model.findMany({
            where: { userId },
            include: { category: true, wallet: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActiveDueTransactions(now: Date) {
        return this.model.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            }
        });
    }

    async updateLastRun(id: string, runAt: Date) {
        return this.model.update({
            where: { id },
            data: { lastRunAt: runAt }
        });
    }
}

export const recurringRepository = new RecurringRepository();
