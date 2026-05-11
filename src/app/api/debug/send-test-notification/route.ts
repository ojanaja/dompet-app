import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user.server';
import { PushService } from '@/services/push.service';

export async function POST(request: NextRequest) {
    try {
        // Hanya untuk development/testing
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { error: 'This endpoint is disabled in production' },
                { status: 403 }
            );
        }

        const user = await getCurrentUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title = 'Test Notification', body: message = 'This is a test notification from Dompet' } = body;

        // Kirim test notification
        const result = await PushService.sendNotificationToUser(user.id, title, message);

        return NextResponse.json({
            success: true,
            message: 'Test notification sent',
            user: {
                id: user.id,
                email: user.email,
            },
            result,
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error sending test notification:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Test notification endpoint',
        instructions: 'Send POST request with { title: string, body: string }',
        environment: process.env.NODE_ENV,
    }, { status: 200 });
}