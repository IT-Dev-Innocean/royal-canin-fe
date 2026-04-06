'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';
import type {
  SetPasswordResponse,
  VerifiedUserData,
} from '@/types/registration';

const VERIFIED_STORAGE_KEY = 'vet_sym_2026_verified_user';

const fieldInputClass =
  'w-full rounded-sm border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#e2001a] focus:outline-none focus:ring-1 focus:ring-[#e2001a]';

export default function SetPasswordPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<VerifiedUserData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(VERIFIED_STORAGE_KEY);
    if (!raw) {
      router.replace('/verification');
      return;
    }
    try {
      setUserData(JSON.parse(raw) as VerifiedUserData);
    } catch {
      router.replace('/verification');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userData) return;
    setError(null);

    if (password.length < 8) {
      setError(
        'Kata sandi minimal 8 karakter yang terdiri dari kombinasi huruf dan angka.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: userData.registrationId,
          password,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as SetPasswordResponse;

      if (!data.success) {
        setError(data.message);
        return;
      }

      setDone(true);
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
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
      <main className='relative min-h-[90vh] overflow-hidden'>
        <div className='mx-auto flex max-w-lg flex-col gap-6 px-4 pb-8 pt-10'>
          <RoyalCaninLogo />

          <div className='text-center text-neutral-800 mt-4'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50'>
              <Icon
                icon='mdi:check-circle'
                className='h-10 w-10 text-green-600'
              />
            </div>
            <h1 className='text-xl font-bold text-rc-red'>
              Kata Sandi Berhasil Disimpan
            </h1>
            <p className='mt-3 text-sm leading-relaxed text-neutral-600'>
              Kata sandi Anda untuk akun{' '}
              <span className='font-semibold'>{userData.email}</span> telah
              berhasil disimpan. Anda dapat menggunakan kata sandi ini untuk
              login nanti.
            </p>
          </div>

          <div className='flex justify-center pt-4'>
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
          <h1 className='text-2xl font-bold text-rc-red'>Halaman Konfirmasi</h1>
          <p className='mt-1 text-sm text-neutral-600'>
            Royal Canin Vet Symposium 2026
          </p>
        </header>

        {/* Profile card */}
        <div className='rounded-md border border-neutral-200 bg-white shadow-sm px-4 py-4'>
          <div className='flex flex-col gap-2 text-xs md:text-sm text-neutral-800'>
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

        {/* Password form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='rounded-md border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6'>
            <div className='flex flex-col gap-5'>
              <div>
                <label
                  htmlFor='password'
                  className='mb-1.5 block text-sm font-bold text-neutral-900'>
                  Kata Sandi <span className='text-rc-red'>*</span>
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Kata Sandi'
                    className={fieldInputClass + ' pr-10'}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((v) => !v)}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition'
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    <Icon
                      icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                      className='h-5 w-5'
                    />
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='mb-1.5 block text-sm font-bold text-neutral-900'>
                  Konfirmasi Sandi <span className='text-rc-red'>*</span>
                </label>
                <div className='relative'>
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Konfirmasi Sandi'
                    className={fieldInputClass + ' pr-10'}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirm((v) => !v)}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition'
                    aria-label={showConfirm ? 'Sembunyikan konfirmasi sandi' : 'Tampilkan konfirmasi sandi'}
                  >
                    <Icon
                      icon={showConfirm ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                      className='h-5 w-5'
                    />
                  </button>
                </div>
              </div>
            </div>

            <p className='mt-3 text-xs italic text-neutral-500'>
              *Silahkan masukkan 8 karakter kata sandi yang terdiri dari
              kombinasi huruf dan angka
            </p>
          </div>

          <section
            className='relative overflow-hidden rounded-2xl px-4 py-5'
            aria-labelledby='privacy-heading-sp'>
            <div
              className='pointer-events-none absolute inset-0 opacity-40'
              style={{
                background:
                  'repeating-radial-gradient(circle at 30% 20%, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 12px)',
              }}
            />
            <div className='relative'>
              <h2
                id='privacy-heading-sp'
                className='mb-4 text-center text-base font-bold text-rc-red'>
                PERNYATAAN PRIVASI KAMI
              </h2>
              <div className='space-y-4 text-sm leading-relaxed text-neutral-800'>
                <label className='flex cursor-pointer gap-3'>
                  <input
                    type='checkbox'
                    required
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    className='rc-checkbox mt-1'
                  />
                  <span>
                    Anda setuju untuk memberikan informasi kepada Royal Canin
                    Indonesia dan dapat dihubungi melalui media informasi yang
                    tertera. Untuk mengubah informasi atau membatalkan
                    pendaftaran dapat menghubungi Admin Vet Symposium di Telp/WA{' '}
                    <a
                      href='tel:+6281313141546'
                      className='font-medium text-rc-red underline'>
                      +62-813-1314-1546
                    </a>
                    .
                    <br />
                    Kebijakan privasi dari Royal Canin dapat Anda temukan di
                    sini:{' '}
                    <a
                      href='https://www.mars.com/privacy-policy-indonesian'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-medium text-rc-red underline'>
                      www.mars.com/privacy-policy-indonesian
                    </a>
                  </span>
                </label>
              </div>
            </div>
          </section>

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
                  Menyimpan…
                </>
              ) : (
                'Konfirmasi'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
