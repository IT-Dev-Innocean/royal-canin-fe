/** datetime-local (2026-04-10T09:00) → API: 2026-04-10 09:00:00 */
export function toApiDateTime(local: string): string {
  if (!local) return "";
  const [d, t] = local.split("T");
  if (!d || !t) return local.trim();
  const time = t.length === 5 ? `${t}:00` : t;
  return `${d} ${time}`;
}

/** ISO dari API → nilai untuk input datetime-local (timezone lokal perangkat) */
export function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** ISO UTC (`…Z`) → nilai datetime-local yang menampilkan **jam UTC** (bukan jam lokal), selaras angka dengan string API. */
export function isoToUtcDatetimeLocalValue(
  iso: string | null | undefined,
): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** Menampilkan waktu dalam zona waktu perangkat (mis. WIB). */
export function formatSeminarDateTime(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

/** Menampilkan waktu dalam **UTC** — angka jam cocok dengan ISO `…T12:00:00.000000Z` (12.00), bukan konversi ke WIB (19.00). */
export function formatSeminarDateTimeUtc(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

/** WITA — Asia/Makassar (UTC+8). */
export function formatSeminarDateTimeWita(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      timeZone: "Asia/Makassar",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}
