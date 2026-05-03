'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useEffect, useId, useState } from 'react';

const PROMO_DISMISS_STORAGE_KEY = 'rc_popup_campaign_dismissed';

// Cutoff: 4 Mei 2026 00:00 Asia/Jakarta (UTC+7) = 3 Mei 2026 17:00 UTC.
// Sebelum cutoff → image "2 hari lagi"; setelah cutoff → image "1 hari lagi".
const COUNTDOWN_SWITCH_TO_ONE_DAY_MS = Date.UTC(2026, 4, 3, 17, 0, 0);

function getPopupCampaignImageSrc(): string {
  return Date.now() >= COUNTDOWN_SWITCH_TO_ONE_DAY_MS
    ? '/assets/popup-countdown-1days.webp'
    : '/assets/popup-countdown-2days.webp';
}

type PopupCampaignProps = {
  /**
   * Kunci unik bila nanti ada beberapa promo; default untuk winner short video.
   */
  storageKey?: string;
};

export function PopupCampaign({
  storageKey = PROMO_DISMISS_STORAGE_KEY,
}: PopupCampaignProps) {
  const [visible, setVisible] = useState(false);
  const checkboxId = useId();
  const imageSrc = getPopupCampaignImageSrc();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(storageKey) === '1') return;
    } catch {
      // mode privat / tidak mendukung storage
    }
    setVisible(true);
  }, [storageKey]);

  function handleDismissThisVisit() {
    setVisible(false);
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.checked) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, '1');
      }
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-60 flex items-center justify-center overflow-y-auto px-4 py-[10px] sm:px-5 sm:py-5'
      role='dialog'
      aria-modal='true'
      aria-labelledby={`${checkboxId}-title`}>
      <div
        className='absolute inset-0 bg-black/55 backdrop-blur-[2px]'
        onClick={handleDismissThisVisit}
        aria-hidden
      />
      <div
        className='
        relative z-10 flex w-full max-w-md flex-col overflow-y-auto overflow-x-hidden
        rounded-2xl border border-gray-100 bg-white shadow-2xl
        max-sm:h-[calc(100dvh-70px)] max-sm:max-h-[calc(100dvh-70px)]
        sm:max-h-[calc(100dvh-40px)]  
      '>
        <h2 id={`${checkboxId}-title`} className='sr-only'>
          Campaign Royal Canin Vet Symposium 2026
        </h2>
        <button
          type='button'
          onClick={handleDismissThisVisit}
          className='absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-100 cursor-pointer'
          aria-label='Tutup'>
          <Icon icon='mdi:close' className='h-5 w-5' />
        </button>
        <div
          className='
          flex w-full min-h-0 max-w-full items-center justify-center
          border-b border-gray-100 bg-neutral-50
          max-sm:flex-1 max-sm:pt-11 max-sm:px-0 sm:px-0
          sm:shrink-0
          overflow-hidden rounded-t-2xl
        '>
          <Image
            src={imageSrc}
            alt='Campaign Royal Canin Vet Symposium 2026'
            width={800}
            height={450}
            className='
              h-auto w-full
              object-cover sm:object-contain object-top
              max-sm:max-h-full
              sm:max-h-[min(100dvh,420px)]
            '
            sizes='(max-width: 640px) 100vw, 28rem'
            priority
          />
        </div>

        <div className='shrink-0 px-4 py-4 sm:px-5 sm:py-5'>
          <label
            htmlFor={checkboxId}
            className='flex cursor-pointer items-start gap-3 text-sm text-neutral-700'>
            <input
              id={checkboxId}
              type='checkbox'
              onChange={handleCheckboxChange}
              className='rc-checkbox mt-0.5 shrink-0'
            />
            <span className='leading-snug font-medium'>
              Jangan Tampilkan Popup Informasi Lagi
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
