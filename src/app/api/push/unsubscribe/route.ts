import { NextRequest, NextResponse } from 'next/server';
import { PushSubscriptionRepository } from '@/repositories/push-subscription.repository';

const pushSubscriptionRepository = new PushSubscriptionRepository();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { endpoint } = body;
        
        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            );
        }
        
        // Hapus subscription dari database
        await pushSubscriptionRepository.deleteByEndpoint(endpoint);
        
        return NextResponse.json(
            { success: true, message: 'Subscription deleted' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting push subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}