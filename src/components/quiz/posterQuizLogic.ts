import type { ActivityScannableCode } from '@/app/event/activity/activityListTypes';
import type {
  PosterQuizChallenge,
  EventActivityListPayload,
} from './multipleChoiceTypes';

export const STUDY_CASE_POSTER_QUIZ_CODES = new Set([
  'STUDY_CASE_POSTER_A',
  'STUDY_CASE_POSTER_B',
  'STUDY_CASE_POSTER_C',
  'STUDY_CASE_POSTER_D',
]);

export function isStudyCasePosterQuizCode(code: string | undefined): boolean {
  return STUDY_CASE_POSTER_QUIZ_CODES.has(String(code ?? '').trim());
}

/** Teks modal/info untuk jawaban salah / `success: false` pada scan — tidak memakai `message` dari API. */
export const STUDY_CASE_POSTER_WRONG_SUBMIT_MESSAGE =
  'Jawaban salah. Silahkan cari jawaban lain.';

/**
 * Untuk aktivitas Study Case Poster (A–D), selalu tampilkan pesan FE.
 * Aktivitas lain tetap memakai pesan API bila ada.
 */
export function posterQuizWrongAnswerDisplayMessage(
  activityCode: string | undefined,
  apiMessage: string | undefined,
  fallback: string
): string {
  if (isStudyCasePosterQuizCode(activityCode)) {
    return STUDY_CASE_POSTER_WRONG_SUBMIT_MESSAGE;
  }
  const m = typeof apiMessage === 'string' ? apiMessage.trim() : '';
  return m || fallback;
}

export function studyCasePosterLetter(
  activityCode: string | undefined
): 'A' | 'B' | 'C' | 'D' | null {
  const c = String(activityCode ?? '').trim();
  if (c.endsWith('_A')) return 'A';
  if (c.endsWith('_B')) return 'B';
  if (c.endsWith('_C')) return 'C';
  if (c.endsWith('_D')) return 'D';
  return null;
}

/** Benar: sufiks `-T` atau `_T` pada `public_token`. Salah: `-F` atau `_F`. */
function publicTokenIsTrueVariant(token: string): boolean {
  const s = String(token).trim();
  return /[-_]T$/i.test(s);
}

function publicTokenIsFalseVariant(token: string): boolean {
  const s = String(token).trim();
  return /[-_]F$/i.test(s);
}

/** Label default jika tidak ada `question_text` / `label` di API atau pemetaan di bawah */
const LABEL_TRUE_FALLBACK = 'Benar';
const LABEL_FALSE_FALLBACK = 'Salah';

/**
 * Teks tombol tambahan untuk `public_token` (jika tidak dikirim lewat API per baris).
 * Tambahkan pasangan baru di sini bila sama pola backend.
 */
const POSTER_PUBLIC_TOKEN_DISPLAY_LABELS: Readonly<
  Partial<Record<string, string>>
> = {
  'ANSWER-1D-T': 'Radiografi x-ray',
  'ANSWER-1D-F': 'Pengecekan natif feses',
  'ANSWER-2D-T': 'Deobstipasi manual',
  'ANSWER-2D-F': 'Enterectomy',
  'ANSWER-3D-T': 'Prokinetik pencernaan',
  'ANSWER-3D-F': 'Pelunak feses',
  'ANSWER-1A-T': 'Dinding usus yang menebal',
  'ANSWER-1A-F': 'Dinding usus yang tipis',
  'ANSWER-2A-T': 'Reposisi dengan tobacco suture, Kolopeksi, Transeksi external sphincter ani',
  'ANSWER-2A-F': 'Herniorafi perineal, Enteroplikasi, Eksisi kelenjar anal (Anal sacculectomy)',
  'ANSWER-1B-T': 'Royal Canin Recovery',
  'ANSWER-1B-F': 'Royal Canin Gastrointestinal Wet',
  'ANSWER-4B-T': 'Meningkatkan motilitas saluran pencernaan',
  'ANSWER-4B-F': 'Meningkatkan absorbsi nutrisi pada pencernaan',
  'ANSWER-3A-T': 'Cisapride',
  'ANSWER-3A-F': 'Loperamide',
  'ANSWER-3B-T': 'Lumbar ke 5',
  'ANSWER-3B-F': 'Lumbar ke 8',
  'ANSWER-3C-T': 'Menurunkan berat badan sampai kurus',
  'ANSWER-3C-F': 'Mengganti makanan dengan Royal Canin Fiber Response',
};

