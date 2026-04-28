'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  activityToForm,
  emptyActivityForm,
  formToJsonPayload,
  nameToActivityCode,
  EventActivityFormCard,
  type ActivityFormState,
} from './EventActivityFormCard';
import { extractActivityDetail, type EventActivityRow } from './types';

/** Hindari `res.json()` saat body kosong / non-JSON (sering pada error proxy). */
function parseJsonBody(
  res: Response,
  text: string
):
  | { ok: true; value: unknown }
  | { ok: false; message: string } {
  const t = text.trim();
  if (!t) {
    return {
      ok: false,
      message: res.ok
        ? 'Respons server kosong.'
        : `Gagal memuat data (HTTP ${res.status}).`,
    };
  }
  try {
    return { ok: true, value: JSON.parse(t) as unknown };
  } catch {
    return {
      ok: false,
      message: `Gagal memproses respons server (HTTP ${res.status}).`,
    };
  }
}

export interface ActivityEditModalProps {
  activityId: number | null;
  onClose: () => void;
  onSuccess: (updated?: EventActivityRow) => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function ActivityEditModal({
  activityId,
  onClose,
  onSuccess,
  onToast,
}: ActivityEditModalProps) {
  const [form, setForm] = useState<ActivityFormState>(emptyActivityForm);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [loadRetry, setLoadRetry] = useState(0);

  useEffect(() => {
    if (activityId == null) {
      setForm(emptyActivityForm());
      setLoadError(null);
      setFieldErrors({});
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const res = await fetch(`/api/admin/event-activities/${activityId}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          if (!cancelled) logoutAdminHard();
          return;
        }
        const text = await res.text();
        if (cancelled) return;
        const parsed = parseJsonBody(res, text);
        if (!parsed.ok) {
          setLoadError(parsed.message);
          return;
        }
        const json = parsed.value as {
          success?: boolean;
          message?: string;
        };
        if (!res.ok || json.success === false) {
          setLoadError(
            json.message ?? 'Gagal memuat data aktivitas.'
          );
          return;
        }
        const row = extractActivityDetail(json);
        if (!row) {
          setLoadError('Data tidak ditemukan.');
          return;
        }
        setForm(activityToForm(row));
      } catch {
        if (!cancelled)
          setLoadError(
            'Tidak dapat terhubung. Periksa jaringan atau coba lagi.'
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activityId, loadRetry]);

  function handleClose() {
    if (!saving) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activityId == null) return;
    if (!form.name.trim()) {
      onToast?.('error', 'Nama wajib diisi.');
      return;
    }
    if (!nameToActivityCode(form.name)) {
      onToast?.(
        'error',
        'Nama perlu berisi huruf atau angka agar kode aktivitas terbentuk.'
      );
      return;
    }
    const qN = Math.round(Number(form.questions_per_session) || 0);
    const dN = Math.round(Number(form.default_reward_points) || 0);
    if (qN < 1 || qN > 100) {
      onToast?.('error', 'Soal per sesi harus antara 1 dan 100.');
      return;
    }
    if (dN < 1 || dN > 1000) {
      onToast?.('error', 'Reward poin (default) harus antara 1 dan 1000.');
      return;
    }

    const token = getAdminToken();
    if (!token) return;

    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/event-activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formToJsonPayload(form)),
      });
      const text = await res.text();
      const bodyParsed = parseJsonBody(res, text);
      if (!bodyParsed.ok) {
        onToast?.('error', bodyParsed.message);
        return;
      }
      const json = bodyParsed.value as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string[]>;
        data?: unknown;
      };

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }
      if (!res.ok || json.success === false) {
        if (json.errors) setFieldErrors(json.errors);
        onToast?.(
          'error',
          json.message ?? 'Gagal memperbarui aktivitas.'
        );
        return;
      }

      const updated = extractActivityDetail(
        json as { success?: boolean; data?: unknown }
      );
      onSuccess(updated ?? undefined);
      onClose();
      onToast?.('success', json.message ?? 'Aktivitas berhasil diperbarui.');
    } catch {
      onToast?.(
        'error',
        'Tidak dapat terhubung. Periksa jaringan atau coba lagi.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (activityId == null) return null;

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
          <h3 className='text-lg font-bold text-gray-900'>Ubah Aktivitas</h3>
          <button
            type='button'
            disabled={saving}
            onClick={handleClose}
            className='cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50'>
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
              className='w-full cursor-pointer rounded-xl bg-rc-red py-2.5 text-sm font-bold text-white'>
              Coba lagi
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4'>
              <EventActivityFormCard
                form={form}
                onChange={setForm}
                fieldErrors={fieldErrors}
                disabled={saving}
                idPrefix={`edit-modal-${activityId}`}
                variant='plain'
              />
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
