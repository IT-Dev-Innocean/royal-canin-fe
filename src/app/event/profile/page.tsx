'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuth, getToken } from '@/lib/auth';

interface ProfileDetail {
  phone: string;
  clinic_name: string;
  outlet_number: number | null;
  social_media_account: string;
  rc_club: boolean;
  pet: string;
  scrub_size: string;
  points: number;
}

interface ProfileQrCode {
  code: string;
  image_path: string;
  is_active: boolean;
}

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  detail: ProfileDetail;
  qr_code: ProfileQrCode | null;
  check_in: unknown;
}

const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

export default function UserInfoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          if (res.status === 401) {
            clearAuth();
            router.replace('/login');
            return;
          }
          setError(json.message ?? 'Gagal memuat profil.');
          return;
        }

        setProfile(json.data);
      } catch {
        setError('Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  if (loading) {
    return (
      <main className='flex items-center justify-center min-h-screen'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-3 border-rc-red border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Memuat profil...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className='flex items-center justify-center min-h-screen p-6'>
        <div className='text-center space-y-4'>
          <p className='text-sm text-red-500 font-medium'>
            {error ?? 'Data profil tidak ditemukan.'}
          </p>
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='px-6 py-2.5 bg-rc-red text-white text-sm rounded-xl font-bold'>
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  const { name, email, detail, qr_code } = profile;

  return (
    <main className='relative flex flex-col items-center p-6 min-h-screen text-black overflow-hidden'>
      <div className='mt-0 mb-8 w-full max-w-lg flex flex-col items-center relative z-10'>
        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-4'>
          Pindai QR saat Registrasi
        </p>

        <div className='relative bg-white p-4 rounded-3xl border-2 border-red-50'>
          <div className='absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-rc-red rounded-tl-3xl -translate-x-1 -translate-y-1'></div>
          <div className='absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-rc-red rounded-tr-3xl translate-x-1 -translate-y-1'></div>
          <div className='absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-rc-red rounded-bl-3xl -translate-x-1 translate-y-1'></div>
          <div className='absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-rc-red rounded-br-3xl translate-x-1 translate-y-1'></div>

          {qr_code?.image_path ? (
            <img
              src={`${QR_STORAGE_BASE}${qr_code.image_path}`}
              alt={`QR Code ${qr_code.code}`}
              className='w-40 h-40 rounded-2xl object-contain'
            />
          ) : (
            <div className='w-40 h-40 bg-gray-50 flex items-center justify-center rounded-2xl border border-dashed border-gray-200'>
              <span className='text-xs text-gray-400 font-mono tracking-widest'>
                [QR CODE]
              </span>
            </div>
          )}
        </div>

        <p className='mt-5 text-sm text-gray-500 font-medium text-center max-w-[280px] leading-relaxed'>
          Kumpulkan poin dengan mengunjungi booth dan mengikuti sesi interaktif.
        </p>
      </div>

      <div className='w-full max-w-lg relative z-10 mt-8'>
        <div className='absolute -top-6 inset-x-6 bg-linear-to-br from-[#d4001a] to-[#8b0012] rounded-2xl p-4 text-white shadow-lg shadow-red-200 z-20 flex justify-between items-center'>
          <div>
            <p className='text-xs font-medium opacity-80 uppercase tracking-wider mb-0.5'>
              Total Poin Anda
            </p>
            <p className='text-2xl font-black tracking-tight leading-none'>
              {(detail.points ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className='w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center'>
            <svg
              className='w-5 h-5 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        </div>

        <div className='bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-5 md:p-7 pt-16 md:pt-20 w-full relative z-10'>
          <div className='space-y-4'>
            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='qlementine-icons:user-24'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400'>
                  Nama Peserta
                </p>
                <p className='font-bold text-xs md:text-sm leading-snug text-rc-red'>
                  {name}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='mage:email'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400'>
                  Email
                </p>
                <p className='text-xs md:text-sm font-semibold text-gray-800'>
                  {email}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='fluent:phone-person-24-regular'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400'>
                  No. Telepon
                </p>
                <p className='text-xs md:text-sm font-semibold text-gray-800'>
                  {detail.phone}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='fa7-regular:hospital'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400 mb-0.5'>
                  Klinik
                </p>
                <p className='text-xs md:text-sm font-bold text-gray-800 line-clamp-1'>
                  {detail.clinic_name || '-'}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='hugeicons:identity-card'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] md:text-xs font-medium text-gray-400 mb-0.5'>
                  NIO
                </p>
                <p className='text-xs md:text-sm font-bold text-gray-800'>
                  {detail.outlet_number ?? '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full max-w-lg mt-auto pt-10 pb-6 space-y-3 relative z-10'>
        <button
          type='button'
          onClick={handleLogout}
          className='block w-full py-4 bg-rc-red text-white text-center rounded-2xl font-bold shadow-lg shadow-red-200 transition-all duration-300 ease-out hover:bg-rc-red/80 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98]'>
          Keluar
        </button>
      </div>
    </main>
  );
}
