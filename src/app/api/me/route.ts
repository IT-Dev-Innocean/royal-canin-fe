import { NextRequest, NextResponse } from "next/server";

const ME_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/me`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  try {
    const apiRes = await fetch(ME_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? "Gagal mengambil data profil.",
        },
        { status: apiRes.status },
      );
    }

    return NextResponse.json(apiData, { status: 200 });
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
