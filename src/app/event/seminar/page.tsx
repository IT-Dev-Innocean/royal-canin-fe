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
  profile_detail?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** ID pembicara yang memakai blok "Profil Lengkap" statis di modal. */
const SPEAKER_IDS_WITH_STATIC_PROFILE = [2, 3, 4] as const;

const PROFILE_DETAIL_SPEAKER_ID_2 = `Pendidikan
• DVM (Dokter Hewan): The Ohio State University.
• Internsip: Rotating Internship (Hewan Kecil) di Purdue University.
• Residensi & Master (MS): Penyakit Dalam di The Ohio State University.
• Post-Doktoral: Fellow penelitian di bidang Mucosal Immunology di The Ohio State University dan Microbial Pathogenesis di Nationwide Children's Hospital.

Keahlian
• Penyakit Dalam Hewan Kecil: Spesialisasi Internal Medicine.
• Fokus Riset: Endokrinologi gastrointestinal, enteropati kronis, penyakit pankreas dan hati, imunologi mukosa, dan mikrobioma usus.

Karier & Jabatan
• Associate Professor (Tenure): Small Animal Internal Medicine, The Ohio State University Veterinary Medical Center.
• Staff Internist & Peneliti: Praktisi medis dan ilmuwan riset.

Aktivitas Profesional
• Keanggotaan: Anggota American College of Veterinary Internal Medicine.
• Riset Klinis: Mengembangkan studi terkait patofisiologi penyakit dan metode pengobatan terbaru.`;

const PROFILE_DETAIL_SPEAKER_ID_3 = `Pendidikan
• Sarjana & Profesi Dokter Hewan: IPB University.
• Ph.D.: Yamaguchi University, Jepang.
• Spesialisasi: Diplomate Asian College of Veterinary Internal Medicine (Kardiologi).

Keahlian
• Kardiologi Veteriner: Spesialisasi dalam kesehatan jantung hewan.
• Pencitraan Diagnostik: Ahli dalam interpretasi Radiografi, USG, CT Scan, dan MRI.

Karier & Jabatan
• Wakil Rektor: Bidang Pendidikan dan Kemahasiswaan IPB University.
• Akademisi: Dosen SKHB IPB (sejak 1997), mantan Direktur RSHP, dan mantan Dekan SKHB IPB.

Aktivitas Profesional
• Internasional: Adjunct Professor, Visiting Professor, dan Pensyarah Pelawat di berbagai universitas luar negeri.
• Kontribusi Ilmiah: Penulis buku, artikel ilmiah, dan aktif dalam pengembangan Continuing Professional Development (CPD).`;

const PROFILE_DETAIL_SPEAKER_ID_4 = `Pendidikan
• Dokter Hewan: Fakultas Kedokteran Hewan, Universitas Udayana, Bali.
• Sertifikasi Program Cambridge E-Learning (Fokus pada Animal Welfare).

Keahlian
• Dermatologi: Penanganan penyakit kulit hewan kecil dengan ketelitian diagnosis tinggi.
• Bedah Jaringan Lunak (Soft Tissue Surgery): Operasi non-tulang pada hewan kecil.
• Penyakit Dalam (Internal Medicine): Manajemen kasus klinis kompleks.
• Onkologi Veteriner: Manajemen diagnosis dan terapi tumor.

Karier & Jabatan
• Founder & Praktisi: Listriani Vet Care & Semer Vet Clinic (Sejak 2001).
• Pengalaman: Lebih dari 30 tahun sebagai praktisi klinis hewan kecil.

Aktivitas Profesional
• Pembicara: Aktif berbagi wawasan klinis dalam berbagai seminar dan forum ilmiah kedokteran hewan.
• Pengembangan Diri: Konsisten mengikuti workshop dan pelatihan tingkat nasional serta internasional.
• Dedikasi: Berfokus pada peningkatan standar layanan kesehatan hewan dan kesejahteraan pasien di Indonesia.`;

