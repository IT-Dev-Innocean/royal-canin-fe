'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';
import type { VerifyLookupResponse } from '@/types/registration';

const VERIFIED_STORAGE_KEY = 'vet_sym_2026_verified_user';

const fieldInputClass =
  'w-full rounded-sm border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#e2001a] focus:outline-none focus:ring-1 focus:ring-[#e2001a]';

export default function VerificationPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = (await res.json()) as VerifyLookupResponse;

      if (!data.success) {
        setError(data.message);
        return;
      }

      sessionStorage.setItem(VERIFIED_STORAGE_KEY, JSON.stringify(data.data));
      router.push('/verification/set-password');
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
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

      <div className='relative mx-auto flex max-w-lg flex-col gap-6 px-4 pb-8 pt-8'>
        <RoyalCaninLogo className='mb-2' />

        <header className='text-center'>
          <h1 className='text-2xl font-bold text-rc-red'>Halaman Verifikasi</h1>
          <p className='mt-1 text-sm text-neutral-600'>
            Royal Canin Vet Symposium 2026
          </p>
        </header>

        <p className='text-center text-sm leading-relaxed text-neutral-700'>
          Masukkan nomor WhatsApp atau email yang sudah terdaftar untuk
          melanjutkan ke halaman konfirmasi kata sandi.
        </p>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='rounded-md border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6'>
            <label
              htmlFor='identifier'
              className='mb-1.5 block text-sm font-bold text-neutral-900'>
              Nomor WhatsApp / Email <span className='text-rc-red'>*</span>
            </label>
            <input
              id='identifier'
              name='identifier'
              type='text'
              required
              autoComplete='email tel'
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder='08xxxxxxxxxx atau nama@email.com'
              className={fieldInputClass}
            />
          </div>

          {error ? (
            <p
              className='rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700'
              role='alert'>
              {error}
            </p>
          ) : null}

          <div className='flex flex-col items-center gap-3 pt-2'>
            <button
              type='submit'
              disabled={loading}
              className='flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-full bg-rc-red px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016] disabled:opacity-60'>
              {loading ? (
                <>
                  <Icon icon='svg-spinners:ring-resize' className='h-5 w-5' />
                  Memverifikasi Data…
                </>
              ) : (
                'Verifikasi'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
