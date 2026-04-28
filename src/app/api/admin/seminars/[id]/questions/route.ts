import { NextRequest, NextResponse } from "next/server";

const questionsUrl = (seminarId: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/seminars/${seminarId}/questions`;

/** GET daftar pertanyaan — opsi query `speaker_id` (filter pembicara), selaras dokumentasi Admin. */
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
      { success: false, message: "ID seminar tidak valid." },
      { status: 422 },
    );
  }

  const query = request.nextUrl.searchParams.toString();
  const url = query ? `${questionsUrl(id)}?${query}` : questionsUrl(id);

  try {
    const apiRes = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
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
            "Gagal mengambil daftar pertanyaan.",
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
