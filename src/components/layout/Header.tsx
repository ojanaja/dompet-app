'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

const PAGE_CONFIG: Record<string, { title: string }> = {
  '/': { title: 'Chat' },
  '/dashboard': { title: 'Dashboard' },
  '/log': { title: 'Log' },
  '/settings': { title: 'Settings' },
};

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const config = PAGE_CONFIG[pathname] || { title: 'dompet' };

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-safe-top">
      <div className="bg-background/80 backdrop-blur-md border-b border-border-subtle px-5 h-14 flex items-center justify-between">
        <h1 className="text-sm font-medium text-foreground tracking-tight">
          {config.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded-md hover:bg-card text-muted hover:text-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-[10px] font-semibold text-background">{userInitial}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
