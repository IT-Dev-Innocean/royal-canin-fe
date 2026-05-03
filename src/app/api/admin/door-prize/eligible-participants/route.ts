import { NextRequest, NextResponse } from "next/server";

const ELIGIBLE_PARTICIPANTS_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/door-prize/eligible-participants`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const backendUrl = new URL(ELIGIBLE_PARTICIPANTS_URL);
  searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });
  if (!backendUrl.searchParams.has("page")) {
    backendUrl.searchParams.set("page", "1");
  }

  try {
    const apiRes = await fetch(backendUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const apiData = (await apiRes.json()) as Record<string, unknown>;

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (typeof apiData.message === "string" && apiData.message) ||
            "Gagal mengambil pool doorprize.",
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
