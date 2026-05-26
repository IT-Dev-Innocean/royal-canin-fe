'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import {
  areStudyCasePosterSubsAllComplete,
  STUDY_CASE_POSTER_HUB_CODE,
} from '@/components/activity/StudyCasePoster';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import {
  isActivityPlayComplete,
  parseActivitiesListResponse,
  type EventActivityListItem,
} from './activityListTypes';

function sortActivitiesById(
  list: EventActivityListItem[]
): EventActivityListItem[] {
  return [...list].sort((a, b) => a.id - b.id);
}

/** Tidak ditampilkan di grid daftar aktivitas (tetap ada di payload API). */
const HIDDEN_ACTIVITY_CODES = new Set([
  'STUDY_CASE_POSTER_A',
  'STUDY_CASE_POSTER_B',
  'STUDY_CASE_POSTER_C',
  'STUDY_CASE_POSTER_D',
]);

function filterVisibleActivities(
  list: EventActivityListItem[]
): EventActivityListItem[] {
  return list.filter(
    (a) => !HIDDEN_ACTIVITY_CODES.has(String(a.code ?? '').trim())
  );
}

function normalizeActivityList(
  list: EventActivityListItem[]
): EventActivityListItem[] {
  return sortActivitiesById(filterVisibleActivities(list));
}

const ACTIVITY_MENU_ICONS = [
  '/assets/icon-1-gf.png',
  '/assets/icon-2-gp.png',
  '/assets/icon-3-rcc.png',
  '/assets/icon-4-pnp.png',
  '/assets/icon-5-scp.png',
  '/assets/icon-6-pawgp.png',
] as const;

export default function EventActivityListPage() {
  const [rawActivities, setRawActivities] = useState<EventActivityListItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(
    () => normalizeActivityList(rawActivities),
    [rawActivities]
  );

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
      const list = parseActivitiesListResponse(json);
      if (!res.ok) {
        setError(
          (json as { message?: string }).message ?? 'Gagal memuat aktivitas.'
        );
        setRawActivities([]);
        return;
      }
      if (list === null) {
        setError('Data aktivitas tidak valid.');
        setRawActivities([]);
        return;
      }
      if (list.length === 0) {
        setError('Belum ada aktivitas tersedia.');
        setRawActivities([]);
        return;
      }
      setRawActivities(list);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setRawActivities([]);
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
        <h1 className='mt-0 text-xl font-bold text-rc-red'>Kuis & Aktivitas</h1>
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

      {!loading && !error && rawActivities.length > 0 && items.length === 0 && (
        <p className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900'>
          Tidak ada aktivitas yang ditampilkan (daftar dari server hanya berisi item
          tersembunyi).
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className='grid w-full max-w-lg grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7'>
          {items.map((a, index) => {
            const points = Math.max(
              0,
              Math.round(Number(a.default_reward_points) || 0)
            );
            const code = String(a.code ?? '').trim();
            const done =
              code === STUDY_CASE_POSTER_HUB_CODE
                ? areStudyCasePosterSubsAllComplete(rawActivities)
                : isActivityPlayComplete(a.play_status);
            const menuIcon = ACTIVITY_MENU_ICONS[index];

            return (
              <li key={a.id} className='relative pt-3'>
                <Link
                  href={`/event/activity/${a.id}`}
                  className='relative flex min-h-30 cursor-pointer flex-col items-center  justify-center rounded-xl border-2 border-rc-red bg-white px-5 pb-3 pt-4 text-center shadow-sm transition hover:bg-red-50/50 active:scale-[0.99] sm:min-h-34 sm:rounded-2xl sm:px-3 sm:pb-4'>
                  <span className='absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-rc-red px-2.5 py-0.5 text-xs sm:text-sm font-bold leading-none text-white shadow-sm sm:px-3'>
                    {points.toLocaleString('id-ID')} Score
                  </span>
                  {done && (
                    <span
                      className='pointer-events-none absolute right-1.5 top-1.5 z-20 flex items-center justify-center sm:right-2 sm:top-2'
                      aria-label='Selesai'>
                      <Icon
                        icon='mdi:check-circle'
                        className='h-6 w-6 text-rc-red sm:h-7 sm:w-7'
                      />
                    </span>
                  )}
                  <div
                    className={`flex w-full flex-1 flex-col items-center justify-center ${done ? '' : 'pt-0.5'}`}>
                    {menuIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element -- aset statis lokal di /public
                      <img
                        src={menuIcon}
                        alt={a.name}
                        className='h-24 w-full max-w-44 object-contain object-center sm:h-28'
                      />
                    ) : (
                      <span className='line-clamp-3 w-full text-center text-sm font-bold leading-snug text-gray-900 sm:text-base'>
                        {a.name}
                      </span>
                    )}
                  </div>
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
