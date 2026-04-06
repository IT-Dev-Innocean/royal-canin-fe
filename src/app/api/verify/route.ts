import { NextResponse } from "next/server";
import type {
  VerifyLookupRequest,
  VerifyLookupSuccess,
} from "@/types/registration";

const MOCK_USERS = [
  {
    registrationId: "mock-abc-123",
    fullName: "drh. Angga Wirantoko Hadi Saputro",
    email: "angga@1stline-jago.com",
    phone: "081281117540",
    clinicName: "Pawstone",
    noi: "12345678",
  },
  {
    registrationId: "mock-def-456",
    fullName: "drh. Budi Santoso",
    email: "budi@klinik-hewan.id",
    phone: "081234567890",
    clinicName: "Klinik Hewan Sejahtera",
    noi: "87654321",
  },
];

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

  const { identifier } = json as Partial<VerifyLookupRequest>;

  if (!identifier || identifier.trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "Masukkan Nomor WhatsApp atau Email Anda." },
      { status: 422 },
    );
  }

  const normalised = identifier.trim().toLowerCase();
  const found = MOCK_USERS.find(
    (u) =>
      u.phone === normalised ||
      u.email.toLowerCase() === normalised,
  );

  if (!found) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Data tidak ditemukan. Pastikan Nomor WhatsApp atau Email sudah terdaftar.",
      },
      { status: 404 },
    );
  }

  const payload: VerifyLookupSuccess = {
    success: true,
    message: "Data ditemukan.",
    data: found,
  };

  return NextResponse.json(payload, { status: 200 });
}
