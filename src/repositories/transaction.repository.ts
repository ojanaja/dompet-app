import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class TransactionRepository extends BaseRepository<Prisma.TransactionDelegate> {
    constructor() {
        super(prisma.transaction);
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
}

export const transactionRepository = new TransactionRepository();
