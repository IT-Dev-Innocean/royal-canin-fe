'use client';

import { Icon } from '@iconify/react';

const ID_CARD_BG = '/assets/id-card.png';

export type ParticipantIdCardViewProps = {
  name: string;
  clinic: string;
  nio: string;
  qrImageSrc: string | null;
  qrCodeLabel?: string;
};

export function ParticipantIdCardView({
  name,
  clinic,
  nio,
  qrImageSrc,
  qrCodeLabel = 'Kode peserta',
}: ParticipantIdCardViewProps) {
  return (
    <div className='id-card-outer relative w-full max-w-[360px] shrink-0 select-none sm:max-w-[400px] print:max-w-none'>
      <div className='relative w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 print:rounded-none print:shadow-none print:ring-0'>
        <div className='relative aspect-2/3 w-full max-w-full min-h-0 max-h-full print:overflow-hidden'>
          {/* eslint-disable-next-line @next/next/no-img-element -- print & URL statis */}
          <img
            src={ID_CARD_BG}
            alt=''
            className='absolute inset-0 h-full w-full object-cover object-top'
          />

          <div
            className='absolute inset-0 flex flex-col items-center
            pt-[28%] pb-[14%] sm:pt-[30%] sm:pb-[16%]
            print:justify-center print:gap-2 print:px-[2%] print:pt-0 print:pb-0'>
            <div className='mt-8 flex w-[95%] max-w-[420px] flex-col items-center gap-1 text-center sm:mt-8 print:mt-0 print:w-full print:max-w-[92%] print:gap-2'>
              <p className='text-balance text-[0.7rem] font-bold leading-snug text-gray-900 sm:text-sm print:text-[24pt] print:leading-tight'>
                {name}
              </p>
              <p className='text-balance text-[0.65rem] font-semibold text-gray-800 sm:text-xs print:text-[20pt] print:leading-snug'>
                {clinic}
              </p>
              <p className='text-[0.6rem] font-semibold tabular-nums text-gray-700 sm:text-[11px] print:text-[18pt]'>
                NIO: {nio}
              </p>
            </div>

            <div className='mt-2 flex aspect-square w-[55%] min-w-0 shrink-0 items-center justify-center sm:mt-1 print:mt-0'>
              {qrImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImageSrc}
                  alt={qrCodeLabel}
                  className='h-full w-full object-contain'
                />
              ) : (
                <div className='flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/80'>
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
