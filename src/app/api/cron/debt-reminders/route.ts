import { NextRequest, NextResponse } from 'next/server';
import { DebtService } from '@/services/debt.service';
import { userRepository } from '@/repositories/user.repository';

// Secret key untuk mengamankan cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
    try {
        // Verifikasi secret key
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        if (token !== CRON_SECRET) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 403 }
            );
        }

        // Ambil semua user
        const users = await userRepository.findAll();
        
        const results = [];
        let totalRemindersSent = 0;
        let totalUsersProcessed = 0;

        // Kirim reminder untuk setiap user
        for (const user of users) {
            try {
                const result = await DebtService.sendDebtReminders(user.id);
                results.push({
                    userId: user.id,
                    email: user.email,
                    ...result,
                });
                
                if (result.sent && result.sent > 0) {
                    totalRemindersSent += result.sent;
                }
                
                totalUsersProcessed++;
            } catch (error) {
                console.error(`Error sending reminders for user ${user.id}:`, error);
                results.push({
                    userId: user.id,
                    email: user.email,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                totalUsers: users.length,
                totalUsersProcessed,
                totalRemindersSent,
                timestamp: new Date().toISOString(),
            },
            details: results,
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error in debt reminders cron job:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint untuk testing
export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Debt reminders cron endpoint',
        instructions: 'Send POST request with Bearer token in Authorization header',
        environment: process.env.NODE_ENV,
    }, { status: 200 });
}