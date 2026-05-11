'use server';

import { TransactionService } from '@/services/transaction.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserTransactionsAction() {
    const user = await getDefaultUser();
    return withActionHandler(() => TransactionService.getUserTransactions(user.id));
}

export async function createTransactionAction(data: Omit<Prisma.TransactionUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await TransactionService.createTransaction({
            ...data,
            userId: user.id,
        });
        revalidatePath(pathToRevalidate);
        revalidatePath('/dashboard');
        revalidatePath('/log');
        return result; // result sekarang mengandung { transaction, aiFeedback }
    });
}
