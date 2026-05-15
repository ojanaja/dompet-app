'use server';

import { TransactionService } from '@/services/transaction.service';
import { withActionHandler } from '@/lib/action-handler';
import { getDefaultUser } from '@/lib/user.server';
import { revalidatePath, updateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache';
import type { Prisma } from '@prisma/client';

export async function fetchUserTransactionsAction(take?: number, skip?: number, startDate?: Date, endDate?: Date) {
    const user = await getDefaultUser();
    // Transactions list is NOT cached because it has too many param combos
    // and is already fast with Prisma query + pagination.
    // Dashboard aggregate IS cached separately.
    return withActionHandler(() => TransactionService.getUserTransactions(user.id, take, skip, startDate, endDate));
}

export async function deleteTransactionAction(transactionId: string, pathToRevalidate: string = '/log') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await TransactionService.deleteTransaction(transactionId, user.id);
        updateTag(CACHE_TAGS.DASHBOARD);
        updateTag(CACHE_TAGS.WALLETS);
        updateTag(CACHE_TAGS.DEBTS);
        revalidatePath(pathToRevalidate);
        revalidatePath('/dashboard');
        return result;
    });
}

export async function createTransactionAction(data: Omit<Prisma.TransactionUncheckedCreateInput, 'userId'>, pathToRevalidate: string = '/') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await TransactionService.createTransaction({
            ...data,
            userId: user.id,
        });
        updateTag(CACHE_TAGS.DASHBOARD);
        updateTag(CACHE_TAGS.WALLETS);
        updateTag(CACHE_TAGS.TRANSACTIONS);
        revalidatePath(pathToRevalidate);
        revalidatePath('/dashboard');
        revalidatePath('/log');
        return result; // result sekarang mengandung { transaction, aiFeedback }
    });
}

export async function updateTransactionAction(transactionId: string, data: Omit<Prisma.TransactionUpdateInput, 'userId'>, pathToRevalidate: string = '/log') {
    const user = await getDefaultUser();
    return withActionHandler(async () => {
        const result = await TransactionService.updateTransaction(transactionId, user.id, data);
        updateTag(CACHE_TAGS.DASHBOARD);
        updateTag(CACHE_TAGS.WALLETS);
        updateTag(CACHE_TAGS.TRANSACTIONS);
        revalidatePath(pathToRevalidate);
        revalidatePath('/dashboard');
        return result;
    });
}
