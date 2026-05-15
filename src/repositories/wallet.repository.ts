import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class WalletRepository extends BaseRepository<Prisma.WalletDelegate> {
    constructor() {
        super(prisma.wallet);
    }

    async findUserWallets(userId: string) {
        return this.model.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
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
}

export const walletRepository = new WalletRepository();
