'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import {
  isActivityPlayComplete,
  pickStartSessionToken,
  type EventActivityListItem,
} from '../activityListTypes';

function resolveStartToken(a: EventActivityListItem): string | null {
  return pickStartSessionToken(a);
}

function isActivityList(
  d: unknown
): d is { success: boolean; data: EventActivityListItem[] } {
  if (!d || typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  if (o.success === false) return false;
  return Array.isArray(o.data);
}

function isUsherFlow(a: EventActivityListItem | null): boolean {
  return (a?.flow_type?.trim().toLowerCase() ?? '') === 'usher_reward';
}

/** Satu kali submit per peserta: hanya jika usher_reward + questions_per_session === 1 */
function usherOneShotLimitApplies(a: EventActivityListItem | null): boolean {
  if (!a) return false;
  return isUsherFlow(a) && Number(a.questions_per_session) === 1;
}

const USHER_ONE_SHOT_STORAGE_KEY = (activityId: number) =>
  `rc_event_usher_oneshot_done_${activityId}`;

const PANDUAN_NUTRISI_ACTIVITY_CODE = 'PANDUAN_NUTRISI_PRAKTIS';
const PANDUAN_PDF_HREF = '/assets/pdf/Panduan-Nutrisi-Praktis.pdf';
const PANDUAN_COVER_SRC = '/assets/images/covers/panduan-nutrisi-praktis.webp';

/** Pesan batas 1x dari /api/activities/scan (non-already_applied) */
function isUsherOneShotLimitMessage(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    (m.includes('hanya') && m.includes('sekali')) ||
    (m.includes('hanya') && m.includes('dimainkan')) ||
    m.includes('sudah selesai di submit') ||
    (m.includes('sudah') && m.includes('submit'))
  );
}

type SystemQaScanResponse = {
  success?: boolean;
  message?: string;
  data?: {
    session?: { id?: number; status?: string } | null;
    resumed?: boolean;
  } | null;
};

type UsherScanResponse = {
  success?: boolean;
  message?: string;
  data?: {
    points_earned?: number;
    already_applied?: boolean;
    activity?: { id?: number; code?: string; name?: string };
  } | null;
};

type Html5Qr = {
  stop: () => Promise<void>;
  clear: () => void;
  getState: () => number;
};

