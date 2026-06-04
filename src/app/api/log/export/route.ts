import { TransactionService } from '@/services/transaction.service';
import { getDefaultUser } from '@/lib/user.server';
import { parseLogQueryParams } from '@/lib/log-query';
import { formatDate, formatTime } from '@/lib/format';

const csvEscape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
    try {
        const user = await getDefaultUser();
        const searchParams = new URL(request.url).searchParams;
        const { startDate, endDate, search, type } = parseLogQueryParams(Object.fromEntries(searchParams));

        const transactions = await TransactionService.getUserTransactions(user.id, {
            startDate,
            endDate,
            search,
            type,
        });

        const headers = ['Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Dompet', 'Judul', 'Nominal', 'Catatan', 'Sumber'];
        const rows = transactions.map((tx) => [
            formatDate(tx.date).replace(/,/g, ''),
            formatTime(tx.date),
            tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
            tx.category?.name || 'Lainnya',
            tx.wallet?.name || 'Lainnya',
            tx.title,
            tx.amount,
            tx.notes || '',
            tx.source,
        ]);

        const csv = [
            headers.map(csvEscape).join(','),
            ...rows.map((row) => row.map(csvEscape).join(',')),
        ].join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="dompet_log_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unauthorized';
        return Response.json({ error: message }, { status: 401 });
    }
}
