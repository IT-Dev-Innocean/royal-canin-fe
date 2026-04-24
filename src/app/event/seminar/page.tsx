'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getToken } from '@/lib/auth';
import { SEMINAR_BOTTOM_ACTIONS_OPEN_AT } from '@/lib/eventMenuFeaturesOpenAt';
import { formatSeminarDateTimeUtc } from '@/components/dashboard/seminar/seminar-date';

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

const BOTTOM_ACTIONS = [
  {
    icon: 'mdi:email-outline',
    label: 'Kirim Pertanyaan',
    href: '/event/seminar/faq',
  },
  {
    icon: 'mdi:clipboard-text-outline',
    label: 'Beri Tanggapan',
    href: '/event/seminar/feedback',
  },
] as const;

export interface EventSeminarSpeaker {
  id: number;
  seminar_id?: number;
  name: string;
  title?: string | null;
  photo?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EventSeminarDetail {
  id: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  qr_code?: string | null;
  join_points?: number | null;
  speakers?: EventSeminarSpeaker[];
  is_joined?: boolean;
}

interface SeminarJoinSuccessModalState {
  joinPoints: number | null;
  seminarTitle: string | null;
  message: string;
}

function extractSeminarJoinFromScanResponse(
  json: unknown
): SeminarJoinSuccessModalState {
  const fallbackMsg = 'Berhasil join seminar.';
  if (!json || typeof json !== 'object') {
    return { joinPoints: null, seminarTitle: null, message: fallbackMsg };
  }
  const root = json as Record<string, unknown>;
  const msg =
    typeof root.message === 'string' && root.message.trim()
      ? root.message
      : fallbackMsg;

  const data = root.data;
  let seminar: Record<string, unknown> | null = null;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.seminar && typeof d.seminar === 'object') {
      seminar = d.seminar as Record<string, unknown>;
    } else {
      seminar = d;
    }
  }

  const joinPoints =
    seminar && typeof seminar.join_points === 'number'
      ? seminar.join_points
      : null;
  const seminarTitle =
    seminar && typeof seminar.title === 'string' ? seminar.title : null;

  return { joinPoints, seminarTitle, message: msg };
}

interface SeminarsPaginatedResponse {
  current_page: number;
  data: EventSeminarDetail[];
}

