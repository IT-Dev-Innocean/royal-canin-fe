/**
 * Tipe data aktivitas event (admin).
 * Disesuaikan dengan respons API GET/POST/PUT /admin/activities.
 */
export interface EventActivityQuestion {
  id: number;
  activity_id: number;
  body: string;
  reward_points?: number | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ScannableCodeKind = 'usher_reward' | 'system_qa' | (string & {});

export interface ScannableCode {
  id: number;
  activity_id: number;
  activity_question_id?: number | null;
  public_token: string;
  code_kind: ScannableCodeKind;
  /** Tersedia untuk kode jenis `answer_for_question` (dari soal terkait). */
  question_text?: string | null;
  qr_image_path?: string | null;
  is_active: boolean;
  is_correct_answer?: boolean | null;
  max_redemptions_per_user?: number | null;
  reward_points_override?: number | null;
  sort_order?: number | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EventActivityRow {
  id: number;
  title: string;
  name?: string | null;
  /** Kode unik, biasanya disinkron dari nama di backend. */
  code?: string | null;
  description?: string | null;
  flow_type?: string | null;
  content?: string | null;
  is_active?: boolean;
  order?: number | null;
  questions_per_session?: number | null;
  default_reward_points?: number | null;
  questions?: EventActivityQuestion[] | null;
  scannable_codes?: ScannableCode[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EventActivitiesPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: EventActivityRow[];
}

export function extractActivitiesList(
  json: unknown
): EventActivitiesPagination | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  if (j.success === false) return null;
  const d = j.data;
  if (!d || typeof d !== 'object') return null;
  const container = d as Record<string, unknown>;
  if (Array.isArray(container)) {
    const rows = container as EventActivityRow[];
    return {
      current_page: 1,
      last_page: 1,
      per_page: rows.length || 1,
      total: rows.length,
      data: rows,
    };
  }
  const dataArr = container.data;
  if (Array.isArray(dataArr)) {
    return {
      current_page: Number(container.current_page) || 1,
      last_page: Number(container.last_page) || 1,
      per_page: Number(container.per_page) || dataArr.length || 15,
      total: Number(container.total) ?? dataArr.length,
      data: dataArr as EventActivityRow[],
    };
  }
  return null;
}

/** Samakan berbagai bentuk respons API ke `questions`. */
function normalizeActivityQuestionsRow(
  d: Record<string, unknown>
): EventActivityRow {
  const raw = d as unknown as EventActivityRow;
  const direct = raw.questions;
  const alt = (d.activity_questions ?? d['activity-questions']) as
    | EventActivityRow['questions']
    | undefined;

  if (Array.isArray(direct) && direct.length > 0) {
    return raw;
  }
  if (Array.isArray(alt) && alt.length > 0) {
    return { ...raw, questions: alt };
  }
  if (Array.isArray(direct)) {
    return raw;
  }
  if (Array.isArray(alt)) {
    return { ...raw, questions: alt };
  }
  return raw;
}

export function extractActivityDetail(
  json: unknown
): EventActivityRow | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  if (j.success === false) return null;
  const d = j.data;
  if (d && typeof d === 'object' && 'id' in d) {
    return normalizeActivityQuestionsRow(d as Record<string, unknown>);
  }
  return null;
}
