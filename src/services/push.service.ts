import webpush from 'web-push';
import { PushSubscriptionRepository } from '@/repositories/push-subscription.repository';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

// Gunakan email dari environment variable atau fallback
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:notifications@dompet.app';

webpush.setVapidDetails(
    vapidEmail,
    publicVapidKey,
    privateVapidKey
);

const pushSubscriptionRepository = new PushSubscriptionRepository();

export class PushService {
    /**
     * Kirim notifikasi push ke subscription yang tersimpan.
     */
    static async sendNotification(subscription: any, title: string, body: string) {
        const payload = JSON.stringify({
            title,
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png', // Fallback ke icon yang sama
        });

        try {
            await webpush.sendNotification(subscription, payload);
            return { success: true };
        } catch (error) {
            console.error('Error sending push notification', error);
            return { success: false, error };
        }
    }

    /**
     * Simpan subscription baru ke database
     */
    static async saveSubscription(userId: string, subscription: PushSubscriptionJSON, userAgent?: string) {
        try {
            const existing = await pushSubscriptionRepository.findByEndpoint(subscription.endpoint);
            
            if (existing) {
                // Update existing subscription
                return await pushSubscriptionRepository.update(existing.id, {
                    p256dh: subscription.keys?.p256dh || '',
                    auth: subscription.keys?.auth || '',
                    userAgent,
                    updatedAt: new Date(),
                });
            }

            // Create new subscription
            return await pushSubscriptionRepository.create({
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys?.p256dh || '',
                auth: subscription.keys?.auth || '',
                userAgent,
            });
        } catch (error) {
            console.error('Error saving push subscription', error);
            throw error;
        }
    }

    /**
     * Kirim notifikasi ke semua subscription user tertentu
     */
    static async sendNotificationToUser(userId: string, title: string, body: string) {
        try {
            const subscriptions = await pushSubscriptionRepository.findByUserId(userId);
            const results = [];

            for (const sub of subscriptions) {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                const result = await this.sendNotification(subscription, title, body);
                results.push({ subscriptionId: sub.id, ...result });
            }

            return results;
        } catch (error) {
            console.error('Error sending notifications to user', error);
            throw error;
        }
    }

    /**
     * Kirim reminder tagihan berulang (untuk debt yang belum dibayar)
     */
    static async sendDebtReminders(userId: string) {
        try {
            // Import DebtService secara dinamis untuk menghindari circular dependency
            const { DebtService } = await import('./debt.service');
            return await DebtService.sendDebtReminders(userId);
        } catch (error) {
            console.error('Error sending debt reminders:', error);
            return { sent: 0, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}

interface PushSubscriptionJSON {
    endpoint: string;
    keys?: {
        p256dh: string;
        auth: string;
    };
}
