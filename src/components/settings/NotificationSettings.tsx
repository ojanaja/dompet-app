'use client';

import { useState, useEffect } from 'react';
import { 
    isPushSupported, 
    getNotificationPermission, 
    requestNotificationPermission,
    initializePushNotifications,
    unsubscribeFromPushNotifications
} from '@/lib/push';
import { Bell, BellOff, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface NotificationSettingsProps {
    userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        checkPushStatus();
    }, []);

    const checkPushStatus = async () => {
        const supported = isPushSupported();
        setIsSupported(supported);

        if (supported) {
            const currentPermission = await getNotificationPermission();
            setPermission(currentPermission);

            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            }
        }
    };

    const handleEnableNotifications = async () => {
        if (!userId) {
            setMessage({ type: 'error', text: 'Sesi tidak valid' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const newPermission = await requestNotificationPermission();
            setPermission(newPermission);

            if (newPermission === 'granted') {
                const result = await initializePushNotifications(userId);
                setIsSubscribed(result.isSubscribed);

                if (result.isSubscribed) {
                    setMessage({ type: 'success', text: 'Notifikasi aktif' });
                } else {
                    setMessage({ type: 'error', text: 'Gagal aktivasi push notification' });
                }
            } else {
                setMessage({ type: 'error', text: 'Izin notifikasi ditolak' });
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisableNotifications = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const success = await unsubscribeFromPushNotifications(registration);
                
                if (success) {
                    setIsSubscribed(false);
                    setMessage({ type: 'success', text: 'Notifikasi dinonaktifkan' });
                } else {
                    setMessage({ type: 'error', text: 'Gagal menonaktifkan notifikasi' });
                }
            }
        } catch (error) {
            console.error('Error disabling notifications:', error);
            setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="p-4 bg-card border border-border-subtle rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-muted shrink-0" />
                <div>
                    <p className="text-sm font-medium text-foreground">Push Not Terdeteksi</p>
                    <p className="text-xs text-muted">Browser Anda tidak mendukung notifikasi push.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        {isSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-muted" />}
                        Status Notifikasi
                    </h3>
                    <p className="text-xs text-muted">
                        {permission === 'granted' && isSubscribed 
                            ? 'Aktif — Anda akan menerima pengingat' 
                            : permission === 'denied'
                            ? 'Diblokir oleh browser'
                            : 'Belum diaktifkan'}
                    </p>
                </div>
                
                {permission === 'granted' && isSubscribed ? (
                    <button
                        onClick={handleDisableNotifications}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-card hover:bg-card-hover border border-border text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '...' : 'Matikan'}
                    </button>
                ) : (
                    <button
                        onClick={handleEnableNotifications}
                        disabled={isLoading || permission === 'denied'}
                        className="px-3 py-1.5 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '...' : 'Aktifkan'}
                    </button>
                )}
            </div>

            {message && (
                <div className={`p-3 rounded-lg border flex gap-2 items-start ${
                    message.type === 'success' ? 'bg-black border-white/20 text-white' : 
                    message.type === 'error' ? 'bg-black border-red-900/50 text-red-400' : 
                    'bg-black border-border-subtle text-muted'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                    <p className="text-xs">{message.text}</p>
                </div>
            )}

            <div className="pt-4 border-t border-border-subtle">
                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-3">Informasi Notifikasi</h4>
                <ul className="space-y-3">
                    <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-muted mt-2 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-foreground">Pengingat Utang</p>
                            <p className="text-[11px] text-muted leading-relaxed">Dapatkan notifikasi berkala untuk utang yang belum ditandai lunas.</p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}