function posterOptionDisplayLabel(
  row: ActivityScannableCode | undefined,
  token: string | null,
  fallback: string
): string {
  const fromApi =
    (typeof row?.question_text === 'string' && row.question_text.trim()) ||
    (typeof row?.label === 'string' && row.label.trim()) ||
    '';
  if (fromApi) return fromApi;
  const key = token ? String(token).trim() : '';
  const mapped = key ? POSTER_PUBLIC_TOKEN_DISPLAY_LABELS[key] : undefined;
  return mapped ?? fallback;
}

export type ResolvedPosterTrueFalseTokens = {
  trueToken: string | null;
  falseToken: string | null;
  trueLabel: string;
  falseLabel: string;
};

/**
 * Pasangkan jawaban dari `scannable_codes` + label tombol:
 * 1) Utama: `activity_question_id` = `challenge.question.id` (√ sufiks `-T`/`-F` atau `is_correct_answer`)
 * 2) Label: `question_text` / `label` dari API → lalu {@link POSTER_PUBLIC_TOKEN_DISPLAY_LABELS} → Benar/Salah
 * 3) Cadangan: pola `ANSWER-{position}{posterLetter}-{T|F}`
 */
export function resolvePosterTrueFalseTokens(
  codes: ActivityScannableCode[],
  posterLetter: 'A' | 'B' | 'C' | 'D',
  challenge: PosterQuizChallenge
): ResolvedPosterTrueFalseTokens {
  const qid = challenge.question.id;

  const forQuestion = codes.filter((c) => {
    if (c.activity_question_id == null) return false;
    if (Number(c.activity_question_id) !== Number(qid)) return false;
    const kind = String(c.code_kind ?? '').trim();
    return kind === '' || kind === 'answer_for_question';
  });

  let t: string | null = null;
  let f: string | null = null;
  let rowT: ActivityScannableCode | undefined;
  let rowF: ActivityScannableCode | undefined;

  const withCorrectFlag = forQuestion.filter(
    (c) => typeof c.is_correct_answer === 'boolean'
  );
  if (
    withCorrectFlag.some((c) => c.is_correct_answer === true) &&
    withCorrectFlag.some((c) => c.is_correct_answer === false)
  ) {
    const tr = withCorrectFlag.find((c) => c.is_correct_answer === true);
    const fr = withCorrectFlag.find((c) => c.is_correct_answer === false);
    rowT = tr;
    rowF = fr;
    t =
      typeof tr?.public_token === 'string' ? String(tr.public_token).trim() : null;
    f =
      typeof fr?.public_token === 'string' ? String(fr.public_token).trim() : null;
  }

  if (!t || !f) {
    for (const row of forQuestion) {
      const tok = String(row.public_token ?? '').trim();
      if (!tok) continue;
      if (!t && publicTokenIsTrueVariant(tok)) {
        t = tok;
        rowT = row;
      }
      if (!f && publicTokenIsFalseVariant(tok)) {
        f = tok;
        rowF = row;
      }
    }
  }

  if (!t || !f) {
    const pos = challenge.position;
    const wantT = `ANSWER-${pos}${posterLetter}-T`;
    const wantF = `ANSWER-${pos}${posterLetter}-F`;
    if (!t) {
      const m = codes.find((c) => String(c.public_token ?? '').trim() === wantT);
      if (m?.public_token) {
        t = String(m.public_token).trim();
        rowT = rowT ?? m;
      }
    }
    if (!f) {
      const m = codes.find((c) => String(c.public_token ?? '').trim() === wantF);
      if (m?.public_token) {
        f = String(m.public_token).trim();
        rowF = rowF ?? m;
      }
    }
  }

  const trueLabel = posterOptionDisplayLabel(rowT, t, LABEL_TRUE_FALLBACK);
  const falseLabel = posterOptionDisplayLabel(rowF, f, LABEL_FALSE_FALLBACK);

  return {
    trueToken: t ? String(t).trim() : null,
    falseToken: f ? String(f).trim() : null,
    trueLabel,
    falseLabel,
  };
}

export function isActivityListPayload(d: unknown): d is EventActivityListPayload {
  if (!d || typeof d !== 'object') return false;
  const o = d as Record<string, unknown>;
  if (o.success === false) return false;
  return Array.isArray(o.data);
}
