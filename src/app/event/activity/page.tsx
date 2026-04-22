'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import type { EventActivityListItem } from './activityListTypes';

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
    <main className='mx-auto flex w-full h-[calc(100vh-200px)] max-w-lg flex-col items-center justify-center px-4 py-2 pb-8 sm:px-6 md:py-4 text-black'>
      <div className='mb-6 text-center w-full max-w-lg'>
        <h1 className='text-xl font-bold mt-0 text-rc-red'>Kuis & Permainan</h1>
      </div>

      {loading && (
        <div className='flex flex-col items-center justify-center py-12'>
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
        <ul className='grid grid-cols-2 gap-4 sm:gap-5'>
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/event/activity/${a.id}`}
                className='flex min-h-26 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border-2 border-rc-red bg-white px-2.5 py-3 text-center shadow-sm transition active:scale-[0.99] hover:bg-red-50/40 sm:min-h-30 sm:px-3 sm:py-4'>
                <span className='line-clamp-3 text-center text-xs font-bold leading-tight text-gray-900 sm:text-sm'>
                  {a.name}
                </span>
                {/* <span className='line-clamp-4 w-full text-[10px] leading-snug text-gray-600 sm:text-[11px]'>
                  {a.description}
                </span> */}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className='mt-8 w-full max-w-md pb-20'>
        <Link
          href='/event'
          className='block w-[50%] mx-auto rounded-xl bg-rc-red py-3 text-center font-bold text-white shadow-lg transition-all hover:bg-rc-red/80 active:scale-95'>
          Kembali
        </Link>
      </div>
    </main>
  );
}
