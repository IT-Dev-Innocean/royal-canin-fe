import { NextResponse } from "next/server";

const LOGIN_URL = "https://api.royalcaninvetsymposium.id/api/v1/login";

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

  const { email, password } = json as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email dan password wajib diisi." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            apiData.message ?? "Email atau password salah.",
          errors: apiData.errors ?? null,
        },
        { status: apiRes.status },
      );
    }

    const user = apiData.data?.user ?? apiData.data ?? apiData;
    const detail = user.detail ?? {};
    const qrCode = user.qr_code ?? apiData.data?.qr_code ?? null;

    const token =
      apiData.token ??
      apiData.data?.token ??
      apiData.access_token ??
      null;

    const mapped = {
      registrationId: (user.id ?? detail.id ?? "").toString(),
      fullName: user.name ?? user.full_name ?? "",
      email: user.email ?? "",
      phone: detail.phone ?? user.phone ?? "",
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

    return NextResponse.json(
      {
        success: true,
        message: apiData.message ?? "Login berhasil.",
        data: mapped,
        token,
      },
      { status: 200 },
    );
  } catch {
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
