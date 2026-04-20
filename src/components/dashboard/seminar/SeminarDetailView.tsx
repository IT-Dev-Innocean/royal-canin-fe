'use client';

import { Icon } from '@iconify/react';
import type { SeminarDetail } from './types';
import { formatSeminarDateTimeUtc } from './seminar-date';

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

export interface SeminarDetailViewProps {
  data: SeminarDetail | null;
  loading: boolean;
  error: string | null;
}

export function SeminarDetailView({
  data,
  loading,
  error,
}: SeminarDetailViewProps) {
  const thumbSrc =
    data?.thumbnail && !String(data.thumbnail).startsWith('http')
      ? `${STORAGE_BASE}${data.thumbnail}`
      : (data?.thumbnail ?? null);

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <Icon icon='svg-spinners:ring-resize' className='h-8 w-8 text-rc-red' />
      </div>
    );
  }

  if (error) {
    return <p className='text-sm text-red-600'>{error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap gap-2'>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold ${
            data.is_active
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
          {data.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
        {data.qr_code && (
          <span className='inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[11px] sm:text-xs text-gray-700'>
            QR {data.qr_code}
          </span>
        )}
      </div>
      {thumbSrc && (
        <div className='overflow-hidden rounded-xl border border-gray-100 bg-gray-50'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt=''
            className='max-h-64 w-full object-cover sm:max-h-80'
          />
        </div>
      )}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Mulai
          </p>
          <p className='mt-1 text-xs sm:text-sm text-gray-800'>
            {formatSeminarDateTimeUtc(data.starts_at)}
          </p>
        </div>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Selesai
          </p>
          <p className='mt-1 text-xs sm:text-sm text-gray-800'>
            {formatSeminarDateTimeUtc(data.ends_at)}
          </p>
        </div>
      </div>

      <div>
        <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
          Judul
        </p>
        <p className='mt-1 text-base sm:text-lg font-bold text-gray-900'>
          {data.title}
        </p>
      </div>
      {data.description && (
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Deskripsi
          </p>
          <p className='mt-1 whitespace-pre-wrap text-[11px] sm:text-sm text-gray-700'>
            {data.description}
          </p>
        </div>
      )}
      {data.speakers && data.speakers.length > 0 && (
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Pembicara
          </p>
          <ul className='mt-2 space-y-2'>
            {data.speakers.map((s) => (
              <li
                key={s.id ?? s.name}
                className='rounded-lg border border-gray-100 bg-white px-3 py-2'>
                <p className='font-bold text-xs sm:text-base text-gray-900 mb-2'>
                  {s.name}
                </p>
                {s.title && (
                  <p className='text-[11px] sm:text-xs text-gray-500'>
                    {s.title}
                  </p>
                )}
                {s.bio && (
                  <p className='mt-3 text-[11px] sm:text-xs italic text-gray-600'>
                    {s.bio}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(data.questions_count != null ||
        data.reviews_count != null ||
        data.participants_count != null) && (
        <div className='rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Ringkasan
          </p>
          <ul className='mt-2 space-y-1 text-[11px] sm:text-xs'>
            {data.questions_count != null && (
              <li>Pertanyaan: {data.questions_count}</li>
            )}
            {data.reviews_count != null && (
              <li>Review: {data.reviews_count}</li>
            )}
            {data.participants_count != null && (
              <li>Partisipan: {data.participants_count}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
