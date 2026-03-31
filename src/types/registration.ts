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
