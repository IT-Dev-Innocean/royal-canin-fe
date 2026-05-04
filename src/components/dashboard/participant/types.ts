export interface ParticipantDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  detail?: {
    phone?: string;
    clinic_name?: string;
    sales_responsible?: string;
    rc_club?: boolean;
    pet?: string;
    scrub_size?: string;
    outlet_number?: number | null;
    social_media_account?: string;
    points?: number;
  };
  qr_code?: {
    code: string;
    image_path?: string;
    is_active?: boolean;
  } | null;
  check_in?: unknown;
  raw_response_submitted_at?: string | null;
  rcc_member?: {
    member_id?: string;
    points?: number;
    role?: string;
    updated_at?: string;
  } | null;
}
