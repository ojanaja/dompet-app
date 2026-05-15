import { walletRepository } from '@/repositories/wallet.repository';
import type { Prisma } from '@prisma/client';

export class WalletService {
  static async getUserWallets(userId: string) {
    if (!userId) throw new Error("User ID is required");
    return walletRepository.findUserWallets(userId);
  }

  static async createWallet(data: Prisma.WalletCreateInput) {
    return walletRepository.create(data);
  }

  static async updateWallet(id: string, userId: string, data: Prisma.WalletUpdateInput) {
    const wallet = await walletRepository.findById(id);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or unauthorized");
    }
    return walletRepository.update(id, data);
  }

  static async deleteWallet(id: string, userId: string) {
    const wallet = await walletRepository.findById(id);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found or unauthorized");
    }
    return walletRepository.delete(id);
  }

  static async createDefaultWalletIfNone(userId: string) {
    const wallets = await walletRepository.findUserWallets(userId);
    if (wallets.length === 0) {
      return walletRepository.createDefaultWallet(userId);
    }
    return wallets[0];
  }
}
