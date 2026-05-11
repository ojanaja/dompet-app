/**
 * Format angka ke format Rupiah Indonesia.
 * @example formatRupiah(50000) → "Rp50.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp${Math.abs(amount).toLocaleString('id-ID')}`;
}

/**
 * Format tanggal ke format Indonesia pendek.
 * @example formatDate(new Date()) → "11 Mei 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format tanggal ke format relatif (hari ini, kemarin, dll).
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(d);
}

/**
 * Format waktu singkat.
 * @example formatTime(new Date()) → "08:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