const STATIC_SPEAKER_PROFILE_TEXT: Partial<Record<number, string>> = {
  2: PROFILE_DETAIL_SPEAKER_ID_2,
  3: PROFILE_DETAIL_SPEAKER_ID_3,
  4: PROFILE_DETAIL_SPEAKER_ID_4,
};

function getStaticProfileDetailText(speakerId: number): string | null {
  const t = STATIC_SPEAKER_PROFILE_TEXT[speakerId];
  return t ?? null;
}

const STATIC_SPEAKER_DR_ADAM_RUDINSKY: EventSeminarSpeaker = {
  id: 2,
  name: 'dr. Adam Rudinsky, DVM, MS, DACVIM',
  title:
    'Associate Professor, Small Animal Internal Medicine Veterinary Medical Center, The Ohio State University',
  photo: '/assets/speaker-adam.webp',
  bio: 'Fibre Forward: Unlocking The Power of Fibre in Managing GI Health',
};

const STATIC_SPEAKER_PROF_DENI_NOVIANA: EventSeminarSpeaker = {
  id: 3,
  name: 'Prof. drh. Deni Noviana, Ph.D., DAiCVIM',
  title:
    'Professor Diagnostic Imaging IPB University & Diplomate in Asian College of Vet. Internal Medicine',
  photo: '/assets/speaker-deni.webp',
  bio: 'Diagnostic Imaging of Gastrointestinal Disorders in Cats and Dogs Focus on Fibre-Related and Common Clinical Conditions.',
};

const STATIC_SPEAKER_DRH_LUH_PUTU_LISTRIANI: EventSeminarSpeaker = {
  id: 4,
  name: 'drh. Luh Putu Listriani Wistawan',
  title: 'Senior Vet of Listriani Vet Clinic & Semer Vet Clinic, Bali',
  photo: '/assets/speaker-luh-putu.webp',
  bio: 'Clinical Case Study and Practical Approach in Daily Practice',
};

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
  if (s.startsWith('/')) return s;
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

  const apiSpeakers = seminar?.speakers ?? [];
  const staticIds = new Set<number>(SPEAKER_IDS_WITH_STATIC_PROFILE);
  const speakers = [
    STATIC_SPEAKER_DR_ADAM_RUDINSKY,
    STATIC_SPEAKER_PROF_DENI_NOVIANA,
    STATIC_SPEAKER_DRH_LUH_PUTU_LISTRIANI,
    ...apiSpeakers.filter((s) => !staticIds.has(s.id)),
  ];
  const selectedStaticProfileDetail =
    selectedSpeaker != null
      ? getStaticProfileDetailText(selectedSpeaker.id)
      : null;
  const thumbSrc = mediaUrl(seminar?.thumbnail);

  return (
    <main className='flex flex-col items-center p-4 pb-20 min-h-screen text-black relative'>
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
          <div className='rounded-2xl border border-gray-100 bg-white text-left shadow-sm'>
            {thumbSrc && (
              <div
                className='select-none overflow-hidden rounded-t-2xl mb-5 border border-gray-100 bg-gray-50 shadow-sm [-webkit-touch-callout:none]'
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
            <div className='px-4 pb-4'>
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
            </div>
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
                <div className='mb-4 rounded-2xl border border-red-100 bg-red-50/50 p-4'>
                  <p className='mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rc-red md:text-xs'>
                    <Icon icon='mdi:information' className='h-3 w-3' />
                    Topik Pembahasan
                  </p>
                  <p className='text-xs font-medium leading-relaxed text-gray-800 md:text-sm'>
                    {selectedSpeaker.bio}
                  </p>
                </div>
              )}
              {selectedStaticProfileDetail && (
                <div className='rounded-2xl border border-gray-100 bg-gray-50/80 p-4'>
                  <p className='mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-600 md:text-xs'>
                    Profil Lengkap
                  </p>
                  <p className='whitespace-pre-wrap text-xs font-medium leading-relaxed text-gray-800 md:text-sm'>
                    {selectedStaticProfileDetail}
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
