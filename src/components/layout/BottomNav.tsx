'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, PieChart, List, Settings } from 'lucide-react';

const navItems = [
    { href: '/', icon: MessageCircle, label: 'Chat' },
    { href: '/dashboard', icon: PieChart, label: 'Dashboard' },
    { href: '/log', icon: List, label: 'Log' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe-bottom">
            <nav className="flex justify-around items-center bg-background/80 backdrop-blur-md border-t border-border-subtle h-[72px] px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 py-2 px-4 outline-none"
                        >
                            <Icon
                                className={`w-[18px] h-[18px] transition-colors duration-150 ${
                                    isActive ? "text-foreground" : "text-muted-foreground"
                                }`}
                                strokeWidth={isActive ? 2 : 1.5}
                            />
                            <span className={`text-[10px] transition-colors duration-150 ${
                                isActive ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
