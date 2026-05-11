/**
 * Client-side push notification utilities
 */

// Cek apakah browser mendukung service worker dan push notifications
export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

// Cek apakah permission sudah diberikan
export async function getNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }
    
    return Notification.permission;
}

// Minta izin notifikasi
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
}

// Register service worker untuk push notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isPushSupported()) {
        console.warn('Push notifications not supported in this browser');
        return null;
    }
    
    try {
        const registration = await navigator.serviceWorker.register('/sw-push.js', {
            scope: '/',
        });
        
        console.log('Service Worker registered:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}

// Subscribe untuk push notifications
export async function subscribeToPushNotifications(
    userId: string,
    registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
    if (!isPushSupported()) {
        return null;
    }
    
    try {
        // Cek permission
        const permission = await getNotificationPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }
        
        // Subscribe ke push manager
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
        const applicationServerKey = vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined;
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as any,
        });
        
        // Kirim subscription ke server
        await saveSubscriptionToServer(userId, subscription);
        
        return subscription;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return null;
    }
}

// Kirim subscription ke server
async function saveSubscriptionToServer(userId: string, subscription: PushSubscription): Promise<void> {
    try {
        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                subscription: subscription.toJSON(),
                userAgent: navigator.userAgent,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to save subscription');
        }
        
        console.log('Subscription saved to server');
    } catch (error) {
        console.error('Error saving subscription to server:', error);
        throw error;
    }
}

// Unsubscribe dari push notifications
export async function unsubscribeFromPushNotifications(
    registration: ServiceWorkerRegistration
): Promise<boolean> {
    try {
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            await subscription.unsubscribe();
            
            // Hapus subscription dari server
            await deleteSubscriptionFromServer(subscription);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
    }
}

// Hapus subscription dari server
async function deleteSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
        const response = await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete subscription');
        }
        
        console.log('Subscription deleted from server');
    } catch (error) {
        console.error('Error deleting subscription from server:', error);
        throw error;
    }
}

// Helper function untuk convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Initialize push notifications
export async function initializePushNotifications(userId: string): Promise<{
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
}> {
    const isSupported = isPushSupported();
    
    if (!isSupported) {
        return {
            isSupported: false,
            permission: 'denied',
            isSubscribed: false,
        };
    }
    
    const permission = await getNotificationPermission();
    
    // Register service worker jika permission granted
    let isSubscribed = false;
    if (permission === 'granted') {
        const registration = await registerServiceWorker();
        
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            isSubscribed = !!subscription;
            
            // Jika belum subscribe, coba subscribe
            if (!isSubscribed && userId) {
                await subscribeToPushNotifications(userId, registration);
                isSubscribed = true;
            }
        }
    }
    
    return {
        isSupported,
        permission,
        isSubscribed,
    };
}