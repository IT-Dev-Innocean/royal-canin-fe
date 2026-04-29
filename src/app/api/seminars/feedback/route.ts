import { NextRequest, NextResponse } from 'next/server';

/** Sesuaikan path ini jika backend memakai endpoint lain. */
const FEEDBACK_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/seminars/feedback`;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: 'Token tidak ditemukan.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  try {
    const apiRes = await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const apiData = await apiRes.json().catch(() => ({}));

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            (apiData as { message?: string }).message ??
            'Gagal mengirim tanggapan.',
          errors: (apiData as { errors?: unknown }).errors ?? null,
        },
        { status: apiRes.status }
      );
    }

    return NextResponse.json(apiData, { status: apiRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Tidak dapat terhubung ke server.' },
      { status: 502 }
    );
  }
}
