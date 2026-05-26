'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getToken } from '@/lib/auth';
import {
  clearSeminarFaqConfirmation,
  type SeminarFaqConfirmationPayload,
} from '@/lib/seminarFaqConfirmation';

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

interface ApiSpeaker {
  id: number;
  name: string;
  title?: string | null;
  photo?: string | null;
}

interface SeminarsPage {
  data: Array<{
    id: number;
    speakers?: ApiSpeaker[];
  }>;
}

/** GET /seminars/:id/my-questions — satu entri pertanyaan milik user */
export interface MyQuestionEntry {
  id: number;
  seminar_id?: number;
  speaker_id?: number;
  question: string;
  points_earned?: number;
  created_at?: string | null;
  speaker?: {
    id?: number;
    name?: string;
    title?: string | null;
    photo?: string | null;
  };
}

function extractMyQuestionsPayload(json: unknown): MyQuestionEntry[] {
  if (!json || typeof json !== 'object') return [];
  const data = (json as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return [];
  const questions = (data as Record<string, unknown>).questions;
  if (!Array.isArray(questions)) return [];
  return questions as MyQuestionEntry[];
}

/** `data.total_questions` dari GET my-questions (fallback `total_question`, lalu panjang `questions`). */
function extractTotalQuestions(json: unknown): number {
  if (!json || typeof json !== 'object') return 0;
  const data = (json as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return 0;
  const d = data as Record<string, unknown>;
  const questions = d.questions;
  const listed = Array.isArray(questions) ? questions.length : 0;
  const raw = d.total_questions ?? d.total_question;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(raw, listed);
  }
  return listed;
}

function formatQuestionTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function speakerPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  const s = String(photo);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${STORAGE_BASE}${s.replace(/^\//, '')}`;
}

export default function PertanyaanPage() {
  const [seminarId, setSeminarId] = useState<number | null>(null);
  const [speakers, setSpeakers] = useState<ApiSpeaker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingSeminar, setLoadingSeminar] = useState(true);

  const [selectedId, setSelectedId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successResult, setSuccessResult] =
    useState<SeminarFaqConfirmationPayload | null>(null);
  /** Konfirmasi sebelum POST kirim pertanyaan */
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [showMyQuestionsModal, setShowMyQuestionsModal] = useState(false);
  const [myQuestions, setMyQuestions] = useState<MyQuestionEntry[]>([]);
  const [myQuestionsLoading, setMyQuestionsLoading] = useState(false);
  const [myQuestionsError, setMyQuestionsError] = useState<string | null>(null);
  /** Dari GET my-questions `data.total_questions`; `null` = belum dimuat. */
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);

  const fetchSeminar = useCallback(async () => {
    setLoadingSeminar(true);
    setLoadError(null);
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
        data?: SeminarsPage;
      };

      if (!res.ok || json.success === false) {
        setLoadError(json.message ?? 'Gagal memuat data seminar.');
        return;
      }

      const rows = json.data?.data;
      if (!rows?.length) {
        setLoadError('Belum ada data seminar.');
        return;
      }

      const first = rows[0];
      setSeminarId(first.id);
      setSpeakers(first.speakers ?? []);
    } catch {
      setLoadError('Tidak dapat terhubung ke server.');
    } finally {
      setLoadingSeminar(false);
    }
  }, []);

  useEffect(() => {
    void fetchSeminar();
    clearSeminarFaqConfirmation();
  }, [fetchSeminar]);

  const fetchMyQuestionsMeta = useCallback(async () => {
    if (!seminarId) {
      setTotalQuestions(null);
      return;
    }
    const token = getToken();
    if (!token) {
      setTotalQuestions(null);
      return;
    }
    try {
      const res = await fetch(`/api/seminars/${seminarId}/my-questions`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || json.success === false) {
        setTotalQuestions(0);
        return;
      }
      setTotalQuestions(extractTotalQuestions(json));
    } catch {
      setTotalQuestions(0);
    }
  }, [seminarId]);

  useEffect(() => {
    if (loadingSeminar || !seminarId) return;
    void fetchMyQuestionsMeta();
  }, [loadingSeminar, seminarId, fetchMyQuestionsMeta]);

  const selectedSpeaker = speakers.find((s) => s.id.toString() === selectedId);
  const photoSrc = selectedSpeaker
    ? speakerPhotoUrl(selectedSpeaker.photo)
    : null;

  function openSubmitConfirm() {
    if (!seminarId || !selectedId || !message.trim()) return;

    const token = getToken();
    if (!token) {
      setFormError('Silakan login terlebih dahulu untuk mengirim pertanyaan.');
      return;
    }

    setFormError(null);
    setShowSubmitConfirm(true);
  }

  async function submitQuestionAfterConfirm() {
    if (!seminarId || !selectedId || !message.trim()) return;

    const token = getToken();
    if (!token) {
      setFormError('Silakan login terlebih dahulu untuk mengirim pertanyaan.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/seminars/${seminarId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          speaker_id: Number(selectedId),
          question: message.trim(),
        }),
      });

      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: {
          question?: string;
          points_earned?: number;
          speaker?: { id?: number; name?: string; title?: string | null };
        };
        errors?: Record<string, string[]>;
      };

      if (!res.ok || json.success === false) {
        const firstErr =
          json.errors && Object.values(json.errors).flat().find(Boolean);
        setFormError(firstErr ?? json.message ?? 'Gagal mengirim pertanyaan.');
        return;
      }

      const data = json.data;
      const points = data?.points_earned ?? 0;
      const speakerName =
        data?.speaker?.name ?? selectedSpeaker?.name ?? 'Pembicara';
      const qText = data?.question ?? message.trim();

      setShowSubmitConfirm(false);
      setSuccessResult({
        message: json.message ?? 'Pertanyaan berhasil dikirim.',
        points_earned: points,
        question: qText,
        speaker_name: speakerName,
      });
      setMessage('');
      setSelectedId('');
      void fetchMyQuestionsMeta();
    } catch {
      setFormError('Tidak dapat terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadMyQuestions() {
    if (!seminarId) return;
    const token = getToken();
    if (!token) {
      setMyQuestionsError('Silakan login untuk melihat pertanyaan Anda.');
      return;
    }
    setMyQuestionsLoading(true);
    setMyQuestionsError(null);
    try {
      const res = await fetch(`/api/seminars/${seminarId}/my-questions`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || json.success === false) {
        setMyQuestions([]);
        setMyQuestionsError(json.message ?? 'Gagal memuat pertanyaan Anda.');
        return;
      }
      setMyQuestions(extractMyQuestionsPayload(json));
      setTotalQuestions(extractTotalQuestions(json));
    } catch {
      setMyQuestions([]);
      setMyQuestionsError('Tidak dapat terhubung ke server.');
    } finally {
      setMyQuestionsLoading(false);
    }
  }

  function openMyQuestionsModal() {
    setShowMyQuestionsModal(true);
    void loadMyQuestions();
  }

  function closeMyQuestionsModal() {
    setShowMyQuestionsModal(false);
    setMyQuestionsError(null);
  }

  const hasPoints = successResult != null && successResult.points_earned > 0;

  return (
    <main className='flex flex-col items-center p-6 bg-white min-h-screen text-black relative'>
      <div className='mb-8 text-center'>
        <h1 className='text-xl font-bold mt-0'>Formulir Pertanyaan</h1>
        <p className='mt-1 text-xs text-gray-500'>
          Kirim pertanyaan ke pembicara sesuai seminar berlangsung
        </p>
      </div>

      {loadingSeminar && (
        <div className='flex justify-center py-12'>
          <Icon
            icon='svg-spinners:ring-resize'
            className='h-10 w-10 text-rc-red'
          />
        </div>
      )}

      {!loadingSeminar && loadError && (
        <p className='text-center text-sm text-red-600 max-w-lg'>{loadError}</p>
      )}

      {!loadingSeminar && !loadError && (
        <div className='w-full max-w-lg space-y-5'>
          {!getToken() && (
            <p className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900'>
              Login diperlukan untuk mengirim pertanyaan.
            </p>
          )}

          {speakers.length === 0 ? (
            <p className='text-center text-sm text-gray-500'>
              Belum ada daftar pembicara untuk seminar ini.
            </p>
          ) : (
            <>
              <div className='relative'>
                <label className='text-xs md:text-sm font-bold mb-1 block text-gray-700'>
                  Ditujukan Kepada Pembicara
                </label>
                <button
                  type='button'
                  onClick={() => setIsOpen(!isOpen)}
                  className='w-full border border-gray-300 rounded-lg p-3 text-xs md:text-sm bg-white flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-red-500'>
                  <span
                    className={
                      selectedSpeaker ? 'text-black' : 'text-gray-400'
                    }>
                    {selectedSpeaker
                      ? selectedSpeaker.name
                      : 'Pilih Nama Pembicara'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {isOpen && (
                  <>
                    <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden'>
                      <ul className='max-h-60 overflow-y-auto'>
                        {speakers.map((s) => (
                          <li
                            key={s.id}
                            onClick={() => {
                              setSelectedId(s.id.toString());
                              setIsOpen(false);
                            }}
                            className={`p-3 text-xs md:text-sm cursor-pointer transition-colors border-t border-gray-50
                        ${
                          selectedId === s.id.toString()
                            ? 'bg-red-600 text-white'
                            : 'hover:bg-rc-red hover:text-white text-gray-700'
                        }`}>
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className='fixed inset-0 z-40'
                      aria-hidden
                      onClick={() => setIsOpen(false)}
                    />
                  </>
                )}
              </div>

              {selectedSpeaker && (
                <div className='flex items-center gap-3 bg-red-100 p-3 rounded-xl border border-red-200 animate-fadeIn'>
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-white shrink-0 relative'>
                    {photoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoSrc}
                        alt=''
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-red-50'>
                        <Icon
                          icon='mdi:account'
                          className='h-7 w-7 text-rc-red/40'
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className='text-xs md:text-sm font-bold text-red-700 leading-tight'>
                      {selectedSpeaker.name}
                    </p>
                    <p className='text-[11px] text-black'>
                      {selectedSpeaker.title ?? ''}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className='text-xs md:text-sm font-bold mb-1 block text-gray-700'>
                  Silakan isi pertanyaan
                </label>
                <div className='relative'>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={1000}
                    placeholder='Tulis pertanyaan di sini...'
                    className='w-full border border-gray-300 rounded-2xl p-4 text-xs md:text-sm min-h-[250px] focus:outline-none focus:ring-1 focus:ring-red-500'
                  />
                  <span className='absolute bottom-4 right-4 text-xs md:text-sm text-gray-400'>
                    {message.length}/1000
                  </span>
                </div>
              </div>

              {formError && (
                <p className='text-sm text-red-600' role='alert'>
                  {formError}
                </p>
              )}

              <div className='pt-4 space-y-3'>
                <button
                  type='button'
                  onClick={openSubmitConfirm}
                  disabled={
                    !selectedId || !message.trim() || submitting || !getToken()
                  }
                  className='w-full py-3 bg-rc-red text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] disabled:bg-gray-300 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-2'>
                  {submitting ? (
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='h-5 w-5 text-white'
                    />
                  ) : null}
                  Kirim Pertanyaan
                </button>
                {getToken() &&
                  totalQuestions !== null &&
                  totalQuestions > 0 && (
                    <button
                      type='button'
                      onClick={openMyQuestionsModal}
                      className='w-full py-3 rounded-xl border-2 border-rc-red bg-white text-rc-red font-bold shadow-sm transition hover:bg-red-50 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2'>
                      <Icon
                        icon='mdi:comment-question-outline'
                        className='h-5 w-5 shrink-0'
                      />
                      Lihat Pertanyaan Saya
                    </button>
                  )}
              </div>
            </>
          )}
        </div>
      )}

      {showSubmitConfirm && selectedSpeaker && (
        <div className='fixed inset-0 z-92 flex items-end justify-center p-0 sm:items-center sm:p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => !submitting && setShowSubmitConfirm(false)}
          />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='confirm-submit-title'
            className='relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl'>
            <div className='border-b border-gray-100 px-5 py-4'>
              <h2
                id='confirm-submit-title'
                className='text-center text-sm font-bold leading-snug text-gray-900'>
                Apakah Pertanyaan anda dibawah ini sudah benar atau masih ada
                yang salah ?
              </h2>
            </div>

            <div className='max-h-[min(55vh,420px)] overflow-y-auto px-5 py-4'>
              <div className='rounded-xl border border-gray-200 bg-gray-50/90 p-4 text-left'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                  Untuk pembicara
                </p>
                <p className='mt-1 text-sm font-bold text-gray-900'>
                  {selectedSpeaker.name}
                </p>
                <p className='mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                  Pertanyaan Anda
                </p>
                <p className='mt-1 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap'>
                  {message.trim()}
                </p>
              </div>

              {formError && (
                <p
                  className='mt-3 text-center text-sm text-red-600'
                  role='alert'>
                  {formError}
                </p>
              )}
            </div>

            <div className='flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:gap-3'>
              <button
                type='button'
                disabled={submitting}
                onClick={() => setShowSubmitConfirm(false)}
                className='order-2 w-full rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:order-1 sm:flex-1'>
                Belum
              </button>
              <button
                type='button'
                disabled={submitting}
                onClick={() => void submitQuestionAfterConfirm()}
                className='order-1 flex w-full items-center justify-center gap-2 rounded-xl bg-rc-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:opacity-60 sm:order-2 sm:flex-1'>
                {submitting ? (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-5 w-5 text-white'
                  />
                ) : null}
                Ya, Sudah Benar
              </button>
            </div>
          </div>
        </div>
      )}

      {showMyQuestionsModal && (
        <div className='fixed inset-0 z-90 flex items-center justify-center p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={closeMyQuestionsModal}
          />

          <div className='relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
            <div className='flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3'>
              <h2 className='text-base font-bold text-gray-900'>
                Pertanyaan Saya
              </h2>
              <button
                type='button'
                onClick={closeMyQuestionsModal}
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200'>
                <Icon icon='mdi:close' className='h-5 w-5' />
              </button>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3'>
              {myQuestionsLoading && (
                <div className='flex justify-center py-12'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-10 w-10 text-rc-red'
                  />
                </div>
              )}

              {!myQuestionsLoading && myQuestionsError && (
                <p className='py-4 text-center text-sm text-red-600'>
                  {myQuestionsError}
                </p>
              )}

              {!myQuestionsLoading &&
                !myQuestionsError &&
                myQuestions.length === 0 && (
                  <p className='py-8 text-center text-sm text-gray-500'>
                    Belum ada pertanyaan yang Anda kirim.
                  </p>
                )}

              {!myQuestionsLoading &&
                !myQuestionsError &&
                myQuestions.length > 0 && (
                  <ul className='max-h-[min(480px,50vh)] space-y-2 overflow-y-auto pr-1'>
                    {myQuestions.map((q) => (
                      <li
                        key={q.id}
                        className='rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm'>
                        <p className='text-[11px] tracking-tighter text-gray-400 font-bold'>
                          Ditujukan Kepada {q.speaker?.name ?? 'Pembicara'}
                        </p>
                        <p className='mt-1 text-xs sm:text-sm text-gray-900 whitespace-pre-wrap'>
                          {q.question}
                        </p>
                        <div className='mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500'>
                          {typeof q.points_earned === 'number' && (
                            <span>
                              Score:{' '}
                              <span className='font-medium text-rc-red'>
                                {q.points_earned.toLocaleString('id-ID')}
                              </span>
                            </span>
                          )}
                          <span>{formatQuestionTime(q.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
        </div>
      )}

      {successResult && (
        <div className='fixed inset-0 z-80 flex items-end justify-center sm:items-center p-0 sm:p-4'>
          <button
            type='button'
            aria-label='Tutup'
            className='absolute inset-0 bg-black/50 backdrop-blur-[1px]'
            onClick={() => setSuccessResult(null)}
          />
          <div className='relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl'>
            <div className='flex justify-center pt-8'>
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-rc-red shadow-lg shadow-red-200'>
                <Icon icon='mdi:check' className='h-12 w-12 text-white' />
              </div>
            </div>
            <div className='overflow-y-auto px-5 pb-6 pt-4 text-center'>
              <h2 className='text-lg font-bold text-gray-900'>
                Pertanyaan Berhasil Dikirim
              </h2>
              <div className='mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left text-sm'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                  Untuk pembicara
                </p>
                <p className='mt-0.5 font-bold text-gray-900'>
                  {successResult.speaker_name}
                </p>
                <p className='mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                  Pertanyaan Anda
                </p>
                <p className='mt-1 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap'>
                  {successResult.question}
                </p>
              </div>

              {hasPoints ? (
                <div className='mt-4 rounded-xl bg-rc-red p-4 text-white shadow-md'>
                  <p className='text-lg font-bold'>
                    +{successResult.points_earned.toLocaleString('id-ID')} Score
                    ditambahkan
                  </p>
                  <p className='mt-1 text-xs opacity-90'>
                    Terima kasih telah berpartisipasi aktif dalam sesi ini.
                  </p>
                </div>
              ) : (
                <div className='mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700'>
                  Untuk pertanyaan ini tidak ada Score tambahan <br />
                  (karena setiap peserta hanya dapat mengirimkan maksimal 4
                  pertanyaan).
                </div>
              )}

              <p className='mt-4 text-xs leading-relaxed text-gray-600'>
                Pertanyaan Anda akan dikurasi oleh panitia dan pertanyaan yang
                lolos akan dijawab di sesi tanya jawab.
              </p>

              <div className='mt-6 flex flex-col gap-2'>
                <Link
                  href='/event'
                  className='block w-full rounded-xl bg-rc-red py-3 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] cursor-pointer'>
                  Kembali ke Menu Acara
                </Link>
                <button
                  type='button'
                  onClick={() => setSuccessResult(null)}
                  className='w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 cursor-pointer'>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
