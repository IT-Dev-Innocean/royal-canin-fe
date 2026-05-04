'use client';

import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import {
  getToken,
  getUser,
  isAuthenticated,
  logoutParticipantHard,
} from '@/lib/auth';
import { HomeBanner } from '@/components/event/HomeBanner';
// import { PopupCampaign } from '@/components/event/PopupCampaign';
import {
  CHECKIN_OPENS_AT,
  EVENT_MENU_FEATURES_OPEN_AT,
  HOME_BANNER_VISIBLE_AT,
} from '@/lib/eventMenuFeaturesOpenAt';
import type { VerifiedUserData } from '@/types/registration';

const EVENT_DATE = new Date('2026-05-05T06:00:00+08:00');
const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;
const POLL_INTERVAL = 3000;

const PET_LABELS: Record<string, string> = {
  cat: 'Kucing',
  dog: 'Anjing',
  both: 'Kucing & Anjing',
};

const MENU_ITEMS = [
  {
    icon: 'mdi:calendar-text-outline',
    label: 'Agenda Acara',
    href: '/event/schedule',
  },
  {
    icon: 'mdi:presentation',
    label: 'Pembicara & Seminar',
    href: '/event/seminar',
  },
  {
    icon: 'mdi:head-question-outline',
    label: 'Kuis & Aktivitas',
    href: '/event/activity',
  },
  {
    icon: 'mdi:information-outline',
    label: 'Informasi Umum',
    href: '/event/information',
  },
] as const;

const GATED_HOME_MENU_HREFS = new Set([
  '/event/schedule',
  '/event/activity',
  '/event/information',
  '/event/seminar',
]);

// const POINTS_SCALE_MAX = 1500;
const POINTS_TIER_DOORPRIZE = 1200;
const POINTS_TIER_SPECIAL = 1500;

// function pointsProgressPercent(points: number): number {
//   if (points <= 0) return 0;
//   return Math.min(100, (points / POINTS_SCALE_MAX) * 100);
// }

// function markPositionOnScale(value: number): string {
//   return `${(value / POINTS_SCALE_MAX) * 100}%`;
// }

