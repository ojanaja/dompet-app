import { unstable_cache } from 'next/cache';

/**
 * Cache tag constants for consistent invalidation across the app.
 * Setiap domain data punya tag sendiri agar revalidation bisa targeted.
 */
export const CACHE_TAGS = {
    CATEGORIES: 'categories',
    WALLETS: 'wallets',
    TRANSACTIONS: 'transactions',
    DASHBOARD: 'dashboard',
    BUDGETS: 'budgets',
    DEBTS: 'debts',
    RECURRING: 'recurring',
} as const;

/**
 * Cache durations (in seconds)
 */
export const CACHE_TTL = {
    /** Kategori jarang berubah: cache 1 jam */
    LONG: 3600,
    /** Dashboard & aggregate data: cache 5 menit */
    MEDIUM: 300,
    /** Transactions list: cache 1 menit */
    SHORT: 60,
} as const;

/**
 * Helper to create cached functions with consistent patterns.
 * Wraps unstable_cache with our standard tags & TTL.
 */
export function createCachedFn<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyParts: string[],
    options: {
        tags: string[];
        revalidate?: number;
    }
) {
    return unstable_cache(
        fn,
        keyParts,
        {
            tags: options.tags,
            revalidate: options.revalidate ?? CACHE_TTL.MEDIUM,
        }
    );
}
