import { NextRequest, NextResponse } from "next/server";

const questionItemUrl = (activityId: string, questionId: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/activities/${activityId}/questions/${questionId}`;

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; questionId: string }> },
) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { id, questionId } = await params;

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { success: false, message: "ID aktivitas tidak valid." },
      { status: 422 },
    );
  }

  if (!questionId || Number.isNaN(Number(questionId))) {
    return NextResponse.json(
      { success: false, message: "ID pertanyaan tidak valid." },
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
    const apiRes = await fetch(questionItemUrl(id, questionId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      cache: "no-store",
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
              : "Gagal memperbarui pertanyaan."),
          errors: apiData.errors ?? null,
        },
        { status: apiRes.status },
      );
    }

    if (Object.keys(apiData).length === 0) {
      return NextResponse.json(
        { success: true, message: "Pertanyaan berhasil diperbarui." },
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

/** DELETE — hapus satu pertanyaan pada aktivitas. */
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; questionId: string }> },
) {
  const authHeader = _request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  const { id, questionId } = await params;

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { success: false, message: "ID aktivitas tidak valid." },
      { status: 422 },
    );
  }

  if (!questionId || Number.isNaN(Number(questionId))) {
    return NextResponse.json(
      { success: false, message: "ID pertanyaan tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(questionItemUrl(id, questionId), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const text = await apiRes.text();
    let apiData: Record<string, unknown> = {};
    if (text.trim()) {
      try {
        apiData = JSON.parse(text) as Record<string, unknown>;
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
            "Gagal menghapus pertanyaan.",
        },
        { status: apiRes.status },
      );
    }

    if (typeof apiData.success === "boolean") {
      return NextResponse.json(apiData, { status: apiRes.status });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pertanyaan berhasil dihapus.",
        data: null,
      },
      { status: apiRes.status },
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
