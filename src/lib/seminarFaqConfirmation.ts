/** Payload disimpan di sessionStorage sebelum redirect ke halaman konfirmasi FAQ seminar. */
export const SEMINAR_FAQ_CONFIRMATION_KEY = "rc_seminar_faq_confirmation_v1";

export interface SeminarFaqConfirmationPayload {
  message: string;
  points_earned: number;
  question: string;
  speaker_name: string;
}

export function saveSeminarFaqConfirmation(payload: SeminarFaqConfirmationPayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SEMINAR_FAQ_CONFIRMATION_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function readSeminarFaqConfirmation(): SeminarFaqConfirmationPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SEMINAR_FAQ_CONFIRMATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SeminarFaqConfirmationPayload;
  } catch {
    return null;
  }
}

export function clearSeminarFaqConfirmation() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SEMINAR_FAQ_CONFIRMATION_KEY);
  } catch {
    /* ignore */
  }
}
