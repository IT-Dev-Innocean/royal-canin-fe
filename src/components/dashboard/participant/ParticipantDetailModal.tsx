'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAuth, getToken } from '@/lib/auth';
import type { ParticipantDetail } from './types';

const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

const PET_LABELS: Record<string, string> = {
  cat: 'Kucing',
  dog: 'Anjing',
  both: 'Kucing & Anjing',
};

interface CheckInInfo {
  checked_in_at?: string;
}

function formatCheckInAt(c: unknown): string {
  if (c && typeof c === 'object' && 'checked_in_at' in c) {
    const at = (c as CheckInInfo).checked_in_at;
    if (typeof at === 'string') {
      return new Date(at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return '-';
}

export interface ParticipantDetailModalProps {
  participantId: number | null;
  onClose: () => void;
}

export function ParticipantDetailModal({
  participantId,
  onClose,
}: ParticipantDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ParticipantDetail | null>(null);

  const fetchDetail = useCallback(
    async (id: number) => {
      const token = getToken();
      if (!token) return;

      setDetail(null);
      setError(null);
      setLoading(true);

      try {
        const res = await fetch(`/api/participants/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (res.status === 401) {
          clearAuth();
          router.replace('/dashboard/login');
          return;
        }

        if (!res.ok || !json.success) {
          setError(json.message ?? 'Gagal memuat detail partisipan.');
          return;
        }

        setDetail(json.data as ParticipantDetail);
      } catch {
        setError('Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (participantId == null) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchDetail(participantId);
  }, [participantId, fetchDetail]);

  if (participantId == null) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>Detail Peserta</h3>
          <button
            type='button'
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 cursor-pointer'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <div className='overflow-y-auto px-5 py-4'>
          {loading && (
            <div className='flex flex-col items-center gap-3 py-12'>
              <Icon
                icon='svg-spinners:ring-resize'
                className='h-8 w-8 text-rc-red'
              />
              <p className='text-sm text-gray-500'>Memuat detail...</p>
            </div>
          )}

          {!loading && error && (
            <div className='flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3'>
              <Icon
                icon='mdi:alert-circle-outline'
                className='mt-0.5 h-5 w-5 shrink-0 text-red-600'
              />
              <p className='text-sm text-red-800'>{error}</p>
            </div>
          )}

          {!loading && detail && !error && (
            <div className='space-y-4'>
              <div className='rounded-xl bg-slate-50 p-4'>
                <p className='text-xs font-medium text-gray-400'>Nama</p>
                <p className='mt-0.5 text-sm font-semibold text-gray-800'>
                  {detail.name}
                </p>
                <p className='mt-3 text-xs font-medium text-gray-400'>Email</p>
                <p className='mt-0.5 text-sm font-semibold text-gray-800'>
                  {detail.email}
                </p>
              </div>

              <div className='space-y-3'>
                <dl className='grid grid-cols-1 gap-3 text-sm'>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>
                      Telepon
                    </dt>
                    <dd className='font-medium text-gray-800'>
                      {detail.detail?.phone ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>
                      Klinik
                    </dt>
                    <dd className='font-medium text-gray-800'>
                      {detail.detail?.clinic_name ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>NIO</dt>
                    <dd className='font-medium text-gray-800'>
                      {detail.detail?.outlet_number ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>
                      Media sosial
                    </dt>
                    <dd className='font-medium text-gray-800'>
                      {detail.detail?.social_media_account ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>
                      RC Club
                    </dt>
                    <dd className='font-medium text-gray-800'>
                      {detail.detail?.rc_club ? 'Ya' : 'Tidak'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>
                      Hewan peliharaan
                    </dt>
                    <dd className='font-medium text-gray-800'>
                      {PET_LABELS[detail.detail?.pet ?? ''] ??
                        detail.detail?.pet ??
                        '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>
                      Ukuran scrub
                    </dt>
                    <dd className='font-medium text-gray-800'>
                      {detail.detail?.scrub_size ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs font-medium text-gray-400'>Poin</dt>
                    <dd className='font-bold text-rc-red tabular-nums'>
                      {(detail.detail?.points ?? 0).toLocaleString('id-ID')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className='rounded-xl border border-gray-100 p-4 text-center'>
                <p className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                  Check-in
                </p>
                {detail.check_in ? (
                  <p className='mt-2 text-sm font-medium text-emerald-700'>
                    Sudah check-in — {formatCheckInAt(detail.check_in)}
                  </p>
                ) : (
                  <p className='mt-2 text-sm text-gray-500'>Belum check-in</p>
                )}
              </div>

              {detail.qr_code && (
                <div className='flex flex-col items-center rounded-xl border border-gray-100 p-4 text-center'>
                  <p className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                    QR Code
                  </p>
                  <p className='mt-2 font-mono text-sm font-bold text-gray-800'>
                    {detail.qr_code.code}
                  </p>
                  {detail.qr_code.image_path && (
                    <img
                      src={`${QR_STORAGE_BASE}${detail.qr_code.image_path}`}
                      alt={`QR ${detail.qr_code.code}`}
                      className='mt-3 h-32 w-32 rounded-lg border border-gray-100 object-contain'
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className='border-t border-gray-100 px-5 py-3'>
          <button
            type='button'
            onClick={onClose}
            className='w-full cursor-pointer rounded-xl bg-rc-red py-3 text-sm font-bold text-white transition hover:bg-[#b50015]'>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
