import { NextRequest, NextResponse } from "next/server";

const questionsUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/activities/${id}/questions`;

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
      { success: false, message: "ID aktivitas tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(questionsUrl(id), {
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

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (body &&
            typeof body === "object" &&
            "message" in body &&
            typeof (body as { message: unknown }).message === "string"
              ? (body as { message: string }).message
              : null) || "Gagal memuat daftar pertanyaan.",
        },
        { status: apiRes.status },
      );
    }

    if (body == null) {
      return NextResponse.json(
        { success: false, message: "Respons server tidak valid." },
        { status: 502 },
      );
    }

    return NextResponse.json(body, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}

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
      { success: false, message: "ID aktivitas tidak valid." },
      { status: 422 },
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

  try {
    const apiRes = await fetch(questionsUrl(id), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const raw = await apiRes.text();
    let apiData: Record<string, unknown> = {};
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          apiData = parsed as Record<string, unknown>;
        }
      } catch {
        // non-JSON
      }
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (typeof apiData.message === "string" && apiData.message) ||
            (apiRes.status >= 500
              ? "Server sedang bermasalah. Silakan coba lagi."
              : "Gagal menambah pertanyaan."),
          errors: apiData.errors ?? null,
        },
        { status: apiRes.status },
      );
    }

    if (Object.keys(apiData).length === 0) {
      return NextResponse.json(
        { success: true, message: "Pertanyaan berhasil ditambahkan." },
        { status: apiRes.status || 201 },
      );
    }

    return NextResponse.json(apiData, { status: apiRes.status || 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}
