'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import {
  isActivityPlayComplete,
  type EventActivityListItem,
} from '@/app/event/activity/activityListTypes';

/** Halaman grid Poster A–D untuk aktivitas hub dengan kode ini. */
export const STUDY_CASE_POSTER_HUB_CODE = 'STUDY_CASE_POSTER';

const STUDY_CASE_SUB_POSTER_CODES = new Set([
  'STUDY_CASE_POSTER_A',
  'STUDY_CASE_POSTER_B',
  'STUDY_CASE_POSTER_C',
  'STUDY_CASE_POSTER_D',
]);

/** Gambar kartu di hub (grid) per kode aktivitas. */
const STUDY_CASE_POSTER_CARD_IMAGE: Record<string, string> = {
  STUDY_CASE_POSTER_A: '/assets/poster-a.webp',
  STUDY_CASE_POSTER_B: '/assets/poster-b.webp',
  STUDY_CASE_POSTER_C: '/assets/poster-c.webp',
  STUDY_CASE_POSTER_D: '/assets/poster-d.webp',
};

/** Label kartu pengganti nama dari API untuk sub-poster Study Case. */
const STUDY_CASE_SUB_DISPLAY_NAME: Record<string, string> = {
  STUDY_CASE_POSTER_A: 'Bobon & Vet',
  STUDY_CASE_POSTER_B: 'Lo Veterinary Clinic',
  STUDY_CASE_POSTER_C: 'Chrystal Pet Clinic',
  STUDY_CASE_POSTER_D: 'Medivet',
};

/** Subtitle (nama dokter/pemateri) per kode aktivitas. */
const STUDY_CASE_SUB_DISPLAY_SUBTITLE: Record<string, string> = {
  STUDY_CASE_POSTER_A: 'Dr. drh. Dwi Utari Rahmiati, M.Si',
  STUDY_CASE_POSTER_B: 'drh. Anggieta Setiawinardi',
  STUDY_CASE_POSTER_C: 'drh. Yolanda Natanael',
  STUDY_CASE_POSTER_D: 'drh. Rahma Prihutami',
};

function studyCaseSubPosterCardAlt(item: EventActivityListItem): string {
  const code = String(item.code ?? '').trim();
  const title = STUDY_CASE_SUB_DISPLAY_NAME[code] ?? item.name;
  const doctor = STUDY_CASE_SUB_DISPLAY_SUBTITLE[code];
  return doctor ? `${title} — ${doctor}` : title;
}

/** Judul halaman detail aktivitas: nama dokter untuk Study Case Poster A–D; selain itu `item.name`. */
export function studyCasePosterActivityPageTitle(item: {
  name: string;
  code?: string | null;
}): string {
  const code = String(item.code ?? '').trim();
  return STUDY_CASE_SUB_DISPLAY_SUBTITLE[code] ?? item.name;
}

/** Sub-aktivitas poster A–D (sama filter dengan kartu di hub). */
export function isStudyCaseSubPosterActivity(
  item: EventActivityListItem
): boolean {
  return STUDY_CASE_SUB_POSTER_CODES.has(String(item.code ?? '').trim());
}

export function pickStudyCasePosterSubs(
  all: EventActivityListItem[]
): EventActivityListItem[] {
  return all
    .filter((a) => STUDY_CASE_SUB_POSTER_CODES.has(String(a.code ?? '').trim()))
    .sort((x, y) => x.id - y.id);
}

/** Semua sub-poster A–D ada di list dan `play_status`-nya completed. */
export function areStudyCasePosterSubsAllComplete(
  list: EventActivityListItem[]
): boolean {
  for (const code of STUDY_CASE_SUB_POSTER_CODES) {
    const item = list.find((a) => String(a.code ?? '').trim() === code);
    if (!item || !isActivityPlayComplete(item.play_status)) return false;
  }
  return true;
}

export function isStudyCasePosterHubActivity(
  a: EventActivityListItem | null
): boolean {
  if (!a) return false;
  return String(a.code ?? '').trim() === STUDY_CASE_POSTER_HUB_CODE;
}

export type StudyCasePosterProps = {
  loading: boolean;
  activity: EventActivityListItem | null;
  /** Respons penuh dari GET /api/activities — dipakai untuk menyeragamkan kartu Poster A–D. */
  activitiesFromApi: EventActivityListItem[];
};

export default function StudyCasePoster({
  loading,
  activity,
  activitiesFromApi,
}: StudyCasePosterProps) {
  const posterSubActivities = useMemo(() => {
    if (!activity || !isStudyCasePosterHubActivity(activity)) return [];
    return pickStudyCasePosterSubs(activitiesFromApi);
  }, [activity, activitiesFromApi]);

  if (!isStudyCasePosterHubActivity(activity)) {
    return null;
  }

  return (
    <>
      {posterSubActivities.length > 0 && (
        <ul className='grid w-full max-w-lg grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7'>
          {posterSubActivities.map((a) => {
            const points = Math.max(
              0,
              Math.round(Number(a.default_reward_points) || 0)
            );
            const done = isActivityPlayComplete(a.play_status);
            const code = String(a.code ?? '').trim();
            const posterSrc = STUDY_CASE_POSTER_CARD_IMAGE[code];

            return (
              <li key={a.id} className='relative pt-3'>
                <Link
                  href={`/event/activity/${a.id}`}
                  className='relative flex min-h-30 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-rc-red bg-white px-1.5 pb-3 pt-6 text-center shadow-sm transition hover:bg-red-50/50 active:scale-[0.99] sm:min-h-34 sm:rounded-2xl sm:px-3 sm:pb-4'>
                  <span className='absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-rc-red px-2.5 py-0.5 text-xs font-bold leading-none text-white shadow-sm sm:px-3 sm:text-sm'>
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
                    {posterSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- aset statis lokal di /public
                      <img
                        src={posterSrc}
                        alt={studyCaseSubPosterCardAlt(a)}
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

      {!loading && posterSubActivities.length === 0 && activity && (
        <p className='text-center text-sm text-gray-500'>
          Sub-aktivitas poster belum tersedia.
        </p>
      )}
    </>
  );
}