interface ProfileDetail {
  phone: string;
  clinic_name: string;
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [countdown, setCountdown] = useState<CountdownState>(calcCountdown);
  const [eventHasEnded, setEventHasEnded] = useState(
    () => Date.now() >= EVENT_DATE.getTime()
  );
  const [showQrModal, setShowQrModal] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInWindowOpen, setCheckInWindowOpen] = useState(
    () => Date.now() >= CHECKIN_OPENS_AT.getTime()
  );
  const [menuFeaturesEnabled, setMenuFeaturesEnabled] = useState(
    () => Date.now() >= EVENT_MENU_FEATURES_OPEN_AT.getTime()
  );
  const [homeBannerVisible, setHomeBannerVisible] = useState(
    () => Date.now() >= HOME_BANNER_VISIBLE_AT.getTime()
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (menuFeaturesEnabled) return;
    const ms = EVENT_MENU_FEATURES_OPEN_AT.getTime() - Date.now();
    if (ms <= 0) {
      setMenuFeaturesEnabled(true);
      return;
    }
    const id = window.setTimeout(() => setMenuFeaturesEnabled(true), ms);
    return () => window.clearTimeout(id);
  }, [menuFeaturesEnabled]);

  useEffect(() => {
    if (homeBannerVisible) return;
    const ms = HOME_BANNER_VISIBLE_AT.getTime() - Date.now();
    if (ms <= 0) {
      setHomeBannerVisible(true);
      return;
    }
    const id = window.setTimeout(() => setHomeBannerVisible(true), ms);
    return () => window.clearTimeout(id);
  }, [homeBannerVisible]);

  useEffect(() => {
    if (checkInWindowOpen) return;
    const ms = CHECKIN_OPENS_AT.getTime() - Date.now();
    if (ms <= 0) {
      setCheckInWindowOpen(true);
      return;
    }
    const id = window.setTimeout(() => setCheckInWindowOpen(true), ms);
    return () => window.clearTimeout(id);
  }, [checkInWindowOpen]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/verification');
      return;
    }
    const u = getUser();
    if (u?.role === 'admin' || u?.role === 'crew') {
      router.replace('/dashboard');
      return;
    }
    setUserData(u);
    fetchProfile();
  }, [router]);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setProfile(json.data);
        return json.data as ProfileData;
      } else if (res.status === 401) {
        logoutParticipantHard();
      }
    } catch {
      // silently fail
    } finally {
      setProfileLoading(false);
    }
    return null;
  }, [router]);

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const updated = await fetchProfile();
      if (updated && updated.check_in !== null) {
        stopPolling();
        setCheckInSuccess(true);
      }
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function openQrModal() {
    setCheckInSuccess(false);
    setShowQrModal(true);
    startPolling();
  }

  function closeQrModal() {
    stopPolling();
    setShowQrModal(false);
    if (checkInSuccess) {
      fetchProfile();
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (eventHasEnded) return;
    const id = setInterval(() => {
      setCountdown(calcCountdown());
      if (Date.now() >= EVENT_DATE.getTime()) {
        setEventHasEnded(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [eventHasEnded]);

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

  const countdownParts: { value: number; label: string }[] | null =
    eventHasEnded
      ? null
      : [
          { value: countdown.days, label: 'Hari' },
          { value: countdown.hours, label: 'Jam' },
          { value: countdown.minutes, label: 'Menit' },
          { value: countdown.seconds, label: 'Detik' },
        ];

  return (
    <div className='mx-auto flex max-w-lg flex-col items-center gap-4 px-4 pb-0 pt-4'>
      {/* <PopupCampaign /> */}
      {/* Greeting */}
      <div className='w-full text-center'>
        <p className='text-sm text-neutral-500'>Halo, Selamat Datang</p>
        <h1 className='mt-1 text-xl font-bold text-rc-red'>
          {userData.fullName}
        </h1>
      </div>

      {/* Profile info card */}
      <div className='relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-[#d4001a] to-[#8b0012] px-5 py-5 text-white shadow-lg'>
        {profileLoading ? (
          <div className='flex items-center justify-center py-6'>
            <Icon
              icon='svg-spinners:ring-resize'
              className='h-10 w-10 text-white'
            />
          </div>
        ) : profile ? (
          <div className='relative z-10 space-y-3'>
            <div className='grid grid-cols-2 gap-2.5'>
              <div className='rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm'>
                <div className='flex items-center gap-1.5 mb-1'>
                  <Icon
                    icon='mdi:hospital-building'
                    className='h-3.5 w-3.5 text-white/60'
                  />
                  <p className='text-[10px] font-medium text-white/60 uppercase tracking-wider'>
                    Klinik
                  </p>
                </div>
                <p className='text-sm font-bold truncate'>
                  {profile.detail.clinic_name || '-'}
                </p>
              </div>

              <div className='rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm'>
                <div className='flex items-center gap-1.5 mb-1'>
                  <Icon icon='mdi:paw' className='h-3.5 w-3.5 text-white/60' />
                  <p className='text-[10px] font-medium text-white/60 uppercase tracking-wider'>
                    Hewan
                  </p>
                </div>
                <p className='text-sm font-bold truncate'>
                  {PET_LABELS[profile.detail.pet] ?? profile.detail.pet ?? '-'}
                </p>
              </div>

              <div className='rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm'>
                <div className='flex items-center gap-1.5 mb-1'>
                  <Icon
                    icon='mdi:shield-crown-outline'
                    className='h-3.5 w-3.5 text-white/60'
                  />
                  <p className='text-[10px] font-medium text-white/60 uppercase tracking-wider'>
                    RC Club
                  </p>
                </div>
                <p className='text-sm font-bold'>
                  {profile.detail.rc_club ? 'Anggota' : 'Bukan Anggota'}
                </p>
              </div>

              <div className='rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm'>
                <div className='flex items-center gap-1.5 mb-1'>
                  <Icon
                    icon='mdi:phone-outline'
                    className='h-3.5 w-3.5 text-white/60'
                  />
                  <p className='text-[10px] font-medium text-white/60 uppercase tracking-wider'>
                    Telepon
                  </p>
                </div>
                <p className='text-sm font-bold truncate'>
                  {profile.detail.phone || '-'}
                </p>
              </div>
            </div>

            {profile.check_in === null && checkInWindowOpen && (
              <button
                onClick={openQrModal}
                className='mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 active:scale-[0.98] cursor-pointer'>
                <Icon icon='mdi:qrcode-scan' className='h-5 w-5' />
                Check-in
              </button>
            )}

            {profile.check_in !== null && checkInWindowOpen && (
              <div className='mt-1 flex w-full items-center justify-center gap-2 px-5 py-3'>
                <Icon icon='mdi:check-circle' className='h-5 w-5 text-white' />
                <span className='text-sm font-bold text-white'>
                  Sudah Check-in
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className='py-4 text-center text-sm text-white/60'>
            Gagal memuat data profil.
          </p>
        )}
      </div>

      {homeBannerVisible ? <HomeBanner /> : null}

      {profile &&
        (() => {
          const totalPoints = Math.max(0, profile.detail.points ?? 0);
          const needDoor = Math.max(0, POINTS_TIER_DOORPRIZE - totalPoints);
          const needSpecial = Math.max(0, POINTS_TIER_SPECIAL - totalPoints);

          return (
            <div className='w-full rounded-2xl border border-neutral-100 bg-white px-2.5 py-4 shadow-sm sm:px-5'>
              <p className='text-sm font-bold leading-snug text-neutral-900 text-left mb-4'>
                Kumpulkan Score & Raih Hadiahnya!
              </p>
              <div className='w-full'>
                <div className='flex min-w-0 flex-1 items-start gap-2.5 pr-0 mb-0'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-50'>
                    <Icon icon='twemoji:coin' className='h-6 w-6' />
                  </span>
                  <div>
                    <p className='text-xs font-medium text-neutral-500'>
                      Total Score
                    </p>
                    <p className='text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-3xl'>
                      {totalPoints.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className='mt-1 flex min-h-0 w-full items-stretch gap-0'>
                <div className='min-w-0 flex-1'>
                  <ul className='mt-2 list-none space-y-1 text-[11px] leading-relaxed text-neutral-700 sm:text-xs'>
                    <li className='flex gap-1'>
                      <span className='shrink-0 text-rc-red font-bold'>•</span>
                      <span className='font-bold text-rc-red'>1200 Score:</span>
                      <span>Kesempatan Doorprize</span>
                    </li>
                    <li className='flex gap-1'>
                      <span className='shrink-0 text-rc-red font-bold'>•</span>
                      <span className='font-bold text-rc-red'>1500 Score:</span>
                      <span>
                        Hadiah Spesial untuk{' '}
                        <span className='font-bold'>50 orang pertama!**</span>
                      </span>
                    </li>
                  </ul>
                  <p className='text-[10px] text-neutral-500 italic mt-1'>
                    (**) Hanya untuk 50 orang penukar pertama yang menukar Score
                    ke meja registrasi.
                  </p>
                </div>
              </div>

              <div className='mt-4 border-t border-neutral-200 pt-3 text-center text-[11px] leading-relaxed text-neutral-600 sm:text-xs'>
                {totalPoints >= POINTS_TIER_SPECIAL ? (
                  <p>
                    Selamat! Kamu sudah memenuhi syarat mendapatkan kesempatan
                    Doorprize dan Kamu masih memerlukan beberapa Score untuk
                    Hadiah Spesial!
                  </p>
                ) : totalPoints >= POINTS_TIER_DOORPRIZE ? (
                  <p>
                    Kamu sudah memenuhi syarat mendapatkan kesempatan Doorprize.
                    Kamu masih memerlukan
                    <span className='font-extrabold text-rc-red'>
                      {needSpecial.toLocaleString('id-ID')} Score
                    </span>{' '}
                    untuk Hadiah Spesial!
                  </p>
                ) : (
                  <p>
                    Kamu masih memerlukan{' '}
                    <span className='font-extrabold text-rc-red'>
                      {needDoor.toLocaleString('id-ID')} Score
                    </span>{' '}
                    untuk memenuhi syarat mendapatkan kesempatan Doorprize dan{' '}
                    <span className='font-extrabold text-rc-red'>
                      {needSpecial.toLocaleString('id-ID')} Score
                    </span>{' '}
                    untuk Hadiah Spesial!
                  </p>
                )}
              </div>
            </div>
          );
        })()}

      {/* <button className='rounded-lg bg-rc-red/10 px-4 py-2 text-xs font-bold text-rc-red transition hover:bg-rc-red/20'>
            Tukar Poin
          </button> */}

      {/* Countdown — disembunyikan setelah EVENT_DATE */}
      {countdownParts && (
        <div className='w-full py-2 text-center'>
          <p className='text-sm font-semibold text-neutral-700'>
            Bersiaplah dalam:
          </p>
          <div className='mt-2 flex items-center justify-center gap-1.5 sm:gap-3'>
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
      )}

      {/* Menu grid */}
      <div className='grid w-full grid-cols-4 gap-1.5 sm:gap-2.5'>
        {MENU_ITEMS.map((item) => {
          const locked =
            GATED_HOME_MENU_HREFS.has(item.href) && !menuFeaturesEnabled;
          return (
            <button
              key={item.label}
              type='button'
              disabled={locked}
              title={locked ? 'Terbuka 4 Mei 2026 pukul 23.00 WIB' : undefined}
              className={`flex flex-col items-center gap-2 rounded-xl border p-2.5 sm:p-3 shadow-sm transition ${
                locked
                  ? 'cursor-not-allowed border-neutral-100/80 bg-neutral-50 opacity-60'
                  : 'cursor-pointer border-neutral-100 bg-white hover:border-rc-red/20 hover:shadow-md active:scale-95'
              }`}
              onClick={() => {
                if (locked) return;
                router.push(item.href);
              }}>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  locked ? 'bg-neutral-100' : 'bg-red-50'
                }`}>
                <Icon
                  icon={item.icon}
                  className={`h-6 w-6 ${locked ? 'text-neutral-400' : 'text-rc-red'}`}
                />
              </span>
              <span
                className={`text-center text-[11px] md:text-xs font-medium leading-snug ${
                  locked ? 'text-neutral-400' : 'text-neutral-700'
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className='w-full rounded-2xl bg-red-50/80 px-5 py-4'>
        <div className='flex items-start gap-3'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rc-red/10'>
            <Icon
              icon='material-symbols:info-outline-rounded'
              className='h-6 w-6 text-rc-red'
            />
          </span>
          <div>
            <p className='text-sm font-bold text-rc-red'>
              Cara Mendapatkan Score
            </p>
            <p className='mt-1 text-xs leading-relaxed text-neutral-600'>
              Kumpulkan Score dengan menyelesaikan tugas di booth, memberikan
              pertanyaan ke pembicara, dan mengisi tanggapan (feedback).
            </p>
          </div>
        </div>
      </div>

      <div
        className='mt-4 flex w-full select-none justify-center px-2 [-webkit-touch-callout:none]'
        onContextMenu={(e) => e.preventDefault()}>
        <Image
          src='/assets/icon-rc-animals.webp'
          alt='Ilustrasi hewan peliharaan Royal Canin'
          width={640}
          height={320}
          className='h-auto w-full max-w-md object-contain'
          sizes='(max-width: 512px) 100vw, 28rem'
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* QR Code / Check-in modal */}
      {showQrModal && profile && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={closeQrModal}
          />

          <div className='relative z-10 flex w-full max-w-lg flex-col items-center rounded-3xl bg-white px-6 py-8 shadow-2xl'>
            <button
              onClick={closeQrModal}
              className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 cursor-pointer'>
              <Icon icon='mdi:close' className='h-5 w-5' />
            </button>

            {checkInSuccess ? (
              <div className='flex flex-col items-center py-4'>
                <div className='flex h-20 w-20 items-center justify-center rounded-full bg-rc-red/10'>
                  <Icon
                    icon='mdi:check-circle'
                    className='h-12 w-12 text-rc-red'
                  />
                </div>

                <h3 className='mt-5 text-lg font-extrabold text-gray-900'>
                  Check-in Berhasil!
                </h3>
                <p className='mt-2 text-sm text-gray-500 text-center'>
                  Selamat datang{' '}
                  <span className='font-bold'>{profile.name}</span> <br />
                  di Acara Royal Canin Vet Symposium 2026
                </p>

                <div className='mt-5 flex items-center gap-3 rounded-2xl bg-yellow-50 border border-yellow-200 px-5 py-3'>
                  <Icon icon='twemoji:coin' className='h-8 w-8' />
                  <div>
                    <p className='text-xs font-medium text-yellow-700'>
                      Score Anda
                    </p>
                    <p className='text-2xl font-extrabold text-yellow-800 tabular-nums'>
                      {(profile.detail.points ?? 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeQrModal}
                  className='mt-6 w-full rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98] cursor-pointer'>
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <p className='text-xs font-bold uppercase tracking-widest text-gray-400'>
                  Pindai QR saat Registrasi
                </p>

                <div className='relative mt-5 rounded-3xl border-2 border-red-50 bg-white p-4'>
                  <div className='absolute left-0 top-0 -translate-x-1 -translate-y-1 rounded-tl-3xl border-l-4 border-t-4 border-rc-red w-6 h-6' />
                  <div className='absolute right-0 top-0 translate-x-1 -translate-y-1 rounded-tr-3xl border-r-4 border-t-4 border-rc-red w-6 h-6' />
                  <div className='absolute bottom-0 left-0 -translate-x-1 translate-y-1 rounded-bl-3xl border-b-4 border-l-4 border-rc-red w-6 h-6' />
                  <div className='absolute bottom-0 right-0 translate-x-1 translate-y-1 rounded-br-3xl border-b-4 border-r-4 border-rc-red w-6 h-6' />

                  {profile.qr_code?.image_path ? (
                    <img
                      src={`${QR_STORAGE_BASE}${profile.qr_code.image_path}`}
                      alt={`QR Code ${profile.qr_code.code}`}
                      className='h-48 w-48 rounded-2xl object-contain'
                    />
                  ) : (
                    <div className='flex h-48 w-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50'>
                      <span className='font-mono text-xs tracking-widest text-gray-400'>
                        [QR CODE]
                      </span>
                    </div>
                  )}
                </div>

                <div className='mt-4 flex items-center gap-2 text-xs text-gray-400'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-3.5 w-3.5'
                  />
                  <span>Menunggu scan dari panitia...</span>
                </div>

                <p className='mt-3 max-w-[280px] text-center text-sm font-medium leading-relaxed text-gray-500'>
                  Tunjukkan QR code ini kepada panitia saat check-in di lokasi
                  acara.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
