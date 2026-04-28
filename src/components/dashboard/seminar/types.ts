export interface SeminarSpeaker {
  id?: number;
  name: string;
  title?: string | null;
  bio?: string | null;
  photo?: string | null;
}

/** Baris pertanyaan dari GET admin …/seminars/{id}/questions */
export interface SeminarQuestionEntry {
  id: number;
  question: string;
  speaker_id?: number;
  speaker?: { id?: number; name?: string; title?: string | null };
  user?: { id?: number; name?: string; email?: string };
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SeminarDetail {
  id: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  qr_code?: string | null;
  qr_image_path?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  speakers?: SeminarSpeaker[];
  questions_count?: number;
  reviews_count?: number;
  participants_count?: number;
}

export interface SeminarRow {
  id: number;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  speakers?: SeminarSpeaker[];
  questions_count?: number;
  reviews_count?: number;
  participants_count?: number;
}
