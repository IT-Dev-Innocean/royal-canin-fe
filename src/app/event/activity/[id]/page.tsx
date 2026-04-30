'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import {
  isActivityPlayComplete,
  isActivityPlayExplicitlyUncompleted,
  pickStartSessionToken,
  type EventActivityListItem,
} from '../activityListTypes';
import ResponseFeedback from '@/components/activity/ResponseFeedback';
import ScannerOpen from '@/components/activity/ScannerOpen';
import StudyCasePoster, {
  isStudyCasePosterHubActivity,
  isStudyCaseSubPosterActivity,
  studyCasePosterActivityPageTitle,
} from '@/components/activity/StudyCasePoster';

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
  const [activitiesFromApi, setActivitiesFromApi] = useState<
    EventActivityListItem[]
  >([]);

  const usherScannerRef = useRef<HTMLDivElement | null>(null);
  const html5UsherQrRef = useRef<Html5Qr | null>(null);

  const load = useCallback(async () => {
    if (Number.isNaN(id)) {
      setError('Aktivitas tidak ditemukan.');
      setActivity(null);
      setActivitiesFromApi([]);
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setError('Sesi habis, silakan login kembali.');
      setActivitiesFromApi([]);
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
        setActivitiesFromApi([]);
        return;
      }
      if (!isActivityList(json)) {
        setError('Data tidak valid.');
        setActivity(null);
        setActivitiesFromApi([]);
        return;
      }
      const found = json.data.find((a) => a.id === id) ?? null;
      if (!found) {
        setError('Aktivitas ini tidak tersedia.');
        setActivity(null);
        setActivitiesFromApi([]);
        return;
      }
      setActivity(found);
      setActivitiesFromApi(json.data);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setActivity(null);
      setActivitiesFromApi([]);
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
      const key = USHER_ONE_SHOT_STORAGE_KEY(activity.id);
      const stored = localStorage.getItem(key) === '1';

      /** Backend lebih akurat daripada flag lokal — jangan kunci tombol dari cache usang. */
      if (isActivityPlayExplicitlyUncompleted(activity.play_status) && stored) {
        localStorage.removeItem(key);
        setUsherOneShotDone(false);
        return;
      }

      setUsherOneShotDone(stored);
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
    usherOneShotDone &&
    /** Jangan mengandalkan `rc_event_usher_oneshot_done_*` jika API menyatakan `uncompleted`. */
    !isActivityPlayExplicitlyUncompleted(activity.play_status);
  const primaryCtaLocked = sessionPlayCompleted || usherLocked;
  const studyCasePosterHub = isStudyCasePosterHubActivity(activity);
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
          Kembali ke Kuis & Aktivitas
        </Link>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-lg px-4 py-2 pb-8 sm:px-6 md:py-4'>
      <div className='mb-6 text-center w-full max-w-lg'>
        <h1 className='text-xl font-bold mt-0 text-rc-red'>Kuis & Aktivitas</h1>
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
            {isStudyCaseSubPosterActivity(activity) ? (
              <p className='mb-1.5 text-center text-sm font-bold text-rc-red'>
                Study Case Poster
              </p>
            ) : null}
            <p className='text-center text-lg font-bold text-gray-900'>
              {studyCasePosterActivityPageTitle(activity)}
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

          <StudyCasePoster
            loading={loading}
            activity={activity}
            activitiesFromApi={activitiesFromApi}
          />

          {startError && !studyCasePosterHub && (
            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center'>
              <p className='text-sm text-amber-900'>{startError}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            {!studyCasePosterHub && (
              <>
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
              </>
            )}

            <Link
              href='/event/activity'
              className={
                studyCasePosterHub
                  ? 'block w-full rounded-xl border-2 border-rc-red bg-rc-red py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.99]'
                  : 'block w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3.5 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-100'
              }>
              Kembali
            </Link>
          </div>
        </div>
      )}

      {usherScanOpen && (
        <ScannerOpen
          onClose={closeUsherModal}
          isSubmitting={usherPostSubmitting}
          scannerHostRef={usherScannerRef}
          cameraError={usherCameraError}
          manualCode={usherManualCode}
          manualError={usherManualError}
          onManualCodeInput={(next) => {
            setUsherManualError(null);
            setUsherManualCode(next);
          }}
          onSubmitManual={submitUsherManual}
        />
      )}

      {usherFeedback && (
        <ResponseFeedback
          correct={usherFeedback.correct}
          message={usherFeedback.message}
          points={usherFeedback.points}
          limitLockout={usherFeedback.limitLockout}
          onDismiss={() => setUsherFeedback(null)}
          onRetryScan={() => {
            setUsherFeedback(null);
            void retryUsherScan();
          }}
        />
      )}

      {!loading && !activity && !error && (
        <p className='text-sm text-gray-500'>Tidak ada data.</p>
      )}
    </main>
  );
}
