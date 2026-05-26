'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function DashboardNotFound() {
  return (
    <div className='mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center'>
      <div className='flex h-20 w-20 items-center justify-center rounded-full bg-rc-red/10'>
        <Icon
          icon='mdi:alert-circle-outline'
          className='h-10 w-10 text-rc-red'
        />
      </div>
      <div className='space-y-1'>
        <p className='text-5xl font-extrabold text-gray-900 tracking-tight'>
          404
        </p>
        <h1 className='text-lg font-bold text-gray-800'>
          Halaman Tidak Ditemukan
        </h1>
        <p className='text-sm text-gray-500'>
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
      </div>
      <Link
        href='/dashboard'
        className='inline-flex items-center gap-2 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rc-red/90'>
        <Icon icon='mdi:home-outline' className='h-4 w-4' />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
