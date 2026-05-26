'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

interface ScheduleMaterialDownloadButtonProps {
  href: string;
  /** Epoch milliseconds — saat tombol unduh menjadi aktif (`eventMenuFeaturesOpenAt`). */
  opensAtMs: number;
}

function formatOpensAtForTitle(opensAtMs: number): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(opensAtMs)) + ' WITA'
  );
}

export function ScheduleMaterialDownloadButton({
  href,
  opensAtMs,
}: ScheduleMaterialDownloadButtonProps) {
  const [downloadEnabled, setDownloadEnabled] = useState(
    () => Date.now() >= opensAtMs
  );

  useEffect(() => {
    if (downloadEnabled) return;
    const ms = opensAtMs - Date.now();
    if (ms <= 0) {
      setDownloadEnabled(true);
      return;
    }
    const id = window.setTimeout(() => setDownloadEnabled(true), ms);
    return () => window.clearTimeout(id);
  }, [downloadEnabled, opensAtMs]);

  const baseClass =
    'mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition';

  if (!downloadEnabled) {
    return (
      <button
        type='button'
        disabled
        title={`Unduh materi tersedia mulai ${formatOpensAtForTitle(opensAtMs)}`}
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
