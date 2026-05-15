import { NextResponse } from 'next/server';
import { RecurringService } from '@/services/recurring.service';

export async function GET(request: Request) {
    try {
        // Optional: Check authorization header for cron secret if configured
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const processedCount = await RecurringService.processDueTransactions();

        return NextResponse.json({
            success: true,
            processedCount,
            message: `Successfully processed ${processedCount} recurring transactions`
        });
    } catch (error: any) {
        console.error('Error processing recurring transactions:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
