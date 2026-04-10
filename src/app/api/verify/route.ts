import { NextResponse } from "next/server";

const SETUP_PASSWORD_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/setup-password`;

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

  const { phone } = json as { phone?: string };

  if (!phone || phone.trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "Masukkan Nomor Telepon Anda." },
      { status: 422 },
    );
  }

  const trimmed = phone.trim();

  try {
    const apiRes = await fetch(SETUP_PASSWORD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        phone: trimmed,
        password: trimmed,
        password_confirmation: trimmed,
      }),
    });

    const apiData = await apiRes.json();

    console.log("[verify] Raw API response:", JSON.stringify(apiData));

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            apiData.message ||
            "Data tidak ditemukan. Pastikan nomor telepon sudah terdaftar.",
          errors: apiData.errors,
        },
        { status: apiRes.status },
      );
    }

    const user = apiData.data?.user ?? apiData.data ?? apiData;
    const detail = user.detail ?? {};
    const qrCode = user.qr_code ?? apiData.data?.qr_code ?? null;

    const token =
      apiData.token ??
      apiData.access_token ??
      apiData.data?.token ??
      null;

    const mapped = {
      registrationId: (user.id ?? detail.id ?? "").toString(),
      fullName: user.name ?? user.full_name ?? "",
      email: user.email ?? "",
      phone: detail.phone ?? user.phone ?? trimmed,
      clinicName: detail.clinic_name ?? "",
      noi: (detail.outlet_number ?? detail.noi ?? "").toString(),
      points: detail.points ?? 0,
      qrCode: qrCode
        ? {
            code: qrCode.code ?? "",
            imagePath: qrCode.image_path ?? "",
            isActive: qrCode.is_active ?? false,
          }
        : null,
    };

    console.log("[verify] Token found:", token ? "yes" : "no");

    return NextResponse.json(
      {
        success: true,
        message: apiData.message ?? "Data ditemukan.",
        data: mapped,
        token,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[verify] Fetch error:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}
