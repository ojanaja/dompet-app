import { debtRepository } from '@/repositories/debt.repository';
import type { Prisma } from '@prisma/client';

export class DebtService {
  static async getUnpaidDebts(userId: string) {
    return debtRepository.findUnpaidDebts(userId);
  }

  static async createDebt(data: Prisma.DebtUncheckedCreateInput) {
    if (data.amount <= 0) throw new Error("Debt amount must be positive");
    return debtRepository.create(data);
  }

  static async markAsPaid(debtId: string) {
    return debtRepository.update(debtId, { isPaid: true });
  }
}
