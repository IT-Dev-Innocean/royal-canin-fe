'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken } from '@/lib/auth';
import type {
  SeminarDetail,
  SeminarQuestionEntry,
  SeminarSpeaker,
} from './types';
import { formatSeminarDateTimeUtc } from './seminar-date';
import { SeminarQuestionsModal } from './SeminarQuestionsModal';
import { SpeakerFormModal } from './SpeakerFormModal';

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

function speakerPhotoSrc(photo: string | null | undefined): string | null {
  if (!photo) return null;
  return String(photo).startsWith('http') ? photo : `${STORAGE_BASE}${photo}`;
}

type SpeakerModalState = 'closed' | 'add' | { edit: SeminarSpeaker };

function extractQuestionsFromResponse(json: unknown): SeminarQuestionEntry[] {
  if (!json || typeof json !== 'object') return [];
  const j = json as Record<string, unknown>;
  const d = j.data;
  if (Array.isArray(d)) return d as SeminarQuestionEntry[];
  if (d && typeof d === 'object') {
    const inner = (d as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as SeminarQuestionEntry[];
  }
  return [];
}

export interface SeminarDetailViewProps {
  data: SeminarDetail | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function SeminarDetailView({
  data,
  loading,
  error,
  onRefresh,
  onToast,
}: SeminarDetailViewProps) {
  const [speakerModal, setSpeakerModal] = useState<SpeakerModalState>('closed');
  const [questions, setQuestions] = useState<SeminarQuestionEntry[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionSpeakerFilter, setQuestionSpeakerFilter] = useState('');
  const [qrImageFallback, setQrImageFallback] = useState(false);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);

  useEffect(() => {
    setQrImageFallback(false);
  }, [data?.id, data?.qr_image_path]);

  useEffect(() => {
    const seminarId = data?.id;
    if (!seminarId) return;

    let cancelled = false;

    async function loadQuestions() {
      setQuestionsLoading(true);
      setQuestionsError(null);
      const token = getAdminToken();
      if (!token) {
        setQuestionsError('Token tidak ditemukan.');
        setQuestionsLoading(false);
        return;
      }

      const qs = questionSpeakerFilter
        ? `?speaker_id=${encodeURIComponent(questionSpeakerFilter)}`
        : '';

      try {
        const res = await fetch(
          `/api/admin/seminars/${seminarId}/questions${qs}`,
          {
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = (await res.json()) as {
          success?: boolean;
          message?: string;
        };

        if (res.status === 401) {
          if (!cancelled) setQuestionsError('Sesi tidak valid.');
          return;
        }

        if (!res.ok || json.success === false) {
          if (!cancelled) {
            setQuestions([]);
            setQuestionsError(
              json.message ?? 'Gagal memuat daftar pertanyaan.'
            );
          }
          return;
        }

        const rows = extractQuestionsFromResponse(json);
        if (!cancelled) setQuestions(rows);
      } catch {
        if (!cancelled) {
          setQuestions([]);
          setQuestionsError('Tidak dapat terhubung ke server.');
        }
      } finally {
        if (!cancelled) setQuestionsLoading(false);
      }
    }

    void loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [
    data?.id,
    data?.questions_count,
    data?.updated_at,
    questionSpeakerFilter,
  ]);

  const thumbSrc =
    data?.thumbnail && !String(data.thumbnail).startsWith('http')
      ? `${STORAGE_BASE}${data.thumbnail}`
      : (data?.thumbnail ?? null);

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <Icon icon='svg-spinners:ring-resize' className='h-8 w-8 text-rc-red' />
      </div>
    );
  }

  if (error) {
    return <p className='text-sm text-red-600'>{error}</p>;
  }

  if (!data) {
    return null;
  }

  const seminarId = data.id;

  async function handleDeleteSpeaker(s: SeminarSpeaker) {
    if (!s.id) {
      onToast?.('error', 'Pembicara tidak memiliki ID.');
      return;
    }
    if (!window.confirm(`Hapus pembicara "${s.name}"?`)) return;

    const token = getAdminToken();
    if (!token) return;

    try {
      const res = await fetch(
        `/api/admin/seminars/${seminarId}/speakers/${s.id}`,
        {
          method: 'DELETE',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || json.success === false) {
        onToast?.('error', json.message ?? 'Gagal menghapus pembicara.');
        return;
      }

      onRefresh?.();
      onToast?.('success', json.message ?? 'Pembicara berhasil dihapus.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    }
  }

  const speakerForModal: SeminarSpeaker | null =
    speakerModal === 'closed' || speakerModal === 'add'
      ? null
      : speakerModal.edit;

  const QR_DUMMY = '/assets/qr-dummy.svg';
  const resolvedQrSrc = speakerPhotoSrc(data.qr_image_path);
  const showQrSection = Boolean(data.qr_code || data.qr_image_path);
  const qrDisplaySrc =
    !resolvedQrSrc || qrImageFallback ? QR_DUMMY : resolvedQrSrc;

  return (
    <div className='space-y-6'>
      {thumbSrc && (
        <div className='overflow-hidden rounded-xl border border-gray-100 bg-gray-50'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt=''
            className='max-h-64 w-full object-cover sm:max-h-80'
          />
        </div>
      )}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Mulai
          </p>
          <p className='mt-1 text-xs sm:text-sm text-gray-800'>
            {formatSeminarDateTimeUtc(data.starts_at)}
          </p>
        </div>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Selesai
          </p>
          <p className='mt-1 text-xs sm:text-sm text-gray-800'>
            {formatSeminarDateTimeUtc(data.ends_at)}
          </p>
        </div>
      </div>
      <div>
        <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
          Judul
        </p>
        <p className='mt-1 text-base sm:text-lg font-bold text-gray-900'>
          {data.title}
        </p>
      </div>
      {data.description && (
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Deskripsi
          </p>
          <p className='mt-1 whitespace-pre-wrap text-[11px] sm:text-sm text-gray-700'>
            {data.description}
          </p>
        </div>
      )}
      {showQrSection && (
        <div className='flex flex-col items-center rounded-xl border border-gray-100 bg-white p-4 text-center'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-500'>
            QR Code Seminar
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDisplaySrc}
            alt={data.qr_code ? `QR seminar ${data.qr_code}` : 'QR seminar'}
            onError={() => {
              if (qrImageFallback) return;
              setQrImageFallback(true);
            }}
            className='mt-3 h-40 w-40 rounded-lg border border-rc-red object-contain sm:h-48 sm:w-48'
          />
        </div>
      )}
      <div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Pembicara
          </p>
          <button
            type='button'
            onClick={() => setSpeakerModal('add')}
            className='inline-flex items-center gap-1.5 rounded-lg border border-rc-red/30 bg-rc-red/5 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-rc-red transition hover:bg-rc-red/10 cursor-pointer'>
            <Icon icon='mdi:plus' className='h-4 w-4' />
            Tambah pembicara
          </button>
        </div>
        {!data.speakers || data.speakers.length === 0 ? (
          <p className='mt-2 text-sm text-gray-500'>Belum ada pembicara.</p>
        ) : (
          <ul className='mt-2 space-y-2'>
            {data.speakers.map((s) => {
              const photoSrc = speakerPhotoSrc(s.photo ?? undefined);
              return (
                <li
                  key={s.id ?? s.name}
                  className='rounded-lg border border-gray-100 bg-white px-3 py-2'>
                  <div className='flex gap-3 flex-col sm:flex-row items-center sm:items-start'>
                    {photoSrc && (
                      <div className='w-[70px] sm:w-auto shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoSrc}
                          alt=''
                          className='h-18 w-18 object-cover sm:h-24 sm:w-24'
                        />
                      </div>
                    )}
                    <div className='min-w-0 flex-1 text-center sm:text-left'>
                      <p className='font-bold text-xs sm:text-base text-gray-900 mb-2'>
                        {s.name}
                      </p>
                      {s.title && (
                        <p className='mt-0.5 text-[11px] sm:text-xs text-gray-500'>
                          {s.title}
                        </p>
                      )}
                      {s.bio && (
                        <p className='mt-3 text-[11px] sm:text-xs italic text-gray-600'>
                          {s.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='mt-3 flex justify-between gap-3 border-t border-gray-100 pt-3'>
                    <button
                      type='button'
                      onClick={() => setSpeakerModal({ edit: s })}
                      className='inline-flex min-h-[40px] min-w-4 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-rc-red/40 hover:bg-white hover:text-rc-red sm:min-w-6 cursor-pointer'>
                      <Icon
                        icon='mdi:pencil-outline'
                        className='h-4 w-4 shrink-0'
                      />
                      Ubah
                    </button>
                    <button
                      type='button'
                      onClick={() => void handleDeleteSpeaker(s)}
                      className='inline-flex min-h-[40px] min-w-4 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 sm:min-w-6 cursor-pointer'>
                      <Icon
                        icon='mdi:delete-outline'
                        className='h-4 w-4 shrink-0'
                      />
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <SpeakerFormModal
        key={
          speakerModal === 'closed'
            ? 'sp-closed'
            : speakerModal === 'add'
              ? 'sp-add'
              : `sp-${speakerModal.edit.id ?? 'edit'}`
        }
        open={speakerModal !== 'closed'}
        seminarId={seminarId}
        speaker={speakerForModal}
        onClose={() => setSpeakerModal('closed')}
        onSuccess={() => onRefresh?.()}
        onToast={onToast}
      />
      {(data.questions_count != null ||
        data.reviews_count != null ||
        data.participants_count != null) && (
        <div className='space-y-3'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400 lg:text-sm'>
            Ringkasan
          </p>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {data.questions_count != null && (
              <button
                type='button'
                onClick={() => setQuestionsModalOpen(true)}
                className='group cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-gray-200 hover:shadow-md'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 transition group-hover:bg-violet-100'>
                    <Icon
                      icon='mdi:comment-question-outline'
                      className='h-6 w-6 text-violet-600'
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-2xl font-extrabold leading-tight text-gray-900 tabular-nums'>
                      {Number(data.questions_count).toLocaleString('id-ID')}
                    </p>
                    <p className='mt-1 flex items-center gap-1 text-sm font-medium text-gray-500'>
                      Pertanyaan
                      <Icon
                        icon='mdi:chevron-right'
                        className='h-4 w-4 text-gray-400 opacity-0 transition group-hover:opacity-100'
                      />
                    </p>
                  </div>
                </div>
              </button>
            )}
            {data.reviews_count != null && (
              <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50'>
                    <Icon
                      icon='mdi:star-outline'
                      className='h-6 w-6 text-amber-600'
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-2xl font-extrabold leading-tight text-gray-900 tabular-nums'>
                      {Number(data.reviews_count).toLocaleString('id-ID')}
                    </p>
                    <p className='mt-1 text-sm font-medium text-gray-500'>
                      Review
                    </p>
                  </div>
                </div>
              </div>
            )}
            {data.participants_count != null && (
              <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50'>
                    <Icon
                      icon='mdi:account-group'
                      className='h-6 w-6 text-blue-600'
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-2xl font-extrabold leading-tight text-gray-900 tabular-nums'>
                      {Number(data.participants_count).toLocaleString('id-ID')}
                    </p>
                    <p className='mt-1 text-sm font-medium text-gray-500'>
                      Partisipan seminar
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <SeminarQuestionsModal
        open={questionsModalOpen}
        onClose={() => setQuestionsModalOpen(false)}
        seminarId={seminarId}
        speakers={data.speakers}
        questionSpeakerFilter={questionSpeakerFilter}
        onQuestionSpeakerFilterChange={setQuestionSpeakerFilter}
        questions={questions}
        questionsLoading={questionsLoading}
        questionsError={questionsError}
        onQuestionDeleted={(questionId) => {
          setQuestions((prev) => prev.filter((q) => q.id !== questionId));
          onRefresh?.();
        }}
        onToast={onToast}
      />
    </div>
  );
}
