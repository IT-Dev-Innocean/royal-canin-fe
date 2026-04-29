'use client';

import type { RefObject } from 'react';
import { Icon } from '@iconify/react';

export type ScannerOpenProps = {
  onClose: () => void;
  isSubmitting: boolean;
  scannerHostRef: RefObject<HTMLDivElement | null>;
  cameraError: string | null;
  manualCode: string;
  manualError: string | null;
  onManualCodeInput: (value: string) => void;
  onSubmitManual: () => void | Promise<void>;
};

export default function ScannerOpen({
  onClose,
  isSubmitting,
  scannerHostRef,
  cameraError,
  manualCode,
  manualError,
  onManualCodeInput,
  onSubmitManual,
}: ScannerOpenProps) {
  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
        onClick={onClose}
      />
      <div
        className='relative z-10 max-h-[min(92dvh,100%)] w-full max-w-lg touch-pan-y overflow-y-auto overscroll-y-contain rounded-t-2xl bg-white p-5 pb-[max(4rem,env(safe-area-inset-bottom,0px))] shadow-2xl [scrollbar-gutter:stable] sm:max-h-[min(90dvh,44rem)] sm:rounded-2xl'
        style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className='mb-4 flex items-center justify-between gap-2'>
          <div>
            <h2 className='text-lg font-bold text-gray-900'>Scan QR Code</h2>
            <p className='mt-0.5 text-xs text-gray-500'>
              Tampilkan kode di lokasi agar poin tercatat
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            disabled={isSubmitting}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <div className='relative overflow-hidden rounded-xl bg-black'>
          <div ref={scannerHostRef} className='min-h-[220px] w-full' />
          {isSubmitting && (
            <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/75'>
              <Icon
                icon='svg-spinners:ring-resize'
                className='h-10 w-10 text-white'
              />
              <p className='mt-2 text-sm text-white'>Memproses…</p>
            </div>
          )}
        </div>
        {cameraError && (
          <p className='my-2 text-center text-xs text-amber-800'>{cameraError}</p>
        )}

        <p className='mt-3 text-center text-xs leading-relaxed text-gray-500'>
          Arahkan kamera ke QR code usher reward. Pastikan kode terbaca jelas.
        </p>

        <div className='my-5 flex items-center gap-3'>
          <div className='h-px min-w-0 flex-1 bg-gray-200' />
          <span className='shrink-0 text-[11px] font-semibold text-gray-400'>
            atau
          </span>
          <div className='h-px min-w-0 flex-1 bg-gray-200' />
        </div>

        <div className='rounded-xl border border-gray-100 bg-slate-50/90 p-4'>
          <p className='text-xs font-bold text-gray-800'>Masukkan kode manual</p>
          <p className='mt-0.5 text-xs leading-relaxed text-gray-500'>
            Jika kamera tidak tersedia, izin ditolak, atau pemindaian gagal,
            ketik kode yang ada di bawah QR poster, lalu klik tombol kirim.
          </p>
          {manualError && (
            <p className='mt-2 text-center text-xs text-red-600'>{manualError}</p>
          )}
          <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch'>
            <input
              type='text'
              value={manualCode}
              onChange={(e) =>
                onManualCodeInput(e.target.value.toUpperCase())
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSubmitting) {
                  e.preventDefault();
                  void onSubmitManual();
                }
              }}
              disabled={isSubmitting}
              autoComplete='off'
              autoCapitalize='characters'
              spellCheck={false}
              placeholder='Kode public_token di QR'
              className='min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm text-gray-900 shadow-inner outline-none transition focus:border-rc-red focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-100'
            />
            <button
              type='button'
              disabled={isSubmitting}
              onClick={() => void onSubmitManual()}
              className='shrink-0 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5'>
              Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
