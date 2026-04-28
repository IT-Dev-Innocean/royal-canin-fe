'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken } from '@/lib/auth';
import type { SeminarSpeaker } from './types';

export interface SpeakerFormModalProps {
  open: boolean;
  seminarId: number;
  /** `null` = tambah pembicara baru */
  speaker: SeminarSpeaker | null;
  onClose: () => void;
  onSuccess: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function SpeakerFormModal({
  open,
  seminarId,
  speaker,
  onClose,
  onSuccess,
  onToast,
}: SpeakerFormModalProps) {
  const isEdit = Boolean(speaker?.id);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setPhoto(null);
    if (speaker) {
      setName(speaker.name ?? '');
      setTitle(speaker.title ?? '');
      setBio(speaker.bio ?? '');
    } else {
      setName('');
      setTitle('');
      setBio('');
    }
  }, [open, speaker]);

  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  function handleClose() {
    if (!saving) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const token = getAdminToken();
    if (!token) return;

    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('title', title.trim());
    fd.append('bio', bio.trim());
    if (photo) fd.append('photo', photo);

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/seminars/${seminarId}/speakers/${speaker!.id}`
        : `/api/admin/seminars/${seminarId}/speakers`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.(
          'error',
          json.message ??
            (isEdit
              ? 'Gagal memperbarui pembicara.'
              : 'Gagal menambahkan pembicara.')
        );
        return;
      }

      onSuccess();
      onClose();
      onToast?.(
        'success',
        json.message ??
          (isEdit
            ? 'Pembicara berhasil diperbarui.'
            : 'Pembicara berhasil ditambahkan.')
      );
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-65 flex items-end justify-center sm:items-center'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/40 backdrop-blur-[1px]'
        onClick={handleClose}
      />
      <div className='relative z-10 flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>
            {isEdit ? 'Ubah Pembicara' : 'Tambah Pembicara'}
          </h3>
          <button
            type='button'
            disabled={saving}
            onClick={handleClose}
            className='rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4'>
            <div>
              <label className='text-xs font-bold text-gray-600'>
                Nama <span className='text-rc-red'>*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                placeholder='Nama lengkap pembicara'
              />
              {fieldError('name') && (
                <p className='mt-1 text-xs text-red-600'>
                  {fieldError('name')}
                </p>
              )}
            </div>
            <div>
              <label className='text-xs font-bold text-gray-600'>
                Gelar / afiliasi
              </label>
              <textarea
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                placeholder='Jabatan atau institusi'
              />
              {fieldError('title') && (
                <p className='mt-1 text-xs text-red-600'>
                  {fieldError('title')}
                </p>
              )}
            </div>
            <div>
              <label className='text-xs font-bold text-gray-600'>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder='Bio singkat (opsional)'
                className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
              />
              {fieldError('bio') && (
                <p className='mt-1 text-xs text-red-600'>{fieldError('bio')}</p>
              )}
            </div>
            <div>
              <label className='text-xs font-bold text-gray-600'>
                Foto {isEdit ? '(opsional)' : '(opsional)'}
              </label>
              <input
                type='file'
                accept='image/*'
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className='mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rc-red/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-rc-red'
              />
              {fieldError('photo') && (
                <p className='mt-1 text-xs text-red-600'>
                  {fieldError('photo')}
                </p>
              )}
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
      </div>
    </div>
  );
}
