import { NextRequest, NextResponse } from "next/server";

const myQuestionsUrl = (seminarId: string) =>
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/seminars/${seminarId}/my-questions`;

/** Participant: GET daftar pertanyaan saya untuk seminar */
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

  try {
    const apiRes = await fetch(myQuestionsUrl(id), {
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
            "Gagal memuat pertanyaan.",
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
