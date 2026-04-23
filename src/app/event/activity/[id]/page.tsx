'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getToken, logoutParticipantHard } from '@/lib/auth';
import {
  pickStartSessionToken,
  type EventActivityListItem,
} from '../activityListTypes';

// TODO(backend): hapus setelah GET /activities mengembalikan start_session token.
// Fallback sementara untuk testing, dipakai kalau response API belum menyertakan
// start_session_token / scannable_codes untuk aktivitas tersebut.
const START_TOKEN_FALLBACK: Record<number, string> = {
  2: 'DMY-GP-START', // Gastro Produk
};

function resolveStartToken(a: EventActivityListItem): string | null {
  return pickStartSessionToken(a) ?? START_TOKEN_FALLBACK[a.id] ?? null;
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
  const [usherResult, setUsherResult] = useState<{
    message: string;
    pointsEarned?: number;
  } | null>(null);
  const [usherApiError, setUsherApiError] = useState<string | null>(null);
  const [usherPostSubmitting, setUsherPostSubmitting] = useState(false);
  const [usherCameraKey, setUsherCameraKey] = useState(0);
  const [usherCameraError, setUsherCameraError] = useState<string | null>(null);
  const [usherOneShotDone, setUsherOneShotDone] = useState(false);
  /** Modal: error batas 1x — hanya alert kuning, tanpa kamera & keterangan bawah */
  const [usherModalLimitAlertOnly, setUsherModalLimitAlertOnly] =
    useState(false);

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
  const usherLocked =
    isUsher &&
    activity != null &&
    usherOneShotLimitApplies(activity) &&
    usherOneShotDone;

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

  const closeUsherModal = useCallback(() => {
    stopUsherScanner();
    setUsherScanOpen(false);
    setUsherResult(null);
    setUsherApiError(null);
    setUsherModalLimitAlertOnly(false);
    setUsherPostSubmitting(false);
    setUsherCameraError(null);
    setUsherCameraKey(0);
  }, [stopUsherScanner]);

  const submitUsherScan = useCallback(
    async (qrToken: string) => {
      const auth = getToken();
      if (!auth) {
        logoutParticipantHard();
        return;
      }
      setUsherPostSubmitting(true);
      setUsherApiError(null);
      setUsherModalLimitAlertOnly(false);
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
          setUsherResult({
            message:
              json.message ??
              'Aktivitas ini sudah selesai di submit sebelumnya.',
          });
          setUsherApiError(null);
          return;
        }

        if (!res.ok || json.success === false) {
          setUsherResult(null);
          const errMsg =
            json.message ?? 'Gagal memproses kode. Coba scan lagi.';
          setUsherApiError(errMsg);
          const isLimit =
            (limit && json.data?.already_applied === true) ||
            (limit && isUsherOneShotLimitMessage(errMsg));
          if (isLimit) {
            setUsherModalLimitAlertOnly(true);
            markUsherOneShotComplete();
          } else {
            setUsherModalLimitAlertOnly(false);
          }
          return;
        }

        const msg = json.message ?? 'Poin berhasil ditambahkan.';
        const pts = json.data?.points_earned;
        setUsherResult(
          typeof pts === 'number'
            ? { message: msg, pointsEarned: pts }
            : { message: msg }
        );
        setUsherApiError(null);
        if (limit) {
          markUsherOneShotComplete();
        }
      } catch {
        setUsherResult(null);
        setUsherModalLimitAlertOnly(false);
        setUsherApiError('Tidak dapat terhubung ke server.');
      } finally {
        setUsherPostSubmitting(false);
      }
    },
    [activity, markUsherOneShotComplete]
  );

  useEffect(() => {
    if (!usherScanOpen) return;
    if (usherResult) return;
    if (usherApiError) return;
    if (usherModalLimitAlertOnly) return;

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
  }, [
    usherScanOpen,
    id,
    usherCameraKey,
    usherResult,
    usherApiError,
    usherModalLimitAlertOnly,
    submitUsherScan,
  ]);

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
    setUsherResult(null);
    setUsherApiError(null);
    setUsherModalLimitAlertOnly(false);
    setUsherCameraError(null);
    setUsherCameraKey(0);
    setUsherScanOpen(true);
  }, []);

  const retryUsherScan = useCallback(() => {
    setUsherApiError(null);
    setUsherModalLimitAlertOnly(false);
    setUsherCameraError(null);
    setUsherResult(null);
    setUsherCameraKey((k) => k + 1);
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

          {startError && (
            <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center'>
              <p className='text-sm text-amber-900'>{startError}</p>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <button
              type='button'
              onClick={() => {
                if (usherLocked) return;
                if (isUsher) {
                  openUsherScanModal();
                  return;
                }
                void handleStart();
              }}
              disabled={
                usherLocked || (!isUsher && (starting || !startSessionToken))
              }
              className={
                usherLocked
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
              ) : usherLocked ? (
                'Aktivitas ini sudah di submit'
              ) : (
                'Mulai sesi'
              )}
            </button>

            {!isUsher && !startSessionToken && !starting && (
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
          <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl h-[62vh] sm:h-auto'>
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

            {usherResult && (
              <div className='rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center'>
                <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
                  <Icon icon='mdi:check-bold' className='h-7 w-7' />
                </div>
                <p className='text-sm font-semibold text-gray-900'>
                  {usherResult.message}
                </p>
                {usherResult.pointsEarned != null && (
                  <p className='mt-2 text-2xl font-black text-rc-red tabular-nums'>
                    +{usherResult.pointsEarned} poin
                  </p>
                )}
                <button
                  type='button'
                  onClick={closeUsherModal}
                  className='cursor-pointer mt-4 w-full rounded-xl bg-rc-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015]'>
                  Tutup
                </button>
              </div>
            )}

            {!usherResult && (
              <>
                {usherApiError && (
                  <div
                    className={
                      usherModalLimitAlertOnly
                        ? 'rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center'
                        : 'mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center'
                    }>
                    <p className='text-sm text-amber-900'>{usherApiError}</p>
                    {!usherModalLimitAlertOnly && (
                      <button
                        type='button'
                        onClick={retryUsherScan}
                        disabled={usherPostSubmitting}
                        className='mt-2 text-sm font-bold text-rc-red underline disabled:opacity-50'>
                        Coba scan lagi
                      </button>
                    )}
                  </div>
                )}

                {!usherModalLimitAlertOnly && (
                  <>
                    {usherCameraError && !usherApiError && (
                      <p className='mb-3 text-center text-sm text-amber-800'>
                        {usherCameraError}
                      </p>
                    )}

                    <div className='relative overflow-hidden rounded-xl bg-black'>
                      <div
                        ref={usherScannerRef}
                        className='min-h-[220px] w-full'
                      />
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

                    <p className='mt-3 text-center text-xs leading-relaxed text-gray-500'>
                      Arahkan kamera ke QR code usher reward. Pastikan kode
                      terbaca jelas.
                    </p>
                  </>
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
