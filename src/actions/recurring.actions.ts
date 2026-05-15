'use server';

import { RecurringService } from '@/services/recurring.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserRecurringAction() {
    const user = await getDefaultUser();
    return withActionHandler(() => RecurringService.getUserRecurringTransactions(user.id));
}

export async function createRecurringAction(data: Omit<Prisma.RecurringTransactionUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await RecurringService.createRecurringTransaction({
            ...data,
            userId: user.id
        });
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function updateRecurringAction(id: string, data: Omit<Prisma.RecurringTransactionUpdateInput, 'userId'>, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await RecurringService.updateRecurringTransaction(id, user.id, data);
        revalidatePath(pathToRevalidate);
        return result;
    });
}

export async function deleteRecurringAction(id: string, pathToRevalidate: string = '/settings') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await RecurringService.deleteRecurringTransaction(id, user.id);
        revalidatePath(pathToRevalidate);
        return result;
    });
}
