import { NextRequest, NextResponse } from 'next/server';

const ME_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/me`;
const RAW_RESPONSES_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/participant/raw-responses`;

type PayloadItem = { question: string; answer: string };

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

  const o = body as {
    payload?: { items?: unknown };
  };
  const items = o?.payload?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: 'payload.items wajib berisi minimal satu pasangan pertanyaan–jawaban.',
      },
      { status: 400 }
    );
  }

  const normalized: PayloadItem[] = [];
  for (const row of items) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const q = typeof r.question === 'string' ? r.question.trim() : '';
    const a = typeof r.answer === 'string' ? r.answer.trim() : '';
    if (!q) continue;
    normalized.push({ question: q, answer: a });
  }

  if (normalized.length === 0) {
    return NextResponse.json(
      { success: false, message: 'Setiap item wajib memiliki question (string).' },
      { status: 400 }
    );
  }

  try {
    const meRes = await fetch(ME_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    });

    const meData = (await meRes.json().catch(() => ({}))) as {
      data?: { id?: number };
      message?: string;
    };

    const userId = meData?.data?.id;
    if (!meRes.ok || userId == null || Number.isNaN(Number(userId))) {
      return NextResponse.json(
        {
          success: false,
          message:
            meData.message ?? 'Gagal mengambil data peserta. Silakan login ulang.',
        },
        { status: meRes.status === 401 ? 401 : meRes.ok ? 401 : meRes.status }
      );
    }

    const apiRes = await fetch(RAW_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        user_id: Number(userId),
        payload: { items: normalized },
      }),
    });

    const apiDataRaw = await apiRes.json().catch(() => ({}));

    if (!apiRes.ok) {
      const apiData = apiDataRaw as {
        message?: string;
        errors?: unknown;
      };
      return NextResponse.json(
        {
          success: false,
          message: apiData.message ?? 'Gagal menyimpan tanggapan.',
          errors: apiData.errors ?? null,
        },
        { status: apiRes.status }
      );
    }

    return NextResponse.json(apiDataRaw, { status: apiRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Tidak dapat terhubung ke server.' },
      { status: 502 }
    );
  }
}