function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const s = String(path);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${STORAGE_BASE}${s.replace(/^\//, '')}`;
}

export default function SeminarPage() {
  const router = useRouter();
  const [seminar, setSeminar] = useState<EventSeminarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] =
    useState<EventSeminarSpeaker | null>(null);
  const [bottomActionsVisible, setBottomActionsVisible] = useState(
    () => Date.now() >= SEMINAR_BOTTOM_ACTIONS_OPEN_AT.getTime()
  );

  const [showCheckInScanner, setShowCheckInScanner] = useState(false);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [seminarJoinSuccessModal, setSeminarJoinSuccessModal] =
    useState<SeminarJoinSuccessModalState | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const checkInScannerRef = useRef<HTMLDivElement>(null);
  const html5QrScannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    getState: () => number;
  } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 5000);
  }

  const fetchSeminar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch('/api/seminars', {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: SeminarsPaginatedResponse;
      };

      if (!res.ok || json.success === false) {
        setError(json.message ?? 'Gagal memuat data seminar.');
        setSeminar(null);
        return;
      }

      const page = json.data;
      const rows = page?.data;
      if (!rows?.length) {
        setError('Belum ada data seminar.');
        setSeminar(null);
        return;
      }

      setSeminar(rows[0]);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setSeminar(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSeminar();
  }, [fetchSeminar]);

  // async function submitManualJoin(code: string) {
  //   const trimmed = code.trim();
  //   if (!trimmed) {
  //     showToast('error', 'Masukkan kode seminar.');
  //     return;
  //   }
  //   await handleSeminarJoinScan(trimmed);
  // }

  /** Participant API: POST /api/v1/seminars/scan (Scan QR Code Seminar — Join) */
  async function handleSeminarJoinScan(qrCode: string) {
    const token = getToken();
    if (!token) {
      showToast('error', 'Silakan login terlebih dahulu untuk join seminar.');
      return;
    }

    setScanSubmitting(true);
    try {
      const res = await fetch('/api/seminars/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_code: qrCode.trim() }),
      });
      const json = await res.json();

      if (res.ok && (json as { success?: boolean }).success !== false) {
        closeCheckInScanner();
        void fetchSeminar();
        setSeminarJoinSuccessModal(extractSeminarJoinFromScanResponse(json));
      } else {
        const msg =
          typeof (json as { message?: string }).message === 'string'
            ? (json as { message: string }).message
            : 'Gagal join seminar.';
        showToast('error', msg);
      }
    } catch {
      showToast('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setScanSubmitting(false);
    }
  }

  function dismissSeminarJoinSuccessModal() {
    setSeminarJoinSuccessModal(null);
  }

  function closeCheckInScanner() {
    const scanner = html5QrScannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === 2) {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
        }
      } catch {
        /* already stopped */
      }
      html5QrScannerRef.current = null;
    }
    setShowCheckInScanner(false);
  }

  async function openCheckInScanner() {
    const token = getToken();
    if (!token) {
      showToast('error', 'Silakan login terlebih dahulu untuk join seminar.');
      return;
    }

    setShowCheckInScanner(true);
    await new Promise((r) => setTimeout(r, 100));

    const { Html5Qrcode } = await import('html5-qrcode');
    if (!checkInScannerRef.current) return;

    const scannerId = 'seminar-checkin-qr-reader';
    checkInScannerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    html5QrScannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          scanner
            .stop()
            .then(() => {
              scanner.clear();
            })
            .catch(() => {});
          void handleSeminarJoinScan(decodedText);
        },
        () => {}
      );
    } catch {
      showToast(
        'error',
        'Tidak dapat mengakses kamera. Berikan izin kamera di browser lalu coba lagi.'
      );
      setShowCheckInScanner(false);
      html5QrScannerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      const s = html5QrScannerRef.current;
      if (s) {
        try {
          if (s.getState() === 2) {
            void s.stop().then(() => s.clear());
          }
        } catch {
          /* ignore */
        }
        html5QrScannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (bottomActionsVisible) return;
    const ms = SEMINAR_BOTTOM_ACTIONS_OPEN_AT.getTime() - Date.now();
    if (ms <= 0) {
      setBottomActionsVisible(true);
      return;
    }
    const id = window.setTimeout(() => setBottomActionsVisible(true), ms);
    return () => window.clearTimeout(id);
  }, [bottomActionsVisible]);

  const speakers = seminar?.speakers ?? [];
  const thumbSrc = mediaUrl(seminar?.thumbnail);

  return (
    <main className='flex flex-col items-center p-4 pb-20 min-h-screen text-black relative'>
      <div className='mb-6 w-full max-w-lg text-center'>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          <h1 className='text-xl font-bold mt-0'>
            {loading ? 'Seminar' : (seminar?.title ?? 'Seminar')}
          </h1>
        </div>
        <p className='text-xs text-gray-500 mt-1'>
          {loading
            ? 'Memuat…'
            : seminar?.description?.trim()
              ? seminar.description
              : 'Informasi seminar dan daftar pembicara'}
        </p>
      </div>

      {loading && (
        <div className='flex justify-center py-12'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
        </div>
      )}

      {!loading && error && (
        <p className='text-sm text-red-600 text-center max-w-lg'>{error}</p>
      )}

      {!loading && !error && seminar && (
        <div className='w-full max-w-lg space-y-5'>
          {thumbSrc && (
            <div
              className='select-none overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm [-webkit-touch-callout:none]'
              onContextMenu={(e) => e.preventDefault()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc}
                alt=''
                className='max-h-48 w-full object-cover sm:max-h-56'
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          )}

          <div className='rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm'>
            <p className='text-[11px] font-bold uppercase tracking-wider text-gray-400'>
              Waktu
            </p>
            <p className='mt-1 text-sm text-gray-800'>
              <span className='font-semibold'>Mulai:</span>{' '}
              {formatSeminarDateTimeUtc(seminar.starts_at)}
            </p>
            <p className='mt-1 text-sm text-gray-800'>
              <span className='font-semibold'>Selesai:</span>{' '}
              {formatSeminarDateTimeUtc(seminar.ends_at)}
            </p>
            {typeof seminar.is_joined === 'boolean' && (
              <>
                <p className='mt-2 text-xs italic text-gray-600'>
                  Status:{' '}
                  <span
                    className={
                      seminar.is_joined
                        ? 'text-emerald-600 font-bold'
                        : 'text-gray-500'
                    }>
                    {seminar.is_joined ? 'Terdaftar' : 'Belum Terdaftar'}
                  </span>
                </p>
                {!seminar.is_joined && (
                  <div className='mt-3 space-y-3'>
                    <button
                      type='button'
                      onClick={() => void openCheckInScanner()}
                      className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
                      <Icon
                        icon='mdi:qrcode-scan'
                        className='h-5 w-5 shrink-0'
                      />
                      Scan QR — Join Seminar
                    </button>
                  </div>
                )}
                {seminar.is_joined && (
                  <p className='mt-3 text-center text-xs sm:text-sm text-emerald-700 flex items-center justify-center'>
                    <Icon
                      icon='mdi:check-circle'
                      className='h-4 w-4 sm:h-5 sm:w-5 mr-1 text-emerald-700'
                    />
                    Anda sudah bergabung di seminar ini.
                  </p>
                )}
              </>
            )}
          </div>

          {speakers.length === 0 ? (
            <p className='text-center text-sm text-gray-500'>
              Belum ada pembicara.
            </p>
          ) : (
            <div className='space-y-4'>
              {speakers.map((speaker) => {
                const avatarSrc = mediaUrl(speaker.photo);
                return (
                  <div
                    key={speaker.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => setSelectedSpeaker(speaker)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSpeaker(speaker);
                      }
                    }}
                    className='bg-white rounded-r-2xl rounded-l-lg shadow-sm border border-gray-100 p-4 relative cursor-pointer hover:shadow-md active:scale-[0.98] transition-all group'>
                    <div className='absolute top-0 left-0 w-1 h-full bg-rc-red rounded-l-[20px]' />

                    <div className='flex items-center gap-4 pl-2'>
                      <div className='w-16 h-16 rounded-full overflow-hidden bg-red-50 border-2 border-white shadow-sm shrink-0 relative'>
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarSrc}
                            alt=''
                            className='absolute inset-0 h-full w-full object-cover'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-[10px] text-rc-red/60'>
                            <Icon icon='mdi:account' className='h-8 w-8' />
                          </div>
                        )}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <h2 className='text-[13px] md:text-sm font-bold text-rc-red leading-tight mb-1'>
                          {speaker.name}
                        </h2>
                        <p className='text-[11px] md:text-xs text-gray-500 line-clamp-2 leading-relaxed'>
                          {speaker.title ?? ''}
                        </p>
                      </div>
                    </div>

                    <div className='mt-5 flex items-center justify-end'>
                      <span className='w-1/2 sm:w-[35%] py-2 sm:py-3 bg-rc-red text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 pointer-events-none'>
                        Lihat Profil
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {bottomActionsVisible ? (
        <div className='mt-10 grid w-full max-w-lg grid-cols-1 gap-3 md:grid-cols-2'>
          {BOTTOM_ACTIONS.map((action) => (
            <button
              key={action.label}
              type='button'
              onClick={() => router.push(action.href)}
              className='flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition hover:border-rc-red/20 hover:shadow-md active:scale-[0.97]'>
              <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50'>
                <Icon icon={action.icon} className='h-6 w-6 text-rc-red' />
              </span>
              <span className='text-left text-sm font-bold leading-tight text-neutral-800'>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {seminarJoinSuccessModal && (
        <div className='fixed inset-0 z-60 flex items-center justify-center p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={dismissSeminarJoinSuccessModal}
          />

          <div className='relative z-10 flex w-full max-w-lg flex-col items-center rounded-3xl bg-white px-6 py-8 shadow-2xl'>
            <button
              type='button'
              onClick={dismissSeminarJoinSuccessModal}
              className='absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200'>
              <Icon icon='mdi:close' className='h-5 w-5' />
            </button>

            <div className='flex flex-col items-center py-4'>
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-rc-red/10'>
                <Icon
                  icon='mdi:check-circle'
                  className='h-12 w-12 text-rc-red'
                />
              </div>

              <h3 className='mt-5 text-lg font-extrabold text-gray-900'>
                Join Seminar Berhasil!
              </h3>
              <p className='mt-2 text-center text-sm text-gray-500'>
                {seminarJoinSuccessModal.seminarTitle ? (
                  <>
                    Anda bergabung di{' '}
                    <span className='font-bold text-gray-700'>
                      {seminarJoinSuccessModal.seminarTitle}
                    </span>
                  </>
                ) : (
                  <span>{seminarJoinSuccessModal.message}</span>
                )}
              </p>

              {seminarJoinSuccessModal.joinPoints != null && (
                <div className='mt-5 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-3'>
                  <Icon icon='twemoji:coin' className='h-8 w-8 shrink-0' />
                  <div className='min-w-0 text-left'>
                    <p className='text-xs font-medium text-yellow-700'>
                      Poin Join Seminar
                    </p>
                    <p className='text-2xl font-extrabold tabular-nums text-yellow-800'>
                      {seminarJoinSuccessModal.joinPoints.toLocaleString(
                        'id-ID'
                      )}
                    </p>
                  </div>
                </div>
              )}

              <button
                type='button'
                onClick={dismissSeminarJoinSuccessModal}
                className='mt-6 w-full cursor-pointer rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckInScanner && (
        <div className='fixed inset-0 z-60 flex items-center justify-center p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={closeCheckInScanner}
          />
          <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl'>
            <div className='mb-4 flex items-center justify-between gap-2'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>
                  Scan QR — Join Seminar
                </h3>
                <p className='mt-0.5 text-xs text-gray-500'>
                  Izinkan akses kamera untuk memindai kode di lokasi acara
                </p>
              </div>
              <button
                type='button'
                onClick={closeCheckInScanner}
                disabled={scanSubmitting}
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50 cursor-pointer'>
                <Icon icon='mdi:close' className='h-5 w-5' />
              </button>
            </div>

            <div className='relative overflow-hidden rounded-xl bg-black'>
              <div ref={checkInScannerRef} className='min-h-[200px] w-full' />
              {scanSubmitting && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-10 w-10 text-white'
                  />
                  <p className='mt-3 text-sm font-medium text-white'>
                    Memproses join seminar…
                  </p>
                </div>
              )}
            </div>

            <p className='mt-4 text-center text-xs leading-relaxed text-gray-500'>
              Arahkan kamera ke QR Code join seminar dari panitia. Pastikan kode
              terlihat jelas di dalam kotak pemindaian.
            </p>
          </div>
        </div>
      )}

      {selectedSpeaker && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-3 md:p-0 animate-fadeIn'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setSelectedSpeaker(null)}
          />

          <div className='relative bg-white rounded-3xl w-full max-w-[340px] md:max-w-lg shadow-2xl scale-in-center overflow-hidden flex flex-col max-h-[90vh]'>
            <button
              type='button'
              onClick={() => setSelectedSpeaker(null)}
              className='absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-10 cursor-pointer'>
              <Icon icon='mdi:close' className='w-4 h-4' />
            </button>

            <div className='py-6 px-4 md:px-6 overflow-y-auto'>
              <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-red-100 shadow-md mx-auto mb-4 relative bg-red-50'>
                {mediaUrl(selectedSpeaker.photo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(selectedSpeaker.photo)!}
                    alt=''
                    className='absolute inset-0 h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <Icon
                      icon='mdi:account'
                      className='h-16 w-16 text-rc-red/30'
                    />
                  </div>
                )}
              </div>

              <div className='text-center mb-6'>
                <h3 className='text-base font-bold text-rc-red mb-2'>
                  {selectedSpeaker.name}
                </h3>
                <p className='text-[11px] md:text-xs text-gray-600 leading-relaxed'>
                  {selectedSpeaker.title ?? ''}
                </p>
              </div>

              {selectedSpeaker.bio && (
                <div className='bg-red-50/50 rounded-2xl p-4 border border-red-100 mb-6'>
                  <p className='text-[11px] md:text-xs font-bold text-rc-red uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                    <Icon icon='mdi:information' className='w-3 h-3' />
                    Topik Pembahasan
                  </p>
                  <p className='text-xs md:text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap'>
                    {selectedSpeaker.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className='fixed bottom-6 left-4 right-4 z-70 mx-auto flex max-w-sm justify-center sm:left-auto sm:right-6'>
          <div
            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}>
            <Icon
              icon={
                toast.type === 'success'
                  ? 'mdi:check-circle'
                  : 'mdi:alert-circle'
              }
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                toast.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            />
            <p className='text-sm font-medium leading-snug'>{toast.message}</p>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='shrink-0 rounded-full p-1 text-current opacity-60 hover:opacity-100'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
