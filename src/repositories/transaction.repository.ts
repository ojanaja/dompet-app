import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma, TransactionSource, TransactionType } from '@prisma/client';

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: { category: true; wallet: true };
}>;

class TransactionRepository extends BaseRepository<Prisma.TransactionDelegate> {
    constructor() {
        super(prisma.transaction);
    }

    async findUserTransactions(args: Omit<Prisma.TransactionFindManyArgs, 'include'>): Promise<TransactionWithRelations[]> {
        return this.model.findMany({
            ...args,
            include: { category: true, wallet: true },
        });
    }

    // Tambahkan query spesifik/kustom untuk Transaction di sini yang tidak tercover oleh BaseRepository
    // Contoh: Ambil transaksi berdasarkan range tanggal
    async findByDateRange(userId: string, startDate: Date, endDate: Date) {
        return this.model.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                category: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    async createWalletAdjustment(data: {
        userId: string;
        walletId: string;
        amount: number;
        type: TransactionType;
        title: string;
        notes: string;
        source: Extract<TransactionSource, 'WALLET_INITIAL_BALANCE' | 'WALLET_ADJUSTMENT'>;
    }) {
        return prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    userId: data.userId,
                    walletId: data.walletId,
                    amount: data.amount,
                    type: data.type,
                    title: data.title,
                    notes: data.notes,
                    source: data.source,
                    date: new Date(),
                    metadata: {
                        system: 'wallet_balance',
                        reason: data.source,
                    } satisfies Prisma.InputJsonObject,
                },
            });

            await tx.wallet.update({
                where: { id: data.walletId },
                data: {
                    balance: {
                        increment: data.type === 'INCOME' ? data.amount : -data.amount,
                    },
                },
            });

            return transaction;
        });
    }
}

export const transactionRepository = new TransactionRepository();
