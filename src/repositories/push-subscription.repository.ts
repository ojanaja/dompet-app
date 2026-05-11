import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

export class PushSubscriptionRepository extends BaseRepository<Prisma.PushSubscriptionDelegate> {
    constructor() {
        super(prisma.pushSubscription);
    }

    /**
     * Cari subscription berdasarkan endpoint
     */
    async findByEndpoint(endpoint: string) {
        return this.model.findUnique({
            where: { endpoint },
        });
    }

    /**
     * Cari semua subscription untuk user tertentu
     */
    async findByUserId(userId: string) {
        return this.model.findMany({
            where: { userId },
        });
    }

    /**
     * Hapus subscription berdasarkan endpoint
     */
    async deleteByEndpoint(endpoint: string) {
        return this.model.delete({
            where: { endpoint },
        });
    }

    /**
     * Hapus semua subscription untuk user tertentu
     */
    async deleteByUserId(userId: string) {
        return this.model.deleteMany({
            where: { userId },
        });
    }
}