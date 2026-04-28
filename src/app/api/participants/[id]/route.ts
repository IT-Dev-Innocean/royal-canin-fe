import { NextRequest, NextResponse } from "next/server";

const BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/participants`;

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
      { success: false, message: "ID partisipan tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(`${BASE}/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? "Gagal mengambil detail partisipan.",
        },
        { status: apiRes.status },
      );
    }

    return NextResponse.json(apiData, { status: 200 });
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

export async function PATCH(
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
      { success: false, message: "ID partisipan tidak valid." },
      { status: 422 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const apiRes = await fetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? "Gagal memperbarui data partisipan.",
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

/** Laravel sering mendefinisikan `PUT/PATCH .../participants/{id}` sama; teruskan metode ke API. */
export async function PUT(
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
      { success: false, message: "ID partisipan tidak valid." },
      { status: 422 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const apiRes = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? "Gagal memperbarui data partisipan.",
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
      { success: false, message: "ID partisipan tidak valid." },
      { status: 422 },
    );
  }

  try {
    const apiRes = await fetch(`${BASE}/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? "Gagal menghapus partisipan.",
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
