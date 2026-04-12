'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';
import { getUser, isAuthenticated, saveAuth } from '@/lib/auth';
import type { VerifiedUserData } from '@/types/registration';

const fieldInputClass =
  'w-full text-xs md:text-sm rounded-sm border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#e2001a] focus:outline-none focus:ring-1 focus:ring-[#e2001a]';

interface LoginResponse {
  success: boolean;
  message: string;
  data?: VerifiedUserData;
  token?: string | null;
  errors?: Record<string, string[]> | null;
}

export default function LoginDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const u = getUser();
      if (u?.role === 'admin' || u?.role === 'crew') {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as LoginResponse;

      if (!data.success) {
        setError(data.message);
        return;
      }

      if (data.data) {
        const role = data.data.role;
        if (role !== 'admin' && role !== 'crew') {
          setError('Akses ditolak. Halaman ini hanya untuk Admin atau Crew.');
          return;
        }
        saveAuth(data.data, data.token);
      }

      router.push('/dashboard');
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

      <div className='relative mx-auto flex justify-center h-[90vh] max-w-lg flex-col gap-6 px-4 pb-8 pt-8'>
        <RoyalCaninLogo className='mb-2' />

        <header className='text-center'>
          <h1 className='text-sm font-semibold uppercase tracking-widest text-rc-red'>
            Login Dashboard
          </h1>
        </header>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='rounded-md border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6'>
            <div className='flex flex-col gap-5'>
              <div>
                <label
                  htmlFor='email'
                  className='mb-1.5 block text-sm font-bold text-neutral-900'>
                  Email<span className='text-rc-red'>*</span>
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  required
                  autoComplete='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Email terdaftar (contoh: nama@email.com)'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='mb-1.5 block text-sm font-bold text-neutral-900'>
                  Password <span className='text-rc-red'>*</span>
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete='current-password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Password = (Nomor HP, contoh: 081234567890)'
                    className={fieldInputClass + ' pr-10'}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((v) => !v)}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-600'
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }>
                    <Icon
                      icon={
                        showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
                      }
                      className='h-5 w-5'
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div
              className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3'
              role='alert'>
              <Icon
                icon='mdi:alert-circle-outline'
                className='mt-0.5 h-5 w-5 shrink-0 text-red-600'
              />
              <p className='text-sm leading-relaxed text-red-700'>{error}</p>
            </div>
          )}

          <div className='flex flex-col items-center gap-3 pt-2'>
            <button
              type='submit'
              disabled={loading}
              className='flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-full bg-rc-red px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016] disabled:opacity-60'>
              {loading ? (
                <>
                  <Icon icon='svg-spinners:ring-resize' className='h-5 w-5' />
                  Masuk…
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
