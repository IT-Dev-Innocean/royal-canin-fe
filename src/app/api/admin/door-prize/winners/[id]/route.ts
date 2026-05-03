import { NextRequest, NextResponse } from "next/server";

const winnerUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/door-prize/winners/${id}`;

export async function DELETE(
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
      { success: false, message: "ID pemenang tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(winnerUrl(id), {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const raw = await apiRes.text();
    let apiData: Record<string, unknown> = {};
    if (raw.trim()) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          apiData = parsed as Record<string, unknown>;
        }
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
            "Gagal menghapus pemenang doorprize.",
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
        message: "Pemenang doorprize berhasil dihapus.",
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
