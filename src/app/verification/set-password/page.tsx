'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';
import { getUser, isAuthenticated } from '@/lib/auth';
import type { VerifiedUserData } from '@/types/registration';

export default function ConfirmationPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<VerifiedUserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/verification');
      return;
    }
    setUserData(getUser());
  }, [router]);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => {
      router.push('/event');
    }, 2000);
    return () => window.clearTimeout(id);
  }, [done, router]);

  function handleConfirm() {
    setLoading(true);
    setDone(true);
  }

  if (!userData) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Icon
          icon='svg-spinners:ring-resize'
          className='h-10 w-10 text-rc-red'
        />
      </div>
    );
  }

  if (done) {
    return (
      <main
        className='flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 py-16'
        aria-busy='true'
        aria-live='polite'>
        <Icon
          icon='line-md:loading-alt-loop'
          width={72}
          height={72}
          className='text-rc-red shrink-0'
          aria-hidden
        />
        <div className='flex max-w-md flex-col items-center gap-4 text-center'>
          <div>
            <h1 className='text-xl font-bold text-rc-red'>
              Konfirmasi Berhasil
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-neutral-600'>
              Menyiapkan halaman acara untuk Anda…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='relative min-h-[90vh] overflow-hidden'>
      <div
        className='pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-neutral-100/80 blur-2xl'
        aria-hidden
      />
      <div
        className='pointer-events-none absolute -left-20 bottom-24 h-56 w-56 rounded-full bg-neutral-100/80 blur-2xl'
        aria-hidden
      />

      <div className='relative mx-auto flex max-w-lg flex-col gap-6 px-4 pb-24 pt-8'>
        <RoyalCaninLogo className='mb-2' />

        <header className='text-center'>
          <h1 className='text-2xl font-bold text-rc-red'>Konfirmasi</h1>
        </header>

        <p className='text-center text-sm leading-relaxed text-neutral-700'>
          Pastikan informasi peserta di bawah ini sudah benar sebelum
          melanjutkan ke halaman acara.
        </p>

        {/* Profile card */}
        <div className='rounded-md border border-neutral-200 bg-white px-4 py-4 shadow-sm'>
          <div className='flex flex-col gap-2 text-xs text-neutral-800 md:text-sm'>
            <div className='flex items-center gap-2.5'>
              <Icon
                icon='qlementine-icons:user-24'
                className='h-5 w-5 shrink-0 text-rc-red'
              />
              <span>
                Nama:{' '}
                <span className='font-bold text-rc-red'>
                  {userData.fullName}
                </span>
              </span>
            </div>
            <div className='flex items-center gap-2.5'>
              <Icon
                icon='mage:email'
                className='h-5 w-5 shrink-0 text-rc-red'
              />
              <span>
                Email: <span className='font-medium'>{userData.email}</span>
              </span>
            </div>
            <div className='flex items-center gap-2.5'>
              <Icon
                icon='fluent:phone-person-24-regular'
                className='h-5 w-5 shrink-0 text-rc-red'
              />
              <span>
                No Telp: <span className='font-medium'>{userData.phone}</span>
              </span>
            </div>
            <div className='flex items-center gap-2.5'>
              <Icon
                icon='fa7-regular:hospital'
                className='h-5 w-5 shrink-0 text-rc-red'
              />
              <span>
                Nama Klinik:{' '}
                <span className='font-medium'>{userData.clinicName}</span>
              </span>
            </div>
            <div className='flex items-center gap-2.5'>
              <Icon
                icon='hugeicons:identity-card'
                className='h-5 w-5 shrink-0 text-rc-red'
              />
              <span>
                NIO: <span className='font-medium'>{userData.noi}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <div className='flex flex-col items-center gap-3 pt-2'>
          <button
            type='button'
            onClick={handleConfirm}
            disabled={loading}
            className='flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-full bg-rc-red px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016] disabled:opacity-60'>
            {loading ? (
              <>
                <Icon icon='svg-spinners:ring-resize' className='h-5 w-5' />
                Mengkonfirmasi…
              </>
            ) : (
              'Konfirmasi'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
