'use client';

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import type { ParticipantDetail } from './types';
import { ParticipantIdCardModal } from './ParticipantIdCardModal';
import {
  ParticipantForm,
  PARTICIPANT_FORM_INITIAL,
  participantDetailToFormState,
  buildParticipantPayload,
  type ParticipantFormState,
} from './ParticipantForm';
import {
  formatCheckInAt,
  formatIsoSubmittedAt,
} from '@/lib/participantCheckIn';

const QR_STORAGE_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/`;

const PET_LABELS: Record<string, string> = {
  cat: 'Kucing',
  dog: 'Anjing',
  both: 'Kucing & Anjing',
};

export interface ParticipantDetailModalProps {
  participantId: number | null;
  onClose: () => void;
  /** Panggil setelah update/delete berhasil (refresh daftar di halaman) */
  onMutate?: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function ParticipantDetailModal({
  participantId,
  onClose,
  onMutate,
  onToast,
}: ParticipantDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ParticipantDetail | null>(null);
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editForm, setEditForm] = useState<ParticipantFormState>(
    PARTICIPANT_FORM_INITIAL
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const fetchDetail = useCallback(async (id: number) => {
    const token = getAdminToken();
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
        logoutAdminHard();
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
  }, []);

  useEffect(() => {
    if (participantId == null) {
      setDetail(null);
      setError(null);
      setLoading(false);
      setIdCardOpen(false);
      setMode('view');
      setEditForm(PARTICIPANT_FORM_INITIAL);
      setFieldErrors({});
      return;
    }
    setMode('view');
    fetchDetail(participantId);
  }, [participantId, fetchDetail]);

  useEffect(() => {
    if (mode === 'edit' && detail) {
      setEditForm(participantDetailToFormState(detail));
      setFieldErrors({});
    }
  }, [mode, detail]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participantId == null || !detail) return;

    setFieldErrors({});
    const token = getAdminToken();
    if (!token) return;

    const payload = buildParticipantPayload(editForm);
    setSaving(true);

    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      if (!res.ok || !json.success) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.('error', json.message ?? 'Gagal memperbarui data peserta.');
        return;
      }

      setDetail(json.data as ParticipantDetail);
      setMode('view');
      onMutate?.();
      onToast?.('success', json.message ?? 'Data peserta berhasil diperbarui.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (participantId == null) return;
    if (
      !window.confirm(
        'Yakin hapus peserta ini? Tindakan tidak dapat dibatalkan.'
      )
    ) {
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const json = await res.json();

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      if (!res.ok || !json.success) {
        onToast?.('error', json.message ?? 'Gagal menghapus peserta.');
        return;
      }

      onToast?.('success', json.message ?? 'Peserta berhasil dihapus.');
      onMutate?.();
      onClose();
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setDeleting(false);
    }
  };

  if (participantId == null) {
    return null;
  }

  const busy = saving || deleting;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={() => !busy && onClose()}
      />
      <div className='relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>
            {mode === 'edit' ? 'Ubah Peserta' : 'Detail Peserta'}
          </h3>
          <button
            type='button'
            disabled={busy}
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50 cursor-pointer'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        {mode === 'edit' && detail && !error ? (
          <ParticipantForm
            form={editForm}
            setForm={setEditForm}
            fieldErrors={fieldErrors}
            saving={saving}
            primaryLabel='Simpan Perubahan'
            primaryIcon='mdi:content-save-outline'
            onSubmit={handleSaveEdit}
            onCancel={() => !saving && setMode('view')}
          />
        ) : (
          <>
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
                    <p className='mt-3 text-xs font-medium text-gray-400'>
                      Email
                    </p>
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
                        <dt className='text-xs font-medium text-gray-400'>
                          BDM (Sales)
                        </dt>
                        <dd className='font-medium text-gray-800'>
                          {detail.detail?.sales_responsible ?? '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-xs font-medium text-gray-400'>
                          NIO
                        </dt>
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
                      {detail.detail?.rc_club ? (
                        <>
                          <div>
                            <dt className='text-xs font-medium text-gray-400'>
                              Kode Dokter Panduan Nutrisi
                            </dt>
                            <dd className='font-medium text-gray-800'>
                              {detail.rcc_member?.member_id ?? '-'}
                            </dd>
                          </div>
                          <div>
                            <dt className='text-xs font-medium text-gray-400'>
                              Poin RC Club
                            </dt>
                            <dd className='font-bold text-rc-red tabular-nums'>
                              {detail.rcc_member == null ||
                              detail.rcc_member.points == null
                                ? '-'
                                : detail.rcc_member.points.toLocaleString(
                                    'id-ID'
                                  )}
                            </dd>
                          </div>
                        </>
                      ) : null}
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
                        <dt className='text-xs font-medium text-gray-400'>
                          Poin
                        </dt>
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
                      <p className='mt-2 text-sm text-gray-500'>
                        Belum check-in
                      </p>
                    )}
                  </div>

                  <div className='rounded-xl border border-gray-100 p-4 text-center'>
                    <p className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                      Form Beri Tanggapan
                    </p>
                    {detail.raw_response_submitted_at ? (
                      <p className='mt-2 text-sm font-medium text-emerald-700'>
                        Sudah Berhasil Isi Form —{' '}
                        {formatIsoSubmittedAt(detail.raw_response_submitted_at)}
                      </p>
                    ) : (
                      <p className='mt-2 text-sm text-gray-500'>
                        Belum Isi Form Tanggapan
                      </p>
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
                          className='mt-3 h-32 w-32 rounded-lg border border-rc-red object-contain'
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='border-t border-gray-100 px-5 py-3'>
              {!loading && detail && !error && (
                <div className='flex flex-col gap-2'>
                  <button
                    type='button'
                    onClick={() => setIdCardOpen(true)}
                    className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-rc-red bg-white py-3 text-sm font-bold text-rc-red transition hover:bg-red-50'>
                    <Icon
                      icon='mdi:card-account-details-outline'
                      className='h-5 w-5'
                    />
                    Generate ID Card
                  </button>
                  <div className='flex flex-col gap-2 sm:flex-row sm:gap-3'>
                    <button
                      type='button'
                      disabled={busy}
                      onClick={() => setMode('edit')}
                      className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50'>
                      <Icon icon='mdi:pencil-outline' className='h-5 w-5' />
                      Ubah Data
                    </button>
                    <button
                      type='button'
                      disabled={busy}
                      onClick={handleDelete}
                      className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50'>
                      {deleting ? (
                        <Icon
                          icon='svg-spinners:ring-resize'
                          className='h-5 w-5'
                        />
                      ) : (
                        <Icon icon='mdi:delete-outline' className='h-5 w-5' />
                      )}
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ParticipantIdCardModal
        open={idCardOpen}
        onClose={() => setIdCardOpen(false)}
        detail={detail}
      />
    </div>
  );
}
