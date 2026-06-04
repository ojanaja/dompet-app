import { walletRepository } from '@/repositories/wallet.repository';
import { TransactionService } from '@/services/transaction.service';
import type { Prisma } from '@prisma/client';

type CreateWalletInput = {
  userId: string;
  name: string;
  balance?: number;
  icon?: string | null;
};

type UpdateWalletInput = {
  name?: string;
  balance?: number;
  icon?: string | null;
};

export class WalletService {
  static async getUserWallets(userId: string) {
    if (!userId) throw new Error("User ID is required");
    return walletRepository.findUserWallets(userId);
  }

  static async createWallet(data: CreateWalletInput) {
    const initialBalance = data.balance ?? 0;
    if (!Number.isFinite(initialBalance) || initialBalance < 0) {
      throw new Error("Saldo awal tidak valid");
    }

    const wallet = await walletRepository.create({
      userId: data.userId,
      name: data.name,
      icon: data.icon,
      balance: 0,
    } satisfies Prisma.WalletUncheckedCreateInput);

    if (initialBalance > 0) {
      await TransactionService.createSystemWalletAdjustment({
        userId: data.userId,
        walletId: wallet.id,
        amount: initialBalance,
        type: 'INCOME',
        title: `Saldo awal - ${wallet.name}`,
        notes: 'Set saldo awal dompet.',
        source: 'WALLET_INITIAL_BALANCE',
      });
    }

    return walletRepository.findById(wallet.id);
  }

  static async updateWallet(id: string, userId: string, data: UpdateWalletInput) {
    const wallet = await walletRepository.findById(id);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or unauthorized");
    }
    if (wallet.isArchived) {
      throw new Error("Wallet is archived");
    }

    const nextName = data.name?.trim();
    if (nextName && nextName !== wallet.name) {
      await walletRepository.update(id, { name: nextName });
    }

    if (typeof data.balance === 'number') {
      if (!Number.isFinite(data.balance) || data.balance < 0) {
        throw new Error("Saldo adjustment tidak valid");
      }

      const diff = data.balance - wallet.balance;
      if (diff !== 0) {
        await TransactionService.createSystemWalletAdjustment({
          userId,
          walletId: id,
          amount: Math.abs(diff),
          type: diff > 0 ? 'INCOME' : 'EXPENSE',
          title: `Adjustment saldo - ${nextName || wallet.name}`,
          notes: `Saldo disesuaikan dari ${wallet.balance} ke ${data.balance}.`,
          source: 'WALLET_ADJUSTMENT',
        });
      }
    }

    return walletRepository.findById(id);
  }

  static async deleteWallet(id: string, userId: string) {
    const wallet = await walletRepository.findById(id);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or unauthorized");
    }
    return walletRepository.archive(id);
  }

  static async countWalletTransactions(id: string, userId: string) {
    const wallet = await walletRepository.findById(id);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or unauthorized");
    }
    return walletRepository.countTransactions(id, userId);
  }

  static async createDefaultWalletIfNone(userId: string) {
    const wallets = await walletRepository.findUserWallets(userId);
    if (wallets.length === 0) {
      return walletRepository.createDefaultWallet(userId);
    }
    return wallets[0];
  }
}
