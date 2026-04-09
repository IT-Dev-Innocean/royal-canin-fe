'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function UserInfoPage() {
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

          <div className='w-40 h-40 bg-gray-50 flex items-center justify-center rounded-2xl border border-dashed border-gray-200'>
            <span className='text-xs text-gray-400 font-mono tracking-widest'>
              [QR CODE]
            </span>
          </div>
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
              1,000
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

        <div className='bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-7 pt-16 w-full relative z-10'>
          <div className='space-y-4'>
            <div className='flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
              <div className='w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0'>
                <Icon
                  icon='qlementine-icons:user-24'
                  className='h-5 w-5 shrink-0 text-rc-red'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-xs font-medium text-gray-400'>
                  Nama Peserta
                </p>
                <p className='font-bold text-base leading-snug text-rc-red'>
                  drh. Angga Wirantoko Hadi Saputro
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
                <p className='text-xs font-medium text-gray-400'>Email</p>
                <p className='text-sm font-semibold text-gray-800'>
                  angga@hotline-jago.com
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
                <p className='text-xs font-medium text-gray-400'>No. Telepon</p>
                <p className='text-sm font-semibold text-gray-800'>
                  0812 3456 7890
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
                <p className='text-xs font-medium text-gray-400 mb-0.5'>
                  Klinik
                </p>
                <p className='text-sm font-bold text-gray-800 line-clamp-1'>
                  Klinik Hewan Jago
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
                <p className='text-xs font-medium text-gray-400 mb-0.5'>NIO</p>
                <p className='text-sm font-bold text-gray-800'>12345678</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full max-w-lg mt-auto pt-10 pb-6 space-y-3 relative z-10'>
        <Link
          href='/'
          className='block w-full py-4 bg-rc-red text-white text-center rounded-2xl font-bold shadow-lg shadow-red-200 transition-all duration-300 ease-out hover:bg-rc-red/80 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98]'>
          Keluar
        </Link>
      </div>
    </main>
  );
}
