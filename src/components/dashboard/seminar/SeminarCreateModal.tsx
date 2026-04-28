'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken } from '@/lib/auth';
import { toApiDateTime } from './seminar-date';

type SpeakerInput = {
  name: string;
  title: string;
  bio: string;
  photo: File | null;
};

const EMPTY_SPEAKER: SpeakerInput = {
  name: '',
  title: '',
  bio: '',
  photo: null,
};

export interface SeminarCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function SeminarCreateModal({
  open,
  onClose,
  onSuccess,
  onToast,
}: SeminarCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerInput[]>([
    { ...EMPTY_SPEAKER },
  ]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function resetAndClose() {
    setTitle('');
    setDescription('');
    setStartsAt('');
    setEndsAt('');
    setThumbnail(null);
    setSpeakers([{ ...EMPTY_SPEAKER }]);
    setFieldErrors({});
    onClose();
  }

  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const token = getAdminToken();
    if (!token) return;

    const validSpeakers = speakers.filter((s) => s.name.trim());
    if (validSpeakers.length === 0) {
      onToast?.('error', 'Tambahkan minimal satu pembicara (nama wajib diisi).');
      return;
    }

    if (!startsAt || !endsAt) {
      onToast?.('error', 'Waktu mulai dan selesai wajib diisi.');
      return;
    }

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('starts_at', toApiDateTime(startsAt));
    fd.append('ends_at', toApiDateTime(endsAt));
    if (thumbnail) fd.append('thumbnail', thumbnail);

    validSpeakers.forEach((s, i) => {
      fd.append(`speakers[${i}][name]`, s.name.trim());
      fd.append(`speakers[${i}][title]`, s.title.trim());
      if (s.bio.trim()) fd.append(`speakers[${i}][bio]`, s.bio.trim());
      if (s.photo) fd.append(`speakers[${i}][photo]`, s.photo);
    });

    setSaving(true);
    try {
      const res = await fetch('/api/admin/seminars', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.('error', json.message ?? 'Gagal menambahkan seminar.');
        return;
      }

      onSuccess();
      resetAndClose();
      onToast?.('success', json.message ?? 'Seminar berhasil ditambahkan.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center sm:items-center'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/40 backdrop-blur-[1px]'
        onClick={() => !saving && resetAndClose()}
      />
      <div className='relative z-10 flex max-h-[min(92vh,90vh)] w-full max-w-lg flex-col rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>Seminar Baru</h3>
          <button
            type='button'
            disabled={saving}
            onClick={() => !saving && resetAndClose()}
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
                Judul <span className='text-rc-red'>*</span>
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                placeholder='Judul seminar'
              />
              {fieldError('title') && (
                <p className='mt-1 text-xs text-red-600'>{fieldError('title')}</p>
              )}
            </div>
            <div>
              <label className='text-xs font-bold text-gray-600'>
                Deskripsi <span className='text-rc-red'>*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rc-red'
                placeholder='Ringkasan isi seminar'
              />
              {fieldError('description') && (
                <p className='mt-1 text-xs text-red-600'>
                  {fieldError('description')}
                </p>
              )}
            </div>
            <div>
              <label className='text-xs font-bold text-gray-600'>
                Thumbnail (opsional)
              </label>
              <input
                type='file'
                accept='image/*'
                onChange={(e) =>
                  setThumbnail(e.target.files?.[0] ?? null)
                }
                className='mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rc-red/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-rc-red'
              />
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

            <div className='border-t border-gray-100 pt-2'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-bold text-gray-800'>Pembicara</p>
                <button
                  type='button'
                  onClick={() =>
                    setSpeakers((prev) => [...prev, { ...EMPTY_SPEAKER }])
                  }
                  className='text-xs font-bold text-rc-red hover:underline cursor-pointer'>
                  + Tambah
                </button>
              </div>
              <div className='mt-3 space-y-4'>
                {speakers.map((s, idx) => (
                  <div
                    key={idx}
                    className='rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2'>
                    <div className='flex items-start justify-between gap-2'>
                      <span className='text-xs font-bold text-gray-500'>
                        Pembicara {idx + 1}
                      </span>
                      {speakers.length > 1 && (
                        <button
                          type='button'
                          onClick={() =>
                            setSpeakers((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className='text-xs text-red-600 hover:underline cursor-pointer'>
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      value={s.name}
                      onChange={(e) =>
                        setSpeakers((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, name: e.target.value } : row,
                          ),
                        )
                      }
                      placeholder='Nama (wajib jika baris dipakai)'
                      className='w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm'
                    />
                    <input
                      value={s.title}
                      onChange={(e) =>
                        setSpeakers((prev) =>
                          prev.map((row, i) =>
                            i === idx
                              ? { ...row, title: e.target.value }
                              : row,
                          ),
                        )
                      }
                      placeholder='Gelar / afiliasi'
                      className='w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm'
                    />
                    <textarea
                      value={s.bio}
                      onChange={(e) =>
                        setSpeakers((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, bio: e.target.value } : row,
                          ),
                        )
                      }
                      placeholder='Bio singkat (opsional)'
                      rows={2}
                      className='w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm'
                    />
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) =>
                        setSpeakers((prev) =>
                          prev.map((row, i) =>
                            i === idx
                              ? { ...row, photo: e.target.files?.[0] ?? null }
                              : row,
                          ),
                        )
                      }
                      className='w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-white file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-rc-red'
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='flex gap-2 border-t border-gray-100 px-5 py-4'>
            <button
              type='button'
              disabled={saving}
              onClick={() => !saving && resetAndClose()}
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
                  <Icon icon='mdi:content-save-outline' className='h-5 w-5' />
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
