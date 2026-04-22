import { NextRequest, NextResponse } from "next/server";

const base = (id: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/activities/sessions/${id}`;

export async function GET(
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
    const apiRes = await fetch(base(id), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const raw = await apiRes.text();
    let body: unknown = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = null;
      }
    }

    const errMessage = (b: unknown): string | null => {
      if (!b || typeof b !== "object" || Array.isArray(b)) return null;
      const m = (b as Record<string, unknown>).message;
      return typeof m === "string" && m ? m : null;
    };

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            errMessage(body) ||
            (apiRes.status >= 500
              ? "Server aktivitas sedang bermasalah. Silakan coba lagi."
              : "Gagal memuat detail sesi."),
        },
        { status: apiRes.status },
      );
    }

    if (body == null) {
      return NextResponse.json(
        { success: false, message: "Respons server kosong." },
        { status: 502 },
      );
    }

    return NextResponse.json(body, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server." },
      { status: 500 },
    );
  }
}
