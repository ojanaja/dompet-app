'use server';

import { RecurringService } from '@/services/recurring.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath, updateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserRecurringAction() {
    const user = await getDefaultUser();
    const getCachedRecurring = unstable_cache(
        () => RecurringService.getUserRecurringTransactions(user.id),
        [`recurring-${user.id}`],
        { tags: [CACHE_TAGS.RECURRING, `recurring-${user.id}`], revalidate: CACHE_TTL.MEDIUM }
    );
    return withActionHandler(() => getCachedRecurring());
}

export async function createRecurringAction(data: Omit<Prisma.RecurringTransactionUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await RecurringService.createRecurringTransaction({
            ...data,
            userId: user.id
        });
        updateTag(CACHE_TAGS.RECURRING);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function updateRecurringAction(id: string, data: Omit<Prisma.RecurringTransactionUpdateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await RecurringService.updateRecurringTransaction(id, user.id, data);
        updateTag(CACHE_TAGS.RECURRING);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function deleteRecurringAction(id: string, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await RecurringService.deleteRecurringTransaction(id, user.id);
        updateTag(CACHE_TAGS.RECURRING);
        revalidatePath(pathToRevalidate);
        return result;
    });
}
