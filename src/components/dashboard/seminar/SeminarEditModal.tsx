'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken } from '@/lib/auth';
import type { SeminarDetail } from './types';
import { isoToUtcDatetimeLocalValue, toApiDateTime } from './seminar-date';

export interface SeminarEditModalProps {
  seminarId: number | null;
  onClose: () => void;
  /** Dipanggil dengan `data` dari response PUT (jika ada) agar halaman detail langsung selaras dengan server. */
  onSuccess: (updated?: SeminarDetail) => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function SeminarEditModal({
  seminarId,
  onClose,
  onSuccess,
  onToast,
}: SeminarEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loadRetry, setLoadRetry] = useState(0);

  useEffect(() => {
    if (seminarId == null) {
      setTitle('');
      setDescription('');
      setStartsAt('');
      setEndsAt('');
      setThumbnail(null);
      setFieldErrors({});
      setLoadError(null);
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const res = await fetch(`/api/admin/seminars/${seminarId}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setLoadError(json.message ?? 'Gagal memuat data seminar.');
          return;
        }
        const d = json.data as SeminarDetail;
        setTitle(d.title ?? '');
        setDescription(d.description ?? '');
        setStartsAt(isoToUtcDatetimeLocalValue(d.starts_at));
        setEndsAt(isoToUtcDatetimeLocalValue(d.ends_at));
      } catch {
        if (!cancelled) setLoadError('Tidak dapat terhubung ke server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seminarId, loadRetry]);

  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  function handleClose() {
    if (!saving) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (seminarId == null) return;
    setFieldErrors({});

    if (!startsAt || !endsAt) {
      onToast?.('error', 'Waktu mulai dan selesai wajib diisi.');
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('starts_at', toApiDateTime(startsAt));
    fd.append('ends_at', toApiDateTime(endsAt));
    if (thumbnail) fd.append('thumbnail', thumbnail);

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/seminars/${seminarId}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.('error', json.message ?? 'Gagal memperbarui seminar.');
        return;
      }

      onSuccess(json.data as SeminarDetail | undefined);
      onClose();
      onToast?.('success', json.message ?? 'Seminar berhasil diperbarui.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (seminarId == null) return null;

  return (
    <div className='fixed inset-0 z-60 flex items-end justify-center sm:items-center'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/40 backdrop-blur-[1px]'
        onClick={handleClose}
      />
      <div className='relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>Ubah Seminar</h3>
          <button
            type='button'
            disabled={saving}
            onClick={handleClose}
            className='rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center py-16'>
            <Icon
              icon='svg-spinners:ring-resize'
              className='h-8 w-8 text-rc-red'
            />
          </div>
        ) : loadError ? (
          <div className='space-y-4 px-5 py-8'>
            <p className='text-center text-sm text-red-600'>{loadError}</p>
            <button
              type='button'
              onClick={() => setLoadRetry((n) => n + 1)}
              className='w-full rounded-xl bg-rc-red py-2.5 text-sm font-bold text-white cursor-pointer'>
              Coba lagi
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-5'>
              <div>
                <label className='text-xs font-bold text-gray-600'>
                  Ganti thumbnail (opsional)
                </label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
                  className='mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rc-red/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-rc-red'
                />
                {fieldError('thumbnail') && (
                  <p className='mt-1 text-xs text-red-600'>
                    {fieldError('thumbnail')}
                  </p>
                )}
              </div>
              <div>
                <label className='text-xs font-bold text-gray-600'>
                  Judul <span className='text-rc-red'>*</span>
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                />
                {fieldError('title') && (
                  <p className='mt-1 text-xs text-red-600'>
                    {fieldError('title')}
                  </p>
                )}
              </div>
              <div>
                <label className='text-xs font-bold text-gray-600'>
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder='Deskripsi seminar (opsional)'
                  className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                />
                {fieldError('description') && (
                  <p className='mt-1 text-xs text-red-600'>
                    {fieldError('description')}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div>
                  <label className='text-xs font-bold text-gray-600'>
                    Mulai <span className='text-rc-red'>*</span>
                  </label>
                  <input
                    required
                    type='datetime-local'
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                  />
                  {fieldError('starts_at') && (
                    <p className='mt-1 text-xs text-red-600'>
                      {fieldError('starts_at')}
                    </p>
                  )}
                </div>
                <div>
                  <label className='text-xs font-bold text-gray-600'>
                    Selesai <span className='text-rc-red'>*</span>
                  </label>
                  <input
                    required
                    type='datetime-local'
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                  />
                  {fieldError('ends_at') && (
                    <p className='mt-1 text-xs text-red-600'>
                      {fieldError('ends_at')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className='flex gap-2 border-t border-gray-100 px-5 py-4'>
              <button
                type='button'
                disabled={saving}
                onClick={handleClose}
                className='flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50'>
                Batal
              </button>
              <button
                type='submit'
                disabled={saving}
                className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-rc-red py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b50015] disabled:opacity-60 cursor-pointer'>
                {saving ? (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-5 w-5 text-white'
                  />
                ) : (
                  <>
                    <Icon icon='mdi:check' className='h-5 w-5' />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
