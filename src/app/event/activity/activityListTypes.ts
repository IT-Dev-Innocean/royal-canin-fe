export type ActivityScannableCode = {
  id?: number | null;
  public_token: string;
  code_kind?: string | null;
  is_active?: boolean | null;
  activity_question_id?: number | null;
  is_correct_answer?: boolean | null;
};

export type EventActivityListItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  flow_type: string;
  questions_per_session: number;
  default_reward_points: number;
  /**
   * Opsional: token yang dikirim saat memulai sesi via POST /activities/scan.
   * Backend disarankan menyediakan salah satu bentuk di bawah:
   *  - start_session_token: string
   *  - scannable_codes: [{ public_token, code_kind: 'start_session', is_active }]
   */
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
