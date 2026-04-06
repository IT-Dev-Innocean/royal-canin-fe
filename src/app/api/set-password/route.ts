import { NextResponse } from "next/server";
import type {
  SetPasswordRequest,
  SetPasswordSuccess,
} from "@/types/registration";

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

  const body = json as Partial<SetPasswordRequest>;

  if (!body.registrationId || !body.password || !body.confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Semua field wajib diisi." },
      { status: 422 },
    );
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      {
        success: false,
        message: "Kata sandi minimal 8 karakter.",
        errors: { password: ["Minimal 8 karakter"] },
      },
      { status: 422 },
    );
  }

  if (body.password !== body.confirmPassword) {
    return NextResponse.json(
      {
        success: false,
        message: "Kata sandi dan konfirmasi tidak cocok.",
        errors: { confirmPassword: ["Tidak cocok dengan kata sandi"] },
      },
      { status: 422 },
    );
  }

  const payload: SetPasswordSuccess = {
    success: true,
    message: "Kata sandi berhasil disimpan (mock).",
  };

  return NextResponse.json(payload, { status: 200 });
}
