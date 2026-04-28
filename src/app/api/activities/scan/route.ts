import { NextRequest, NextResponse } from "next/server";

const SCAN_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/activities/scan`;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Body request tidak valid." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Body request tidak valid." },
      { status: 400 },
    );
  }

  const { token, activity_question_id } = body as {
    token?: unknown;
    activity_question_id?: unknown;
  };

  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json(
      { success: false, message: "Token aktivitas tidak tersedia." },
      { status: 422 },
    );
  }

  const payload: Record<string, unknown> = { token: token.trim() };
  if (activity_question_id !== undefined) {
    payload.activity_question_id = activity_question_id;
  }

  try {
    const apiRes = await fetch(SCAN_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
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
        /* non-JSON body */
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
              : "Gagal memulai sesi aktivitas."),
          errors: parsed.errors ?? null,
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
