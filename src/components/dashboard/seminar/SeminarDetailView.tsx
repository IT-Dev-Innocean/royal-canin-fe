'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken } from '@/lib/auth';
import type { SeminarDetail, SeminarSpeaker } from './types';
import { formatSeminarDateTimeUtc } from './seminar-date';
import { SpeakerFormModal } from './SpeakerFormModal';

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

function speakerPhotoSrc(photo: string | null | undefined): string | null {
  if (!photo) return null;
  return String(photo).startsWith('http') ? photo : `${STORAGE_BASE}${photo}`;
}

type SpeakerModalState = 'closed' | 'add' | { edit: SeminarSpeaker };

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

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap gap-2'>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold ${
            data.is_active
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
          {data.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
        {data.qr_code && (
          <span className='inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[11px] sm:text-xs text-gray-700'>
            QR {data.qr_code}
          </span>
        )}
      </div>
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
        <div className='rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600'>
          <p className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Ringkasan
          </p>
          <ul className='mt-2 space-y-1 text-[11px] sm:text-xs'>
            {data.questions_count != null && (
              <li>Pertanyaan: {data.questions_count}</li>
            )}
            {data.reviews_count != null && (
              <li>Review: {data.reviews_count}</li>
            )}
            {data.participants_count != null && (
              <li>Partisipan: {data.participants_count}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
