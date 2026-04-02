'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CONFIRMATION_STORAGE_KEY,
  type ConfirmationSnapshot,
} from '@/context/RegistrationFormContext';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';

export default function RegistrationConfirmationPage() {
  const router = useRouter();
  const [data, setData] = useState<ConfirmationSnapshot | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);
    if (!raw) {
      router.replace('/registration-form');
      return;
    }
    try {
      setData(JSON.parse(raw) as ConfirmationSnapshot);
    } catch {
      router.replace('/registration-form');
    }
  }, [router]);

  if (!data) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Icon
          icon='svg-spinners:ring-resize'
          className='h-10 w-10 text-rc-red'
        />
      </div>
    );
  }

  return (
    <main className='relative min-h-[90vh] overflow-hidden pb-0'>
      <div className='mx-auto flex max-w-lg flex-col gap-6 px-4 pb-8 pt-10'>
        <RoyalCaninLogo />

        <div className='text-center text-neutral-800 mt-8'>
          <p className='text-lg font-bold'>
            Halo, <span className='font-bold text-rc-red'>{data.fullName}</span>
          </p>
          <p className='mt-3 text-sm leading-relaxed'>
            Terima kasih telah mendaftar untuk{' '}
            <span className='font-semibold text-rc-red'>
              Royal Canin Vet Symposium 2026
            </span>
            . Data Anda sedang diproses.
          </p>
          <p className='mt-4 text-sm font-medium'>
            Mohon periksa kembali informasi profil Anda:
          </p>
        </div>

        <ul className='space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-5 text-sm'>
          <li>
            <span className='text-neutral-500'>Nama: </span>
            <span className='font-bold'>{data.fullName}</span>
          </li>
          <li>
            <span className='text-neutral-500'>Email: </span>
            <span className='font-medium'>{data.email}</span>
          </li>
          <li>
            <span className='text-neutral-500'>WhatsApp: </span>
            <span className='font-medium'>{data.phone}</span>
          </li>
          <li>
            <span className='text-neutral-500'>Klinik: </span>
            <span className='font-medium'>{data.clinicName}</span>
          </li>
          <li>
            <span className='text-neutral-500'>NOI: </span>
            <span className='font-medium'>{data.noi}</span>
          </li>
        </ul>

        <p className='text-center text-sm leading-relaxed text-neutral-700'>
          Konfirmasi akan dikirim melalui email dan WhatsApp menjelang tanggal{' '}
          <span className='font-semibold'>15 April 2026</span>. Untuk pertanyaan
          administrasi hubungi{' '}
          <a
            href='tel:+6281313141546'
            className='font-semibold text-rc-red underline'>
            0813-1314-1546
          </a>
          .
        </p>

        <div className='flex justify-center pt-2'>
          <Link
            href='/'
            className='rounded-full bg-rc-red px-12 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016]'>
            Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
