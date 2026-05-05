/**
 * Helper untuk memformat informasi check-in partisipan.
 *
 * Sumber data: field `check_in` pada respons partisipan, yang biasanya berupa
 * object `{ checked_in_at: ISOString, ... }` ketika partisipan sudah check-in,
 * atau `null`/`undefined` ketika belum.
 */

interface CheckInLike {
  checked_in_at?: unknown;
}

/**
 * Format ISO datetime ke locale Indonesia, contoh: `"05 Mei 2026, 07.09"`.
 * Mengembalikan `'-'` bila ISO tidak valid (mempertahankan perilaku lama
 * di `ParticipantDetailModal`).
 */
export function formatIsoSubmittedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Ambil tanggal/waktu check-in dalam format lokal Indonesia.
 * Mengembalikan `'-'` bila data tidak ada / tidak valid.
 */
export function formatCheckInAt(c: unknown): string {
  if (c && typeof c === 'object' && 'checked_in_at' in c) {
    const at = (c as CheckInLike).checked_in_at;
    if (typeof at === 'string') {
      return formatIsoSubmittedAt(at);
    }
  }
  return '-';
}

/**
 * Label gabungan check-in untuk ditampilkan di UI / diekspor ke CSV.
 * Contoh keluaran:
 * - `"Sudah check-in — 05 Mei 2026, 07.09"`
 * - `"Sudah check-in"` (jika tanggal tidak tersedia / tidak valid)
 * - `"Belum check-in"` (jika belum check-in)
 */
export function formatCheckInLabel(c: unknown): string {
  if (c == null || c === false) return 'Belum check-in';
  const at = formatCheckInAt(c);
  if (at && at !== '-') return `Sudah check-in — ${at}`;
  return 'Sudah check-in';
}
