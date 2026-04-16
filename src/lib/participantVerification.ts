/**
 * Menyamakan interpretasi status verifikasi dari API (boolean, 0/1, string,
 * atau hanya email_verified_at) agar ringkasan dan tabel konsisten.
 */
export function isParticipantAccountVerified(row: {
  is_account_verified?: unknown;
  email_verified_at?: unknown;
}): boolean {
  const v = row.is_account_verified;

  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === '') return false;
  }

  const ev = row.email_verified_at;
  if (ev != null && String(ev).trim() !== '') return true;

  return false;
}
