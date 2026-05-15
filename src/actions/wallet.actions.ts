'use server';

import { WalletService } from '@/services/wallet.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath, updateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserWalletsAction() {
    const user = await getDefaultUser();
    const getCachedWallets = unstable_cache(
        () => WalletService.getUserWallets(user.id),
        [`wallets-${user.id}`],
        { tags: [CACHE_TAGS.WALLETS, `wallets-${user.id}`], revalidate: CACHE_TTL.MEDIUM }
    );
    return withActionHandler(() => getCachedWallets());
}

export async function createWalletAction(data: Omit<Prisma.WalletUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await WalletService.createWallet({
            ...data,
            user: { connect: { id: user.id } }
        } as any);
        updateTag(CACHE_TAGS.WALLETS);
        updateTag(CACHE_TAGS.DASHBOARD);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function updateWalletAction(id: string, data: Omit<Prisma.WalletUpdateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await WalletService.updateWallet(id, user.id, data);
        updateTag(CACHE_TAGS.WALLETS);
        updateTag(CACHE_TAGS.DASHBOARD);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function deleteWalletAction(id: string, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await WalletService.deleteWallet(id, user.id);
        updateTag(CACHE_TAGS.WALLETS);
        updateTag(CACHE_TAGS.DASHBOARD);
        revalidatePath(pathToRevalidate);
        return result;
    });
}
