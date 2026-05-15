'use server';

import { WalletService } from '@/services/wallet.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserWalletsAction() {
    const user = await getDefaultUser();
    return withActionHandler(() => WalletService.getUserWallets(user.id));
}

export async function createWalletAction(data: Omit<Prisma.WalletUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await WalletService.createWallet({
            ...data,
            user: { connect: { id: user.id } }
        } as any);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function updateWalletAction(id: string, data: Omit<Prisma.WalletUpdateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await WalletService.updateWallet(id, user.id, data);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function deleteWalletAction(id: string, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await WalletService.deleteWallet(id, user.id);
        revalidatePath(pathToRevalidate);
        return result;
    });
}
