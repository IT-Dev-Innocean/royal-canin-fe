'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { LogoEvent } from '@/components/event/LogoEvent';
import type { VerifiedUserData } from '@/types/registration';

const VERIFIED_STORAGE_KEY = 'vet_sym_2026_verified_user';
const EVENT_DATE = new Date('2026-05-05T08:00:00+07:00');

const MENU_ITEMS = [
  { icon: 'mdi:account-box-outline', label: 'Informasi Akun' },
  { icon: 'mdi:calendar-text-outline', label: 'Agenda Acara' },
  { icon: 'mdi:account-tie-voice-outline', label: 'Profil Pembicara' },
  { icon: 'mdi:information-outline', label: 'Informasi Umum' },
  { icon: 'mdi:head-question-outline', label: 'Kuis & Pertanyaan' },
  { icon: 'mdi:email-arrow-right-outline', label: 'Kirim Pertanyaan' },
  { icon: 'mdi:chat-processing-outline', label: 'Kirim Tanggapan' },
];

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcCountdown(): CountdownState {
  const diff = Math.max(0, EVENT_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

export default function EventHomePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<VerifiedUserData | null>(null);
  const [countdown, setCountdown] = useState<CountdownState>(calcCountdown);

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

  useEffect(() => {
    const id = setInterval(() => setCountdown(calcCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem(VERIFIED_STORAGE_KEY);
    router.replace('/');
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

  const countdownParts: { value: number; label: string }[] = [
    { value: countdown.days, label: 'Hari' },
    { value: countdown.hours, label: 'Jam' },
    { value: countdown.minutes, label: 'Menit' },
    { value: countdown.seconds, label: 'Detik' },
  ];

  return (
    <div className='mx-auto flex max-w-lg flex-col items-center gap-4 px-4 pb-8 pt-8'>
      <LogoEvent />

      {/* Greeting */}
      <div className='w-full text-center'>
        <p className='text-sm text-neutral-500'>Halo, Selamat Datang</p>
        <h1 className='mt-1 text-xl font-bold text-rc-red'>
          {userData.fullName}
        </h1>
      </div>

      {/* Points card */}
      <div className='relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-[#d4001a] to-[#8b0012] px-5 py-5 text-white shadow-lg'>
        <Icon
          icon='mdi:cat'
          className='pointer-events-none absolute -right-2 -top-1 h-28 w-28 rotate-12 text-white/10'
          aria-hidden
        />
        <Icon
          icon='mdi:dog'
          className='pointer-events-none absolute right-16 top-8 h-20 w-20 -rotate-6 text-white/[0.07]'
          aria-hidden
        />

        <p className='text-sm font-medium text-white/80'>Total Saldo Poin</p>
        <div className='mt-2 flex items-center gap-2'>
          <span className='flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow-sm'>
            <Icon
              icon='mdi:star-four-points'
              className='h-3.5 w-3.5 text-yellow-800'
            />
          </span>
          <span className='text-3xl font-bold tracking-tight'>1000</span>
        </div>
        <button className='mt-4 rounded-lg bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/30'>
          Tukar Poin
        </button>
      </div>

      {/* Countdown */}
      <div className='w-full py-2 text-center'>
        <p className='text-sm font-semibold text-neutral-700'>
          Bersiaplah dalam:
        </p>
        <div className='mt-4 flex items-center justify-center gap-1.5 sm:gap-3'>
          {countdownParts.map((part, i) => (
            <Fragment key={part.label}>
              {i > 0 && (
                <span className='text-2xl font-bold text-neutral-300'>:</span>
              )}
              <div className='flex min-w-14 flex-col items-center'>
                <span className='text-3xl font-extrabold tabular-nums text-neutral-900 sm:text-4xl'>
                  {String(part.value).padStart(2, '0')}
                </span>
                <span className='mt-0.5 text-[10px] font-medium text-neutral-400'>
                  {part.label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className='grid w-full grid-cols-4 gap-2.5'>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            className='flex flex-col items-center gap-2 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm transition hover:border-rc-red/20 hover:shadow-md active:scale-95'>
            <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-red-50'>
              <Icon icon={item.icon} className='h-6 w-6 text-rc-red' />
            </span>
            <span className='text-center text-[10px] font-medium leading-tight text-neutral-700'>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className='w-full rounded-2xl bg-red-50/80 px-5 py-4'>
        <div className='flex items-start gap-3'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rc-red/10'>
            <Icon icon='mdi:party-popper' className='h-6 w-6 text-rc-red' />
          </span>
          <div>
            <p className='text-sm font-bold text-rc-red'>Info Acara!</p>
            <p className='mt-1 text-xs leading-relaxed text-neutral-600'>
              Jangan lewatkan sesi utama! Kumpulkan poin dengan mengikuti kuis
              interaktif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
