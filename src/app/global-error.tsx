'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-black text-white antialiased min-h-screen flex items-center justify-center p-6">
        <div className="border border-[#333] bg-[#111] rounded-xl p-8 text-center max-w-sm w-full">
          <h2 className="text-base font-medium mb-2">Something went wrong</h2>
          <p className="text-sm text-[#888] mb-6">{error.message || 'Unexpected error occurred.'}</p>
          <button
            onClick={reset}
            className="px-5 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors active:scale-95"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
