import { NextRequest, NextResponse } from "next/server";

const ACTIVITIES_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/activities`;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Token tidak ditemukan." },
      { status: 401 },
    );
  }

  try {
    const apiRes = await fetch(ACTIVITIES_URL, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const text = await apiRes.text();
    if (!apiRes.ok) {
      let message = "Gagal memuat daftar aktivitas.";
      try {
        const j = JSON.parse(text) as { message?: string };
        if (typeof j.message === "string" && j.message) message = j.message;
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { success: false, message },
        { status: apiRes.status },
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, message: "Respons server kosong." },
        { status: 502 },
      );
    }

    try {
      const data = JSON.parse(text) as unknown;
      return NextResponse.json(data, { status: 200 });
    } catch {
      return NextResponse.json(
        { success: false, message: "Format respons tidak valid." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server." },
      { status: 500 },
    );
  }
}
