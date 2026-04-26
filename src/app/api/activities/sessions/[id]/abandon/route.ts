import { NextRequest, NextResponse } from "next/server";

const abandonUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/activities/sessions/${id}/abandon`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { id } = await params;

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { success: false, message: "ID sesi tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(abandonUrl(id), {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const raw = await apiRes.text();
    let parsed: Record<string, unknown> = {};
    if (raw) {
      try {
        const j: unknown = JSON.parse(raw);
        if (j && typeof j === "object" && !Array.isArray(j)) {
          parsed = j as Record<string, unknown>;
        }
      } catch {
        /* non-JSON */
      }
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (typeof parsed.message === "string" && parsed.message) ||
            (apiRes.status >= 500
              ? "Server aktivitas sedang bermasalah. Silakan coba lagi."
              : "Gagal menyerah dari sesi."),
        },
        { status: apiRes.status },
      );
    }

    if (Object.keys(parsed).length === 0) {
      return NextResponse.json(
        { success: false, message: "Respons server tidak valid." },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed, { status: apiRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server." },
      { status: 500 },
    );
  }
}
