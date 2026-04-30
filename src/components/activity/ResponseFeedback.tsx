'use client';

import { Icon } from '@iconify/react';

export type ResponseFeedbackProps = {
  correct: boolean;
  message: string;
  points: number | null;
  limitLockout?: boolean;
  onDismiss: () => void;
  onRetryScan: () => void;
};

export default function ResponseFeedback({
  correct,
  message,
  points,
  limitLockout,
  onDismiss,
  onRetryScan,
}: ResponseFeedbackProps) {
  return (
    <div className='fixed inset-0 z-60 flex items-center justify-center p-6'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onDismiss}
      />
      <div className='relative w-full max-w-[320px] rounded-2xl bg-white p-7 text-center shadow-2xl'>
        {correct ? (
          <>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-rc-red'>
              <Icon icon='mdi:check-bold' className='h-8 w-8' />
            </div>
            <h3 className='text-xl font-bold text-gray-900'>
              Poin tercatat!
            </h3>
            {typeof points === 'number' && (
              <div className='mx-auto mt-2 flex w-[150px] items-center justify-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3'>
                <Icon icon='twemoji:coin' className='h-8 w-8' />
                <div>
                  <p className='text-2xl font-extrabold tabular-nums text-yellow-800'>
                    {points}
                  </p>
                </div>
              </div>
            )}
            <p className='mt-2 text-xs text-gray-500'>{message}</p>
            <button
              type='button'
              onClick={onDismiss}
              className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#b50015]'>
              {limitLockout ? 'Tutup' : 'Lanjut'}
            </button>
          </>
        ) : (
          <>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-rc-red'>
              <Icon icon='mdi:close-thick' className='h-8 w-8' />
            </div>
            <h3 className='text-xl font-bold text-gray-900'>Belum Tepat</h3>
            <p className='mt-2 text-[12px] leading-relaxed text-gray-500'>
              {message}
            </p>
            {limitLockout ? (
              <button
                type='button'
                onClick={onDismiss}
                className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b50015]'>
                Tutup
              </button>
            ) : (
              <button
                type='button'
                onClick={onRetryScan}
                className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b50015]'>
                Coba Scan Ulang
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
