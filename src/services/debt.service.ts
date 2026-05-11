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

  /**
   * Kirim reminder untuk semua utang yang belum dibayar
   */
  static async sendDebtReminders(userId: string) {
    try {
      const unpaidDebts = await this.getUnpaidDebts(userId);
      
      if (unpaidDebts.length === 0) {
        return { sent: 0, message: 'No unpaid debts found' };
      }

      // Import PushService secara dinamis untuk menghindari circular dependency
      const { PushService } = await import('./push.service');
      
      const totalAmount = unpaidDebts.reduce((sum, debt) => sum + debt.amount, 0);
      const debtCount = unpaidDebts.length;
      
      const title = `Reminder: ${debtCount} Utang Belum Dibayar`;
      const body = `Total: Rp ${totalAmount.toLocaleString('id-ID')}. Cek detail di aplikasi.`;
      
      const results = await PushService.sendNotificationToUser(userId, title, body);
      
      return {
        sent: results?.length || 0,
        debts: unpaidDebts.length,
        totalAmount,
        results,
      };
    } catch (error) {
      console.error('Error sending debt reminders:', error);
      throw error;
    }
  }

  /**
   * Kirim reminder untuk utang tertentu
   */
  static async sendDebtReminder(debtId: string) {
    try {
      const debt = await debtRepository.findById(debtId);
      
      if (!debt) {
        throw new Error('Debt not found');
      }
      
      if (debt.isPaid) {
        return { sent: 0, message: 'Debt is already paid' };
      }

      // Import PushService secara dinamis untuk menghindari circular dependency
      const { PushService } = await import('./push.service');
      
      const title = `Reminder: Utang ke ${debt.debtorName}`;
      const body = `Jumlah: Rp ${debt.amount.toLocaleString('id-ID')}. Jangan lupa bayar!`;
      
      const results = await PushService.sendNotificationToUser(debt.userId, title, body);
      
      return {
        sent: results?.length || 0,
        debt,
        results,
      };
    } catch (error) {
      console.error('Error sending debt reminder:', error);
      throw error;
    }
  }
}