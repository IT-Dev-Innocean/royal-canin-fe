/**
 * API contract: registration payload (aligned with future Laravel API).
 * Field names use camelCase for JSON; backend may map to snake_case.
 */
export type RoyalCaninClubAnswer = "ya" | "tidak";

export type PetTypeOption =
  | "kucing"
  | "anjing"
  | "kucing_anjing"
  | "tidak_punya"
  | "lainnya";

export type ScrubSize = "S" | "M" | "L" | "XL" | "XXL" | "3XL" | "4XL";

export interface RegistrationRequestBody {
  email: string;
  fullName: string;
  phone: string;
  clinicName: string;
  noi: string;
  socialMedia: string;
  royalCaninClub: RoyalCaninClubAnswer;
  petTypes: PetTypeOption;
  scrubSize: ScrubSize;
  agreedToPrivacy: boolean;
  agreedToAdminOnly: boolean;
}

export interface RegistrationSuccessData {
  registrationId: string;
  submittedAt: string;
}

export interface RegistrationApiSuccess {
  success: true;
  message: string;
  data: RegistrationSuccessData;
}

export interface RegistrationApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type RegistrationApiResponse = RegistrationApiSuccess | RegistrationApiError;

/* ─── Verification (lookup by phone/email) ─── */

export interface VerifyLookupRequest {
  identifier: string;
}

export interface QrCodeData {
  code: string;
  imagePath: string;
  isActive: boolean;
}

export interface VerifiedUserData {
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  clinicName: string;
  noi: string;
  role?: string;
  points?: number;
  qrCode?: QrCodeData | null;
}

export interface VerifyLookupSuccess {
  success: true;
  message: string;
  data: VerifiedUserData;
  token?: string;
}

export interface VerifyLookupError {
  success: false;
  message: string;
}

export type VerifyLookupResponse = VerifyLookupSuccess | VerifyLookupError;

/* ─── Set password ─── */

export interface SetPasswordRequest {
  registrationId: string;
  password: string;
  confirmPassword: string;
}

export interface SetPasswordSuccess {
  success: true;
  message: string;
}

export interface SetPasswordError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type SetPasswordResponse = SetPasswordSuccess | SetPasswordError;
