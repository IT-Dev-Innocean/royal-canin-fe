import { NextResponse } from "next/server";
import type {
  RegistrationApiSuccess,
  RegistrationRequestBody,
} from "@/types/registration";

function isValidBody(
  b: Partial<RegistrationRequestBody>,
): b is RegistrationRequestBody {
  return (
    typeof b.email === "string" &&
    b.email.length > 0 &&
    typeof b.fullName === "string" &&
    b.fullName.length > 0 &&
    typeof b.phone === "string" &&
    b.phone.length > 0 &&
    typeof b.clinicName === "string" &&
    b.clinicName.length > 0 &&
    typeof b.noi === "string" &&
    b.noi.length > 0 &&
    typeof b.socialMedia === "string" &&
    typeof b.royalCaninClub === "string" &&
    typeof b.petTypes === "string" &&
    typeof b.scrubSize === "string" &&
    b.scrubSize.length > 0 &&
    typeof b.agreedToPrivacy === "boolean" &&
    b.agreedToPrivacy === true &&
    typeof b.agreedToAdminOnly === "boolean" &&
    b.agreedToAdminOnly === true
  );
}

/**
 * Mock layer — swap base URL to Laravel when ready:
 * process.env.REGISTRATION_API_URL ?? internal mock
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const body = json as Partial<RegistrationRequestBody>;

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        success: false,
        message: "Validasi gagal. Pastikan semua field wajib diisi dan persetujuan privasi dicentang.",
        errors: {
          form: ["Incomplete or invalid payload"],
        },
      },
      { status: 422 },
    );
  }

  const payload: RegistrationApiSuccess = {
    success: true,
    message: "Registrasi berhasil (mock). Data siap diteruskan ke Laravel.",
    data: {
      registrationId: `mock-${crypto.randomUUID()}`,
      submittedAt: new Date().toISOString(),
    },
  };

  return NextResponse.json(payload, { status: 201 });
}
