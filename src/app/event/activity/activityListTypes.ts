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
