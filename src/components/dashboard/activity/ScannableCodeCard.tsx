'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { Icon } from '@iconify/react';
import type { ScannableCode } from './types';

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}/storage/`;

function resolveQrUrl(path: string | null | undefined): string | null {
  const p = path?.trim();
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return p;
  return `${STORAGE_BASE}${p}`;
}

function formatPoints(v: number | null | undefined): string {
  if (v == null) return '0 Poin';
  return `${v} Poin`;
}

export interface ScannableCodeCardProps {
  code: ScannableCode;
  variant: 'usher_reward' | 'system_qa';
}

export function ScannableCodeCard({ code, variant }: ScannableCodeCardProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const modalTitleId = useId();
  const modalDescId = useId();
  const qrUrl = resolveQrUrl(code.qr_image_path);
  const rewardLabel = formatPoints(code.reward_points_override);
  const maxRedemptions = code.max_redemptions_per_user ?? '—';

  const closeModal = useCallback(() => setQrOpen(false), []);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [qrOpen, closeModal]);

  return (
    <li className='flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:flex-row'>
      <div className='flex w-full max-w-full sm:max-w-26 mb-3 sm:mb-0 shrink-0 flex-col items-center sm:items-stretch gap-2'>
        <div className='flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden self-center rounded-lg border border-gray-100 bg-white'>
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrUrl}
              alt={`QR ${code.public_token}`}
              className='h-full w-full object-contain p-1.5'
              loading='lazy'
            />
          ) : (
            <Icon icon='mdi:qrcode' className='h-8 w-8 text-gray-300' />
          )}
        </div>
        {qrUrl && (
          <button
            type='button'
            onClick={() => setQrOpen(true)}
            className='inline-flex w-[50%] sm:w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-bold text-gray-800 shadow-sm transition hover:border-rc-red/40 hover:bg-red-50/50 hover:text-rc-red'>
            <Icon icon='mdi:fullscreen' className='h-3.5 w-3.5' />
            Show QR
          </button>
        )}
      </div>

      {qrOpen && qrUrl && (
        <div
          className='fixed inset-0 z-120 flex items-end justify-center p-0 sm:p-4 sm:items-center'
          role='presentation'
          onClick={closeModal}>
          <div className='absolute inset-0 bg-black/60 backdrop-blur-[2px]' />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescId}
            onClick={(e) => e.stopPropagation()}
            className='relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-white p-5 shadow-2xl sm:max-w-md'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <h2
                  id={modalTitleId}
                  className='text-base font-bold text-gray-900'>
                  QR — scan untuk peserta
                </h2>
                <p
                  id={modalDescId}
                  className='mt-0.5 font-mono text-xs text-gray-600'>
                  {code.public_token || '—'}
                </p>
              </div>
              <button
                type='button'
                onClick={closeModal}
                className='shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800'
                aria-label='Tutup'>
                <Icon icon='mdi:close' className='h-5 w-5' />
              </button>
            </div>
            <div className='mt-4 flex justify-center rounded-xl border border-gray-100 bg-white p-6 sm:p-8'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt={`Kode QR ${code.public_token}`}
                className='h-auto w-full max-w-[min(90vw,320px)] object-contain sm:max-w-[min(85vw,360px)]'
                loading='eager'
              />
            </div>
            <p className='mt-3 text-center text-[11px] text-gray-500'>
              Pindai kode di atas. Tutup jika sudah.
            </p>
          </div>
        </div>
      )}

      <div className='min-w-0 flex-1 space-y-2'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              code.is_active
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-200 text-gray-600'
            }`}>
            {code.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
          {variant === 'system_qa' && code.code_kind !== 'start_session' && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                code.is_correct_answer
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}>
              {code.is_correct_answer ? 'Jawaban benar' : 'Jawaban salah'}
            </span>
          )}
          {variant === 'usher_reward' && (
            <span className='inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700'>
              Activity #{code.activity_id}
            </span>
          )}
          {variant === 'system_qa' && (
            <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-bold text-gray-700'>
              {code.code_kind}
            </span>
          )}
        </div>

        <div>
          <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
            Public token
          </p>
          <p className='truncate font-mono text-xs sm:text-sm font-semibold text-gray-900'>
            {code.public_token || '—'}
          </p>
        </div>

        <dl className='grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]'>
          <div>
            <dt className='text-gray-400'>Reward Points</dt>
            <dd className='font-bold text-gray-800'>{rewardLabel}</dd>
          </div>
          <div>
            <dt className='text-gray-400'>Max Redemption</dt>
            <dd className='font-bold text-gray-800 tabular-nums'>
              {maxRedemptions}
            </dd>
          </div>
        </dl>
      </div>
    </li>
  );
}
