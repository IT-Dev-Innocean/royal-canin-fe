import { NextRequest, NextResponse } from "next/server";

const LIST_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/prize-redemptions`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const q = qs ? `?${qs}` : "?page=1";

  try {
    const apiRes = await fetch(`${LIST_URL}${q}`, {
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
          message:
            apiData.message ?? "Gagal mengambil daftar pencatatan penukaran.",
        },
        { status: apiRes.status },
      );
    }

    return NextResponse.json(apiData, { status: apiRes.status });
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
