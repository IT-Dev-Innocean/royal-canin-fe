import { NextRequest, NextResponse } from "next/server";

const speakerUrl = (seminarId: string, speakerId: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/seminars/${seminarId}/speakers/${speakerId}`;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; speakerId: string }> },
) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { id, speakerId } = await params;

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { success: false, message: "ID seminar tidak valid." },
      { status: 422 },
    );
  }

  if (!speakerId || Number.isNaN(Number(speakerId))) {
    return NextResponse.json(
      { success: false, message: "ID pembicara tidak valid." },
      { status: 422 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Body request tidak valid." },
      { status: 400 },
    );
  }

  try {
    const apiRes = await fetch(speakerUrl(id, speakerId), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: formData,
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? "Gagal memperbarui pembicara.",
          errors: apiData.errors ?? null,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; speakerId: string }> },
) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { id, speakerId } = await params;

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { success: false, message: "ID seminar tidak valid." },
      { status: 422 },
    );
  }

  if (!speakerId || Number.isNaN(Number(speakerId))) {
    return NextResponse.json(
      { success: false, message: "ID pembicara tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(speakerUrl(id, speakerId), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const raw = await apiRes.text();
    let apiData: Record<string, unknown> = {};
    if (raw) {
      try {
        apiData = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        apiData = {};
      }
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (typeof apiData.message === "string" && apiData.message) ||
            "Gagal menghapus pembicara.",
        },
        { status: apiRes.status },
      );
    }

    if (Object.keys(apiData).length === 0) {
      return NextResponse.json({ success: true }, { status: apiRes.status });
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
