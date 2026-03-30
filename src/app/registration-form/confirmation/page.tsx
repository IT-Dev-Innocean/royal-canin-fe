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
          className='h-10 w-10 text-[#e2001a]'
        />
      </div>
    );
  }

  return (
    <main className='relative min-h-screen overflow-hidden pb-28'>
      <div className='mx-auto flex max-w-lg flex-col gap-6 px-4 pb-8 pt-10'>
        <RoyalCaninLogo />

        <div className='mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-200'>
          <Icon
            icon='healthicons:doctor'
            className='h-14 w-14 text-neutral-500'
            aria-hidden
          />
        </div>

        <div className='text-center text-neutral-800'>
          <p className='text-lg'>
            Halo,{' '}
            <span className='font-bold text-neutral-900'>{data.fullName}</span>
          </p>
          <p className='mt-3 text-sm leading-relaxed'>
            Terima kasih telah mendaftar untuk{' '}
            <span className='font-semibold text-[#e2001a]'>
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
            <span className='text-neutral-500'>NIO: </span>
            <span className='font-medium'>{data.noi}</span>
          </li>
        </ul>

        <p className='text-center text-sm leading-relaxed text-neutral-700'>
          Konfirmasi akan dikirim melalui email dan WhatsApp menjelang tanggal{' '}
          <span className='font-semibold'>15 April 2026</span>. Untuk pertanyaan
          administrasi hubungi{' '}
          <a
            href='tel:+6281313141546'
            className='font-semibold text-[#e2001a] underline'>
            0813-1314-1546
          </a>
          .
        </p>

        <div className='flex justify-center pt-2'>
          <Link
            href='/'
            className='rounded-full bg-[#e2001a] px-12 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016]'>
            Beranda
          </Link>
        </div>
      </div>

      <footer className='relative mt-10 border-t border-neutral-100 bg-gradient-to-b from-white to-neutral-50 px-4 pb-10 pt-8'>
        <div className='mx-auto flex max-w-lg flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between'>
          <div className='text-center sm:text-left'>
            <p className='text-lg font-bold leading-tight text-[#e2001a]'>
              VET
            </p>
            <p className='text-lg font-bold leading-tight text-[#e2001a]'>
              SYMPOSIUM
            </p>
            <p className='text-lg font-bold text-[#e2001a]'>2026</p>
          </div>
          <div className='flex items-end gap-2' aria-hidden>
            <Icon icon='mdi:cat' className='h-16 w-16 text-neutral-400' />
            <Icon icon='mdi:dog' className='h-20 w-20 text-neutral-400' />
          </div>
        </div>
      </footer>
    </main>
  );
}
