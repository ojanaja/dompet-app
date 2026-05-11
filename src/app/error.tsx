'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="border border-border-subtle bg-card rounded-xl p-8 text-center max-w-sm w-full">
        <h2 className="text-base font-medium text-foreground mb-2">Error</h2>
        <p className="text-sm text-muted mb-6">{error.message || 'Terjadi kesalahan.'}</p>
        <button
          onClick={reset}
          className="px-5 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors active:scale-95"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
