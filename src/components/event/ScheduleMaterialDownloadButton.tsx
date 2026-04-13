'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { SCHEDULE_MATERIAL_DOWNLOAD_OPEN_AT } from '@/lib/eventMenuFeaturesOpenAt';

interface ScheduleMaterialDownloadButtonProps {
  href: string;
}

export function ScheduleMaterialDownloadButton({
  href,
}: ScheduleMaterialDownloadButtonProps) {
  const [downloadEnabled, setDownloadEnabled] = useState(
    () => Date.now() >= SCHEDULE_MATERIAL_DOWNLOAD_OPEN_AT.getTime(),
  );

  useEffect(() => {
    if (downloadEnabled) return;
    const ms = SCHEDULE_MATERIAL_DOWNLOAD_OPEN_AT.getTime() - Date.now();
    if (ms <= 0) {
      setDownloadEnabled(true);
      return;
    }
    const id = window.setTimeout(() => setDownloadEnabled(true), ms);
    return () => window.clearTimeout(id);
  }, [downloadEnabled]);

  const baseClass =
    'mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition';

  if (!downloadEnabled) {
    return (
      <button
        type='button'
        disabled
        title='Unduh materi tersedia mulai 4 Mei 2026 pukul 22.00 WIB'
        className={`${baseClass} cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400`}>
        <Icon icon='mdi:download-outline' className='h-4 w-4' />
        Unduh Materi
      </button>
    );
  }

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={`${baseClass} cursor-pointer border-rc-red/30 bg-rc-red/5 text-rc-red hover:bg-rc-red/10`}>
      <Icon icon='mdi:download-outline' className='h-4 w-4' />
      Unduh Materi
    </a>
  );
}
