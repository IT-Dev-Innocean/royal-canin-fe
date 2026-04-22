'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import {
  pickStartSessionToken,
  type EventActivityListItem,
} from '../activityListTypes';

// TODO(backend): hapus setelah GET /activities mengembalikan start_session token.
// Fallback sementara untuk testing, dipakai kalau response API belum menyertakan
// start_session_token / scannable_codes untuk aktivitas tersebut.
const START_TOKEN_FALLBACK: Record<number, string> = {
  2: 'DMY-GP-START', // Gastro Produk
};

function resolveStartToken(a: EventActivityListItem): string | null {
  return pickStartSessionToken(a) ?? START_TOKEN_FALLBACK[a.id] ?? null;
}

function isActivityList(
  d: unknown
): d is { success: boolean; data: EventActivityListItem[] } {
  if (!d || typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  if (o.success === false) return false;
  return Array.isArray(o.data);
}

type ScanResponse = {
  success?: boolean;
  message?: string;
  data?: {
    session?: {
      id?: number;
      status?: string;
    } | null;
    resumed?: boolean;
  } | null;
};

export default function EventActivityEntryPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.id;
  const id =
    typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;

  const [activity, setActivity] = useState<EventActivityListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (Number.isNaN(id)) {
      setError('Aktivitas tidak ditemukan.');
      setActivity(null);
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setError('Sesi habis, silakan login kembali.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/activities', {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logoutParticipantHard();
        return;
      }
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(
          (json as { message?: string }).message ?? 'Gagal memuat aktivitas.'
        );
        setActivity(null);
        return;
      }
      if (!isActivityList(json)) {
        setError('Data tidak valid.');
        setActivity(null);
        return;
      }
      const found = json.data.find((a) => a.id === id) ?? null;
      if (!found) {
        setError('Aktivitas ini tidak tersedia.');
        setActivity(null);
        return;
      }
      setActivity(found);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const startSessionToken = activity ? resolveStartToken(activity) : null;

  const handleStart = useCallback(async () => {
    if (!activity) return;
    setStartError(null);

    const token = getToken();
    if (!token) {
      logoutParticipantHard();
      return;
    }

    const scanToken = resolveStartToken(activity);
    if (!scanToken) {
      setStartError(
        'Token mulai sesi belum tersedia untuk aktivitas ini. Hubungi admin.'
      );
      return;
    }

    setStarting(true);
    try {
      const res = await fetch('/api/activities/scan', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: scanToken }),
      });

      if (res.status === 401) {
        logoutParticipantHard();
        return;
      }

      const json = (await res.json().catch(() => ({}))) as ScanResponse;

      if (!res.ok || json.success === false) {
        setStartError(json.message ?? 'Gagal memulai sesi aktivitas.');
        return;
      }

      const sessionId = json.data?.session?.id;
      const target = `/event/activity/quiz?activityId=${activity.id}${
        sessionId ? `&sessionId=${sessionId}` : ''
      }`;
      router.push(target);
    } catch {
      setStartError('Tidak dapat terhubung ke server.');
    } finally {
      setStarting(false);
    }
  }, [activity, router]);

  if (Number.isNaN(id)) {
    return (
      <main className='mx-auto w-full max-w-lg px-4 py-2 pb-8 sm:px-6 md:py-4'>
        <p className='text-sm text-red-600'>ID aktivitas tidak valid.</p>
        <Link
          href='/event/activity'
          className='mt-4 block text-sm font-bold text-rc-red'>
          Kembali ke Kuis & Permainan
        </Link>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-lg px-4 py-2 pb-8 sm:px-6 md:py-4'>
      <div className='mb-6 text-center w-full max-w-lg'>
        <h1 className='text-xl font-bold mt-0 text-rc-red'>Kuis & Permainan</h1>
      </div>

      {loading && (
        <div className='flex flex-col items-center py-12'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
        </div>
      )}

      {!loading && error && !activity && (
        <p className='text-sm text-center text-amber-800'>{error}</p>
      )}

      {activity && (
        <div className='space-y-4'>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
            <p className='text-center text-lg font-bold text-gray-900'>
              {activity.name}
            </p>
            <p className='mt-3 text-center text-sm leading-relaxed text-gray-600'>
              {activity.description}
            </p>
          </div>

          {startError && (
            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center'>
              <p className='text-sm text-amber-900'>{startError}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <button
              type='button'
              onClick={() => void handleStart()}
              disabled={starting || !startSessionToken}
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-rc-red py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60'>
              {starting ? (
                <>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 text-white'
                  />
                  Memulai sesi…
                </>
              ) : (
                'Mulai sesi'
              )}
            </button>

            {!startSessionToken && !starting && (
              <p className='text-center text-[11px] text-gray-500'>
                Token mulai sesi belum tersedia untuk aktivitas ini.
              </p>
            )}

            <Link
              href='/event/activity'
              className='block w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3.5 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-100'>
              Kembali
            </Link>
          </div>
        </div>
      )}

      {!loading && !activity && !error && (
        <p className='text-sm text-gray-500'>Tidak ada data.</p>
      )}
    </main>
  );
}
