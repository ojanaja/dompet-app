import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="border border-border-subtle bg-card rounded-xl p-8 text-center max-w-sm w-full">
        <p className="text-5xl font-semibold text-foreground mb-3">404</p>
        <p className="text-sm text-muted mb-6">Halaman tidak ditemukan</p>
        <Link
          href="/"
          className="inline-block px-5 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors active:scale-95"
        >
          Kembali
        </Link>
      </div>
    </div>
  );
}