export default function EventActivityEntryPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.id;
  const id =
    typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : Number.NaN;

  const [activity, setActivity] = useState<EventActivityListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [usherScanOpen, setUsherScanOpen] = useState(false);
  const [usherFeedback, setUsherFeedback] = useState<{
    correct: boolean;
    message: string;
    points: number | null;
    limitLockout?: boolean;
  } | null>(null);
  const [usherPostSubmitting, setUsherPostSubmitting] = useState(false);
  const [usherCameraKey, setUsherCameraKey] = useState(0);
  const [usherCameraError, setUsherCameraError] = useState<string | null>(null);
  const [usherOneShotDone, setUsherOneShotDone] = useState(false);
  const [usherManualCode, setUsherManualCode] = useState('');
  const [usherManualError, setUsherManualError] = useState<string | null>(null);

  const usherScannerRef = useRef<HTMLDivElement | null>(null);
  const html5UsherQrRef = useRef<Html5Qr | null>(null);

  const load = useCallback(async () => {
    if (Number.isNaN(id)) {
      setError('Aktivitas tidak ditemukan.');
      setActivity(null);
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setError('Sesi habis, silakan login kembali.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/activities', {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logoutParticipantHard();
        return;
      }
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(
          (json as { message?: string }).message ?? 'Gagal memuat aktivitas.'
        );
        setActivity(null);
        return;
      }
      if (!isActivityList(json)) {
        setError('Data tidak valid.');
        setActivity(null);
        return;
      }
      const found = json.data.find((a) => a.id === id) ?? null;
      if (!found) {
        setError('Aktivitas ini tidak tersedia.');
        setActivity(null);
        return;
      }
      setActivity(found);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activity) {
      setUsherOneShotDone(false);
      return;
    }
    if (!usherOneShotLimitApplies(activity)) {
      setUsherOneShotDone(false);
      return;
    }
    try {
      setUsherOneShotDone(
        localStorage.getItem(USHER_ONE_SHOT_STORAGE_KEY(activity.id)) === '1'
      );
    } catch {
      setUsherOneShotDone(false);
    }
  }, [activity]);

  const startSessionToken = activity ? resolveStartToken(activity) : null;
  const isUsher = isUsherFlow(activity);
  const sessionPlayCompleted =
    activity != null && isActivityPlayComplete(activity.play_status);
  const usherLocked =
    isUsher &&
    activity != null &&
    usherOneShotLimitApplies(activity) &&
    usherOneShotDone;
  const primaryCtaLocked = sessionPlayCompleted || usherLocked;
  const showPanduanNutrisiMaterial =
    activity?.code === PANDUAN_NUTRISI_ACTIVITY_CODE;

  const markUsherOneShotComplete = useCallback(() => {
    if (!activity || !usherOneShotLimitApplies(activity)) return;
    try {
      localStorage.setItem(USHER_ONE_SHOT_STORAGE_KEY(activity.id), '1');
    } catch {
      /* ignore */
    }
    setUsherOneShotDone(true);
  }, [activity]);

  const stopUsherScanner = useCallback(() => {
    const scanner = html5UsherQrRef.current;
    if (scanner) {
      try {
        if (scanner.getState() === 2) {
          void scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
        } else {
          try {
            scanner.clear();
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* already stopped */
      }
      html5UsherQrRef.current = null;
    }
  }, []);

  const closeUsherScanSheet = useCallback(() => {
    stopUsherScanner();
    setUsherScanOpen(false);
    setUsherCameraError(null);
    setUsherManualCode('');
    setUsherManualError(null);
    setUsherCameraKey(0);
  }, [stopUsherScanner]);

  const closeUsherModal = useCallback(() => {
    stopUsherScanner();
    setUsherScanOpen(false);
    setUsherFeedback(null);
    setUsherPostSubmitting(false);
    setUsherCameraError(null);
    setUsherCameraKey(0);
    setUsherManualCode('');
    setUsherManualError(null);
  }, [stopUsherScanner]);

  const submitUsherScan = useCallback(
    async (qrToken: string) => {
      const auth = getToken();
      if (!auth) {
        logoutParticipantHard();
        return;
      }
      setUsherPostSubmitting(true);
      try {
        const res = await fetch('/api/activities/scan', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${auth}`,
          },
          body: JSON.stringify({ token: qrToken.trim() }),
        });

        if (res.status === 401) {
          logoutParticipantHard();
          return;
        }

        const json = (await res.json().catch(() => ({}))) as UsherScanResponse;
        const limit = activity != null && usherOneShotLimitApplies(activity);

        if (limit && json.data?.already_applied === true) {
          markUsherOneShotComplete();
          setUsherFeedback({
            correct: true,
            message:
              json.message ??
              'Aktivitas ini sudah selesai di submit sebelumnya.',
            points: null,
            limitLockout: true,
          });
          closeUsherScanSheet();
          return;
        }

        if (!res.ok || json.success === false) {
          const errMsg =
            json.message ?? 'Gagal memproses kode. Coba scan lagi.';
          const isLimit =
            (limit && json.data?.already_applied === true) ||
            (limit && isUsherOneShotLimitMessage(errMsg));
          if (isLimit) {
            markUsherOneShotComplete();
          }
          setUsherFeedback({
            correct: false,
            message: errMsg,
            points: null,
            limitLockout: isLimit,
          });
          closeUsherScanSheet();
          return;
        }

        const msg = json.message ?? 'Poin berhasil ditambahkan.';
        const pts = json.data?.points_earned;
        setUsherFeedback({
          correct: true,
          message: msg,
          points: typeof pts === 'number' ? pts : null,
        });
        if (limit) {
          markUsherOneShotComplete();
        }
        closeUsherScanSheet();
      } catch {
        setUsherFeedback({
          correct: false,
          message: 'Tidak dapat terhubung ke server.',
          points: null,
        });
        closeUsherScanSheet();
      } finally {
        setUsherPostSubmitting(false);
      }
    },
    [activity, markUsherOneShotComplete, closeUsherScanSheet]
  );

  const submitUsherManual = useCallback(() => {
    if (usherPostSubmitting) return;
    const t = usherManualCode.trim();
    if (!t) {
      setUsherManualError('Masukkan kode terlebih dahulu.');
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(t)) {
      setUsherManualError(
        'Kode hanya boleh huruf, angka, titik, strip, dan garis bawah.'
      );
      return;
    }
    setUsherManualError(null);
    void submitUsherScan(t);
  }, [usherManualCode, usherPostSubmitting, submitUsherScan]);

  useEffect(() => {
    if (!usherScanOpen) return;

    let destroyed = false;
    const el = usherScannerRef.current;
    if (!el) return;

    const domId = `activity-usher-qr-${id}-${usherCameraKey}`;
    el.id = domId;
    setUsherCameraError(null);

    const run = async () => {
      await new Promise((r) => setTimeout(r, 150));
      if (destroyed) return;
      const { Html5Qrcode } = await import('html5-qrcode');
      if (destroyed || !usherScannerRef.current) return;

      const scanner = new Html5Qrcode(domId);
      html5UsherQrRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            const s = html5UsherQrRef.current;
            if (s) {
              void s
                .stop()
                .then(() => s.clear())
                .catch(() => {});
              html5UsherQrRef.current = null;
            }
            void submitUsherScan(decodedText);
          },
          () => {}
        );
      } catch {
        if (!destroyed) {
          setUsherCameraError(
            'Tidak dapat mengakses kamera. Berikan izin lalu coba lagi.'
          );
        }
        html5UsherQrRef.current = null;
      }
    };

    void run();

    return () => {
      destroyed = true;
      const s = html5UsherQrRef.current;
      if (s) {
        try {
          if (s.getState() === 2) {
            void s
              .stop()
              .then(() => s.clear())
              .catch(() => {});
          } else {
            try {
              s.clear();
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
        html5UsherQrRef.current = null;
      }
    };
  }, [usherScanOpen, id, usherCameraKey, submitUsherScan]);

  const handleStart = useCallback(async () => {
    if (!activity) return;
    setStartError(null);

    const token = getToken();
    if (!token) {
      logoutParticipantHard();
      return;
    }

    const scanToken = resolveStartToken(activity);
    if (!scanToken) {
      setStartError(
        'Token mulai sesi belum tersedia untuk aktivitas ini. Hubungi admin.'
      );
      return;
    }

    setStarting(true);
    try {
      const res = await fetch('/api/activities/scan', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: scanToken }),
      });

      if (res.status === 401) {
        logoutParticipantHard();
        return;
      }

      const json = (await res.json().catch(() => ({}))) as SystemQaScanResponse;

      if (!res.ok || json.success === false) {
        setStartError(json.message ?? 'Gagal memulai sesi aktivitas.');
        return;
      }

      const sessionId = json.data?.session?.id;
      const target = `/event/activity/quiz?activityId=${activity.id}${
        sessionId ? `&sessionId=${sessionId}` : ''
      }`;
      router.push(target);
    } catch {
      setStartError('Tidak dapat terhubung ke server.');
    } finally {
      setStarting(false);
    }
  }, [activity, router]);

  const openUsherScanModal = useCallback(() => {
    setUsherFeedback(null);
    setUsherCameraError(null);
    setUsherCameraKey(0);
    setUsherManualCode('');
    setUsherManualError(null);
    setUsherScanOpen(true);
  }, []);

  const retryUsherScan = useCallback(() => {
    setUsherFeedback(null);
    setUsherCameraError(null);
    setUsherManualError(null);
    setUsherCameraKey((k) => k + 1);
    setUsherScanOpen(true);
  }, []);

  if (Number.isNaN(id)) {
    return (
      <main className='mx-auto w-full max-w-lg px-4 py-2 pb-8 sm:px-6 md:py-4'>
        <p className='text-sm text-red-600'>ID aktivitas tidak valid.</p>
        <Link
          href='/event/activity'
          className='mt-4 block text-sm font-bold text-rc-red'>
          Kembali ke Kuis & Permainan
        </Link>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-lg px-4 py-2 pb-8 sm:px-6 md:py-4'>
      <div className='mb-6 text-center w-full max-w-lg'>
        <h1 className='text-xl font-bold mt-0 text-rc-red'>Kuis & Permainan</h1>
      </div>

      {loading && (
        <div className='flex flex-col items-center py-12'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
        </div>
      )}

      {!loading && error && !activity && (
        <p className='text-sm text-center text-amber-800'>{error}</p>
      )}

      {activity && (
        <div className='space-y-4'>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
            <p className='text-center text-lg font-bold text-gray-900'>
              {activity.name}
            </p>
            <p className='mt-3 text-center text-sm leading-relaxed text-gray-600'>
              {activity.description}
            </p>
            {isUsher && (
              <p className='mt-3 text-center text-[11px] text-gray-500'>
                Scan QR dari panitia di lokasi, lalu poin dicatat ke akun Anda.
              </p>
            )}
          </div>

          {showPanduanNutrisiMaterial && (
            <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5'>
              <p className='text-left text-sm font-bold leading-snug text-gray-900'>
                <mark className='rounded-sm bg-amber-200/90 px-0.5 text-gray-900'>
                  Temukan Panduan Nutrisi Praktis disini
                </mark>
              </p>
              <div className='my-3 h-px w-full bg-gray-200' />

              <div className='overflow-hidden rounded-xl border border-gray-100 bg-gray-50'>
                <div className='relative aspect-3/4 w-full'>
                  <Image
                    src={PANDUAN_COVER_SRC}
                    alt='Sampul Panduan Nutrisi Praktis'
                    fill
                    className='object-cover'
                    sizes='(max-width: 640px) 100vw, 28rem'
                    priority={false}
                  />
                </div>
              </div>

              <h2 className='mt-3 text-left text-sm sm:text-base font-bold text-gray-900'>
                Panduan Nutrisi Praktis
              </h2>
              <p className='mt-0.5 text-left text-[11px] sm:text-sm text-gray-500'>
                Diperbarui 22 April 2026
              </p>

              <a
                href={PANDUAN_PDF_HREF}
                download
                className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-200'>
                <Icon icon='mdi:download' className='h-5 w-5' />
                Unduh Materi
              </a>
            </div>
          )}

          {startError && (
            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center'>
              <p className='text-sm text-amber-900'>{startError}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <button
              type='button'
              onClick={() => {
                if (primaryCtaLocked) return;
                if (isUsher) {
                  openUsherScanModal();
                  return;
                }
                void handleStart();
              }}
              disabled={
                primaryCtaLocked ||
                (!isUsher && (starting || !startSessionToken))
              }
              className={
                primaryCtaLocked
                  ? 'flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-3 py-3.5 text-center text-sm font-bold leading-snug text-gray-600'
                  : 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rc-red px-3 py-3.5 text-center text-sm font-bold leading-snug text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60'
              }>
              {starting && !isUsher ? (
                <>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 text-white'
                  />
                  Memulai sesi…
                </>
              ) : primaryCtaLocked ? (
                'Aktivitas ini sudah di submit'
              ) : (
                'Mulai sesi'
              )}
            </button>

            {!isUsher &&
              !startSessionToken &&
              !starting &&
              !sessionPlayCompleted && (
                <p className='text-center text-[11px] text-gray-500'>
                  Token mulai sesi belum tersedia untuk aktivitas ini.
                </p>
              )}

            <Link
              href='/event/activity'
              className='block w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3.5 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-100'>
              Kembali
            </Link>
          </div>
        </div>
      )}

      {usherScanOpen && (
        <div className='fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={closeUsherModal}
          />
          <div
            className='relative z-10 max-h-[min(92dvh,100%)] w-full max-w-lg touch-pan-y overflow-y-auto overscroll-y-contain rounded-t-2xl bg-white p-5 pb-[max(4rem,env(safe-area-inset-bottom,0px))] shadow-2xl [scrollbar-gutter:stable] sm:max-h-[min(90dvh,44rem)] sm:rounded-2xl'
            style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className='mb-4 flex items-center justify-between gap-2'>
              <div>
                <h2 className='text-lg font-bold text-gray-900'>
                  Scan QR Code
                </h2>
                <p className='mt-0.5 text-xs text-gray-500'>
                  Tampilkan kode di lokasi agar poin tercatat
                </p>
              </div>
              <button
                type='button'
                onClick={closeUsherModal}
                disabled={usherPostSubmitting}
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50'>
                <Icon icon='mdi:close' className='h-5 w-5' />
              </button>
            </div>

            <div className='relative overflow-hidden rounded-xl bg-black'>
              <div ref={usherScannerRef} className='min-h-[220px] w-full' />
              {usherPostSubmitting && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/75'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-10 w-10 text-white'
                  />
                  <p className='mt-2 text-sm text-white'>Memproses…</p>
                </div>
              )}
            </div>
            {usherCameraError && (
              <p className='my-2 text-center text-xs text-amber-800'>
                {usherCameraError}
              </p>
            )}

            <p className='mt-3 text-center text-xs leading-relaxed text-gray-500'>
              Arahkan kamera ke QR code usher reward. Pastikan kode terbaca
              jelas.
            </p>

            <div className='my-5 flex items-center gap-3'>
              <div className='h-px min-w-0 flex-1 bg-gray-200' />
              <span className='shrink-0 text-[11px] font-semibold text-gray-400'>
                atau
              </span>
              <div className='h-px min-w-0 flex-1 bg-gray-200' />
            </div>

            <div className='rounded-xl border border-gray-100 bg-slate-50/90 p-4'>
              <p className='text-xs font-bold text-gray-800'>
                Masukkan kode manual
              </p>
              <p className='mt-0.5 text-xs leading-relaxed text-gray-500'>
                Jika kamera tidak tersedia, izin ditolak, atau pemindaian gagal,
                ketik kode yang ada di bawah QR poster, lalu klik tombol kirim.
              </p>
              {usherManualError && (
                <p className='mt-2 text-center text-xs text-red-600'>
                  {usherManualError}
                </p>
              )}
              <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch'>
                <input
                  type='text'
                  value={usherManualCode}
                  onChange={(e) => {
                    setUsherManualError(null);
                    setUsherManualCode(e.target.value.toUpperCase());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !usherPostSubmitting) {
                      e.preventDefault();
                      void submitUsherManual();
                    }
                  }}
                  disabled={usherPostSubmitting}
                  autoComplete='off'
                  autoCapitalize='characters'
                  spellCheck={false}
                  placeholder='Kode public_token di QR'
                  className='min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm text-gray-900 shadow-inner outline-none transition focus:border-rc-red focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-100'
                />
                <button
                  type='button'
                  disabled={usherPostSubmitting}
                  onClick={() => void submitUsherManual()}
                  className='shrink-0 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5'>
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {usherFeedback && (
        <div className='fixed inset-0 z-60 flex items-center justify-center p-6'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setUsherFeedback(null)}
          />
          <div className='relative w-full max-w-[320px] rounded-2xl bg-white p-7 text-center shadow-2xl'>
            {usherFeedback.correct ? (
              <>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-rc-red'>
                  <Icon icon='mdi:check-bold' className='h-8 w-8' />
                </div>
                <h3 className='text-xl font-bold text-gray-900'>
                  Poin tercatat!
                </h3>
                {typeof usherFeedback.points === 'number' && (
                  <div className='mx-auto mt-2 flex w-[150px] items-center justify-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3'>
                    <Icon icon='twemoji:coin' className='h-8 w-8' />
                    <div>
                      <p className='text-2xl font-extrabold tabular-nums text-yellow-800'>
                        {usherFeedback.points}
                      </p>
                    </div>
                  </div>
                )}
                <p className='mt-2 text-xs text-gray-500'>
                  {usherFeedback.message}
                </p>
                <button
                  type='button'
                  onClick={() => setUsherFeedback(null)}
                  className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#b50015]'>
                  {usherFeedback.limitLockout ? 'Tutup' : 'Lanjut'}
                </button>
              </>
            ) : (
              <>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50 text-rc-red'>
                  <Icon icon='mdi:close-thick' className='h-8 w-8' />
                </div>
                <h3 className='text-xl font-bold text-gray-900'>Belum Tepat</h3>
                <p className='mt-2 text-[12px] leading-relaxed text-gray-500'>
                  {usherFeedback.message}
                </p>
                {usherFeedback.limitLockout ? (
                  <button
                    type='button'
                    onClick={() => setUsherFeedback(null)}
                    className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b50015]'>
                    Tutup
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={() => {
                      setUsherFeedback(null);
                      void retryUsherScan();
                    }}
                    className='mt-5 w-full cursor-pointer rounded-xl bg-rc-red py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#b50015]'>
                    Coba Scan Ulang
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !activity && !error && (
        <p className='text-sm text-gray-500'>Tidak ada data.</p>
      )}
    </main>
  );
}
