import { NextRequest, NextResponse } from 'next/server';
import { PushService } from '@/services/push.service';
import { getCurrentUser } from '@/lib/user.server';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        const body = await request.json();
        const { subscription, userAgent } = body;
        
        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }
        
        // Simpan subscription ke database
        await PushService.saveSubscription(user.id, subscription, userAgent);
        
        return NextResponse.json(
            { success: true, message: 'Subscription saved' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}