import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class WalletRepository extends BaseRepository<Prisma.WalletDelegate> {
    constructor() {
        super(prisma.wallet);
    }

    async findUserWallets(userId: string) {
        return this.model.findMany({
            where: { userId, isArchived: false },
            orderBy: { createdAt: 'asc' },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
    }

    async createDefaultWallet(userId: string) {
        return this.model.create({
            data: {
                userId,
                name: 'Tunai',
                icon: '💵',
                balance: 0,
            }
        });
    }

    async updateBalance(id: string, amount: number, type: 'INCOME' | 'EXPENSE') {
        const incrementValue = type === 'INCOME' ? amount : -amount;
        return this.model.update({
            where: { id },
            data: {
                balance: {
                    increment: incrementValue
                }
            }
        });
    }

    async countTransactions(id: string, userId: string) {
        return prisma.transaction.count({
            where: { walletId: id, userId },
        });
    }

    async archive(id: string) {
        return this.model.update({
            where: { id },
            data: { isArchived: true },
        });
    }
}

export const walletRepository = new WalletRepository();
