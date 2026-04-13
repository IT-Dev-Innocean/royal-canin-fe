'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';
import { isAuthenticated, saveAuth } from '@/lib/auth';
import type { VerifyLookupResponse } from '@/types/registration';

const fieldInputClass =
  'w-full rounded-sm border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#e2001a] focus:outline-none focus:ring-1 focus:ring-[#e2001a]';

export default function VerificationPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showErrorToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/event');
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = (await res.json()) as VerifyLookupResponse;

      if (!data.success) {
        showErrorToast(data.message);
        return;
      }

      saveAuth(data.data, data.token);
      router.push('/verification/set-password');
    } catch {
      showErrorToast('Terjadi kesalahan jaringan. Silakan coba lagi.');
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
          <h1 className='text-2xl font-bold text-rc-red'>Verifikasi Peserta</h1>
          {/* <p className='mt-1 text-sm text-neutral-600'>
            Royal Canin Vet Symposium 2026
          </p> */}
        </header>

        {/* <p className='text-center text-sm leading-relaxed text-neutral-700'>
          Masukkan nomor telepon yang sudah terdaftar untuk melanjutkan ke
          halaman konfirmasi.
        </p> */}

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='rounded-md border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6'>
            <label
              htmlFor='phone'
              className='mb-1.5 block text-sm font-bold text-neutral-900'>
              Nomor Telepon <span className='text-rc-red'>*</span>
            </label>
            <input
              id='phone'
              name='phone'
              type='text'
              inputMode='numeric'
              autoComplete='tel'
              required
              maxLength={13}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 13))
              }
              placeholder='Nomor Telepon (contoh: 08xxxxxxxxxx)'
              className={fieldInputClass}
              pattern='[0-9]{10,13}'
              title='Masukkan 10–13 digit angka'
            />
          </div>

          <div className='flex flex-col items-center gap-3 pt-2'>
            <button
              type='submit'
              disabled={loading}
              className='flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-full bg-rc-red px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016] disabled:opacity-60'>
              {loading ? (
                <>
                  <Icon icon='svg-spinners:ring-resize' className='h-5 w-5' />
                  Memverifikasi…
                </>
              ) : (
                'Verifikasi'
              )}
            </button>

            {/* Info banner */}
            <div className='w-full rounded-2xl bg-red-50/80 px-5 py-4 mt-4'>
              <div className='flex items-start gap-3'>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rc-red/10'>
                  <Icon
                    icon='akar-icons:info'
                    className='h-6 w-6 text-rc-red'
                  />
                </span>
                <div>
                  {/* <p className='text-sm font-bold text-rc-red'>Info Acara!</p> */}
                  <p className='mt-0 text-xs leading-relaxed text-neutral-600'>
                    Masukkan nomor telepon yang sudah terdaftar untuk
                    melanjutkan ke halaman konfirmasi.
                  </p>
                </div>
              </div>
            </div>

            <p className='mt-0 text-center text-sm text-neutral-500'>
              Sudah punya akun?{' '}
              <Link
                href='/login'
                className='font-medium text-rc-red underline transition hover:text-[#c40016]'>
                Masuk disini
              </Link>
            </p>
          </div>
        </form>
      </div>

      {toast ? (
        <div
          className='fixed bottom-6 right-6 left-6 z-50 flex justify-end sm:left-auto animate-[slideUp_0.3s_ease-out]'
          role='alert'
          aria-live='assertive'>
          <div className='flex w-full max-w-sm min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50/95 px-5 py-4 text-red-800 shadow-xl backdrop-blur-sm'>
            <Icon
              icon='mdi:alert-circle'
              className='mt-0.5 h-5 w-5 shrink-0 text-red-600'
            />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-bold leading-snug'>Gagal</p>
              <p className='mt-0.5 text-sm leading-snug opacity-90'>
                {toast.message}
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                if (toastTimer.current) clearTimeout(toastTimer.current);
                setToast(null);
              }}
              className='shrink-0 cursor-pointer rounded-full p-1 transition hover:bg-black/5'
              aria-label='Tutup'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
