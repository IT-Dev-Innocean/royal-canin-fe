import { NextRequest, NextResponse } from "next/server";

const SEMINARS_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/seminars`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const query = request.nextUrl.searchParams.toString();
  const url = query ? `${SEMINARS_URL}?${query}` : SEMINARS_URL;

  try {
    const apiRes = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    const apiData = (await apiRes.json()) as Record<string, unknown>;

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (typeof apiData.message === "string" && apiData.message) ||
            "Gagal memuat data seminar.",
        },
        { status: apiRes.status },
      );
    }

    return NextResponse.json(apiData, { status: apiRes.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghubungi server.",
      },
      { status: 500 },
    );
  }
}
