'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';

function parseResponseJson(
  res: Response,
  text: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  const t = text.trim();
  if (!t) {
    return {
      ok: false,
      message: res.ok
        ? 'Respons server kosong.'
        : `Gagal mengirim data (HTTP ${res.status}).`,
    };
  }
  try {
    return { ok: true, value: JSON.parse(t) as unknown };
  } catch {
    return {
      ok: false,
      message: `Gagal memproses respons (HTTP ${res.status}).`,
    };
  }
}

export interface AddQuestionProps {
  /** Buka/tutup modal. */
  open: boolean;
  /** ID aktivitas. */
  activityId: number;
  onClose: () => void;
  onSuccess?: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

const empty = () => ({
  body: '',
  reward_points: '0',
  sort_order: '1',
  is_active: true,
});

type Form = ReturnType<typeof empty>;

export function AddQuestion({
  open,
  activityId,
  onClose,
  onSuccess,
  onToast,
}: AddQuestionProps) {
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setForm(empty());
      setFieldErrors({});
    }
  }, [open, activityId]);

  if (!open) return null;

  const err = (k: string) => fieldErrors[k]?.[0];

  function handleClose() {
    if (!saving) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.body.trim()) {
      onToast?.('error', 'Teks pertanyaan wajib diisi.');
      return;
    }

    const reward = form.reward_points.trim();
    const sort = form.sort_order.trim();
    if (reward === '' || Number.isNaN(Number(reward))) {
      onToast?.('error', 'Reward poin wajib berupa angka.');
      return;
    }
    if (sort === '' || Number.isNaN(Number(sort))) {
      onToast?.('error', 'Urutan wajib berupa angka.');
      return;
    }

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/event-activities/${activityId}/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            body: form.body.trim(),
            reward_points: Number(reward),
            sort_order: Math.round(Number(sort)),
            is_active: form.is_active,
          }),
        }
      );
      const text = await res.text();
      const parsed = parseResponseJson(res, text);
      if (!parsed.ok) {
        onToast?.('error', parsed.message);
        return;
      }
      const json = parsed.value as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (res.status === 401) {
        logoutAdminHard();
        return;
      }
      if (!res.ok || json.success === false) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.('error', json.message ?? 'Gagal menambah pertanyaan.');
        return;
      }
      onSuccess?.();
      onClose();
      onToast?.('success', json.message ?? 'Pertanyaan berhasil ditambahkan.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='fixed inset-0 z-120 flex items-end justify-center sm:items-center'>
      <button
        type='button'
        aria-label='Tutup'
        className='absolute inset-0 bg-black/40 backdrop-blur-[1px]'
        onClick={handleClose}
      />
      <div className='relative z-10 flex max-h-[min(92vh,700px)] w-full max-w-lg flex-col rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>Tambah Pertanyaan</h3>
          <button
            type='button'
            disabled={saving}
            onClick={handleClose}
            className='cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4'>
            <div>
              <label
                htmlFor='add-q-body'
                className='text-xs font-bold text-gray-600'>
                Pertanyaan<span className='text-red-500'>*</span>
              </label>
              <textarea
                id='add-q-body'
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                disabled={saving}
                rows={4}
                className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
                placeholder='Pertanyaan contoh: temukan jawaban di poster X'
              />
              {err('body') && (
                <p className='mt-1 text-xs text-red-600'>{err('body')}</p>
              )}
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='add-q-reward'
                  className='text-xs font-bold text-gray-600'>
                  Poin hadiah
                </label>
                <input
                  id='add-q-reward'
                  type='number'
                  min={0}
                  value={form.reward_points}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reward_points: e.target.value }))
                  }
                  disabled={saving}
                  className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm tabular-nums focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
                  placeholder='150'
                />
                {err('reward_points') && (
                  <p className='mt-1 text-xs text-red-600'>
                    {err('reward_points')}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor='add-q-sort'
                  className='text-xs font-bold text-gray-600'>
                  Urutan Pertanyaan
                </label>
                <input
                  id='add-q-sort'
                  type='number'
                  min={0}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: e.target.value }))
                  }
                  disabled={saving}
                  className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm tabular-nums focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
                  placeholder='3'
                />
                {err('sort_order') && (
                  <p className='mt-1 text-xs text-red-600'>
                    {err('sort_order')}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/80 px-4 py-3'>
              <span className='text-sm font-bold text-gray-800'>Aktif</span>
              <button
                type='button'
                role='switch'
                aria-checked={form.is_active}
                disabled={saving}
                onClick={() =>
                  setForm((f) => ({ ...f, is_active: !f.is_active }))
                }
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  form.is_active ? 'bg-rc-red' : 'bg-gray-300'
                } ${saving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    form.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className='flex gap-2 border-t border-gray-100 px-5 py-4'>
            <button
              type='button'
              disabled={saving}
              onClick={handleClose}
              className='flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50'>
              Batal
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b50015] disabled:opacity-60'>
              {saving ? (
                <Icon
                  icon='svg-spinners:ring-resize'
                  className='h-5 w-5 text-white'
                />
              ) : (
                <>
                  <Icon icon='mdi:plus' className='h-5 w-5' />
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
