import type { TransactionType } from '@prisma/client';

type RawLogQueryParams = {
    page?: string;
    start?: string;
    end?: string;
    q?: string;
    type?: string;
};

const isTransactionType = (value?: string): value is TransactionType => (
    value === 'INCOME' || value === 'EXPENSE'
);

const parseDateParam = (value?: string, endOfDay = false) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
};

export function parseLogQueryParams(params: RawLogQueryParams) {
    const parsedPage = params.page ? parseInt(params.page, 10) : 1;
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const search = params.q?.trim() || undefined;
    const type = isTransactionType(params.type) ? params.type : undefined;
    const startDate = parseDateParam(params.start);
    const endDate = parseDateParam(params.end, true);

    return {
        page,
        search,
        type,
        startDate,
        endDate,
        hasActiveFilters: !!(search || type || startDate || endDate),
    };
}
