export type ActivityScannableCode = {
  id?: number | null;
  public_token: string;
  code_kind?: string | null;
  is_active?: boolean | null;
  activity_question_id?: number | null;
  is_correct_answer?: boolean | null;
  /** Opsional dari API untuk label opsi jawaban poster (fallback ke pemetaan lokal oleh token). */
  question_text?: string | null;
  label?: string | null;
};

/** API: `play_status` hanya `completed` atau `uncompleted`. */
export type ActivityPlayStatus = 'completed' | 'uncompleted';
export function isActivityPlayComplete(play_status: unknown): boolean {
  if (typeof play_status !== 'string') return false;
  return play_status.trim().toLowerCase() === 'completed';
}

/** API menyatakan belum selesai (bukan sama dengan "bukan completed" saat field kosong). */
export function isActivityPlayExplicitlyUncompleted(
  play_status: unknown
): boolean {
  if (typeof play_status !== 'string') return false;
  return play_status.trim().toLowerCase() === 'uncompleted';
}

export type EventActivityListItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  flow_type: string;
  questions_per_session: number;
  default_reward_points: number;
  play_status?: ActivityPlayStatus | null;
  start_session_token?: string | null;
  scannable_codes?: ActivityScannableCode[] | null;
};

/** Info keanggotaan RCC yang ikut dikirim oleh GET activities (opsional). */
export type ActivitiesRccMemberInfo = {
  member_id?: string | null;
  points?: number | null;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function looksLikeActivityItem(v: unknown): v is EventActivityListItem {
  if (!isPlainObject(v)) return false;
  return typeof v.id === 'number' && typeof v.code === 'string';
}

/**
 * Normalisasi field `data` dari GET `/api/v1/activities` (proxy `/api/activities`).
 * Mendukung:
 * - Array langsung `[{ id, code, ... }]`
 * - Paginator Laravel `{ data: [...], current_page, ... }`
 * - Object berkunci numerik (terkadang dari serialisasi PHP yang bukan list JSON),
 *   termasuk varian baru yang juga membawa entri non-numerik seperti `rcc_member`.
 */
export function normalizeActivitiesPayloadData(
  data: unknown
): EventActivityListItem[] | null {
  if (data == null) return null;
  if (Array.isArray(data)) {
    return data as EventActivityListItem[];
  }
  if (!isPlainObject(data)) return null;
  if (Array.isArray(data.data)) {
    return data.data as EventActivityListItem[];
  }
  const numericKeys = Object.keys(data).filter((k) => /^\d+$/.test(k));
  if (numericKeys.length === 0) return null;
  const items = numericKeys
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => data[k])
    .filter(looksLikeActivityItem);
  return items;
}

/** Ekstrak `rcc_member` dari payload `data` GET activities (jika ada). */
export function extractRccMemberFromActivitiesPayload(
  data: unknown
): ActivitiesRccMemberInfo | null {
  if (!isPlainObject(data)) return null;
  const raw = data.rcc_member;
  if (!isPlainObject(raw)) return null;
  const memberId =
    typeof raw.member_id === 'string'
      ? raw.member_id
      : raw.member_id == null
        ? null
        : String(raw.member_id);
  const points = typeof raw.points === 'number' ? raw.points : null;
  return { member_id: memberId, points };
}

/** Parse body JSON sukses dari GET activities. `null` jika struktur tidak dikenali atau `success === false`. */
export function parseActivitiesListResponse(
  json: unknown
): EventActivityListItem[] | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (o.success === false) return null;
  return normalizeActivitiesPayloadData(o.data);
}

/** Sama seperti `parseActivitiesListResponse`, tetapi juga mengembalikan info `rcc_member` jika tersedia. */
export function parseActivitiesListResponseWithMember(json: unknown): {
  activities: EventActivityListItem[] | null;
  rccMember: ActivitiesRccMemberInfo | null;
} {
  if (!json || typeof json !== 'object') {
    return { activities: null, rccMember: null };
  }
  const o = json as Record<string, unknown>;
  if (o.success === false) {
    return { activities: null, rccMember: null };
  }
  return {
    activities: normalizeActivitiesPayloadData(o.data),
    rccMember: extractRccMemberFromActivitiesPayload(o.data),
  };
}

export function pickStartSessionToken(
  a: Pick<EventActivityListItem, 'start_session_token' | 'scannable_codes'>
): string | null {
  if (a.start_session_token && typeof a.start_session_token === 'string') {
    return a.start_session_token;
  }
  const codes = a.scannable_codes ?? [];
  const match = codes.find(
    (c) => c.code_kind === 'start_session' && c.is_active !== false
  );
  return match?.public_token ?? null;
}
