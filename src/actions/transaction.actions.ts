'use server';

import { TransactionService } from '@/services/transaction.service';
import { withActionHandler } from '@/lib/action-handler';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserTransactionsAction(userId: string) {
    return withActionHandler(() => TransactionService.getUserTransactions(userId));
}

export async function createTransactionAction(data: Prisma.TransactionUncheckedCreateInput, pathToRevalidate: string = '/') {
    return withActionHandler(async () => {
        const result = await TransactionService.createTransaction(data);
        revalidatePath(pathToRevalidate);
        return result;
    });
}
