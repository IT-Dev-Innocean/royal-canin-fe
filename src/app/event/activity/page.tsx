'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import {
  isActivityPlayComplete,
  type EventActivityListItem,
} from './activityListTypes';

function isActivityList(
  d: unknown
): d is { success: boolean; data: EventActivityListItem[] } {
  if (!d || typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  if (o.success === false) return false;
  return Array.isArray(o.data);
}

export default function EventActivityListPage() {
  const [items, setItems] = useState<EventActivityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
        setItems([]);
        return;
      }
      if (!isActivityList(json) || !json.data?.length) {
        setError(
          isActivityList(json) && json.data?.length === 0
            ? 'Belum ada aktivitas tersedia.'
            : 'Data aktivitas tidak valid.'
        );
        setItems(isActivityList(json) ? json.data : []);
        return;
      }
      setItems(json.data);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className='mx-auto flex w-full max-w-lg flex-col items-stretch px-4 py-8 pb-24 text-black sm:px-6 md:py-4'>
      <div className='mb-6 w-full max-w-lg text-center'>
        <h1 className='mt-0 text-xl font-bold text-rc-red'>Kuis & Permainan</h1>
      </div>

      {loading && (
        <div className='flex min-h-[40vh] flex-col items-center justify-center py-12'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
          <p className='mt-2 text-sm text-gray-500'>Memuat aktivitas…</p>
        </div>
      )}

      {!loading && error && (
        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center'>
          <p className='text-sm text-amber-900'>{error}</p>
          <button
            type='button'
            onClick={() => void load()}
            className='mt-3 text-sm font-bold text-rc-red underline'>
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className='grid w-full max-w-lg grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7'>
          {items.map((a) => {
            const points = Math.max(
              0,
              Math.round(Number(a.default_reward_points) || 0)
            );
            const done = isActivityPlayComplete(a.play_status);

            return (
              <li key={a.id} className='relative pt-3'>
                <Link
                  href={`/event/activity/${a.id}`}
                  className='relative flex min-h-30 cursor-pointer flex-col items-center  justify-center rounded-xl border-2 border-rc-red bg-white px-5 pb-3 pt-4 text-center shadow-sm transition hover:bg-red-50/50 active:scale-[0.99] sm:min-h-34 sm:rounded-2xl sm:px-3 sm:pb-4'>
                  <span className='absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-rc-red px-2.5 py-0.5 text-xs sm:text-sm font-bold leading-none text-white shadow-sm sm:px-3'>
                    {points.toLocaleString('id-ID')} Poin
                  </span>
                  {done && (
                    <span
                      className='mb-1 flex h-6 w-6 shrink-0 items-center justify-center text-emerald-500 sm:mb-1.5 sm:h-7 sm:w-7'
                      aria-label='Selesai'>
                      {/* <Icon icon='mdi:check-circle' className='h-full w-full' /> */}
                      <Icon
                        icon='mdi:check-circle'
                        className='h-12 w-12 text-rc-red'
                      />
                    </span>
                  )}
                  <span
                    className={`line-clamp-3 w-full text-center text-sm font-bold leading-snug text-gray-900 sm:text-base ${done ? '' : 'pt-0.5'}`}>
                    {a.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className='mt-8 w-full max-w-md'>
        <Link
          href='/event'
          className='block w-[50%] mx-auto rounded-xl bg-rc-red py-3 text-center font-bold text-white shadow-lg transition-all hover:bg-rc-red/80 active:scale-95'>
          Kembali
        </Link>
      </div>
    </main>
  );
}
