'use client';

import { Icon } from '@iconify/react';

/**
 * Cetak: ukuran kertas 5,4 × 8,6 cm diatur oleh `injectPrintStyles` di ParticipantIdCardModal.
 * Opsi dialog "Pages: Custom → 1" tidak bisa disetel dari kode; gunakan jika pratinjau > 1 lembar.
 * Font DIN Pro untuk **nama** & **klinik** hanya diterapkan saat @media print (lihat `.id-card-print-name` / `.id-card-print-clinic`).
 */
const ID_CARD_BG = '/assets/bg-id-card.png';

export type ParticipantIdCardViewProps = {
  name: string;
  clinic: string;
  qrImageSrc: string | null;
  qrCodeLabel?: string;
};

export function ParticipantIdCardView({
  name,
  clinic,
  qrImageSrc,
  qrCodeLabel = 'Kode peserta',
}: ParticipantIdCardViewProps) {
  return (
    <div
      data-print-id-card
      className='id-card-outer relative w-full max-w-[360px] shrink-0 select-none sm:max-w-[400px] print:max-w-none print:h-full print:rounded-none'>
      {/* Cetak: wajib rantai h-full; tanpa id-card-surface h-full, anak print:h-full jadi 0px → pratinjau putih. */}
      <div className='id-card-surface relative h-auto w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 print:h-full print:rounded-none print:shadow-none print:ring-0'>
        <div className='id-card-face relative aspect-2/3 w-full max-w-full min-h-0 max-h-full print:aspect-auto print:min-h-full print:h-full print:overflow-hidden print:rounded-none'>
          {/* eslint-disable-next-line @next/next/no-img-element -- print & URL statis */}
          <img
            src={ID_CARD_BG}
            alt=''
            className='absolute inset-0 h-full w-full rounded-none object-contain object-top print:rounded-none print:object-contain print:object-top'
          />

          {/*
            Layar: padding % mengikuti artwork.
            Cetak 5,4×8,6 cm: font pt kecil, vertikal rapi (nama → klinik → NIO → QR) tanpa overlap.
          */}
          <div
            className='absolute inset-0 flex flex-col items-center
            pt-[28%] pb-[14%] sm:pt-[30%] sm:pb-[16%]
            print:justify-start print:gap-1
            print:pt-[32%] print:pb-[8%] print:px-[3%]'>
            <div
              className='mt-24 flex w-[95%] max-w-[420px] flex-col items-center gap-1 text-center
              sm:mt-28
              print:mt-16 print:w-full print:max-w-full print:gap-0.5 print:px-0.5 print:shrink-0'>
              <p
                className='id-card-print-name text-balance wrap-break-words text-[0.7rem] font-bold leading-snug text-gray-900
                sm:text-sm
                print:text-[6pt] print:font-bold print:leading-tight print:text-gray-900 print:mb-0.5'>
                {name}
              </p>
              <p
                className='id-card-print-clinic text-balance wrap-break-words text-[0.65rem] font-semibold text-gray-800
                sm:text-xs
                print:text-[4.5pt] print:font-medium print:leading-snug print:text-gray-800'>
                {clinic}
              </p>
            </div>

            <div
              className='mt-0 flex aspect-square w-[55%] min-w-0 shrink-0 items-center justify-center
              sm:mt-1
              print:mt-0 print:aspect-square print:w-[44%] print:min-h-0 print:max-w-[2.2cm]'>
              {qrImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImageSrc}
                  alt={qrCodeLabel}
                  className='h-full w-full object-contain print:object-contain'
                />
              ) : (
                <div className='flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/80 print:hidden'>
                  <Icon icon='mdi:qrcode' className='h-20 w-20 text-gray-300' />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
