import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

class DebtRepository extends BaseRepository<Prisma.DebtDelegate> {
  constructor() {
    super(prisma.debt);
  }

  async findUnpaidDebts(userId: string) {
    return this.model.findMany({
      where: { userId, isPaid: false },
      include: { transaction: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const debtRepository = new DebtRepository();
