'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import type { ScannableCode } from './types';

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

export interface EditQRUsherModalProps {
  open: boolean;
  activityId: number;
  code: ScannableCode | null;
  defaultRewardPoints?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

const CODE_KIND = 'usher_reward' as const;

export function EditQRUsherModal({
  open,
  activityId,
  code,
  defaultRewardPoints,
  onClose,
  onSuccess,
  onToast,
}: EditQRUsherModalProps) {
  const [publicToken, setPublicToken] = useState('');
  const [rewardPoints, setRewardPoints] = useState('150');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open && code && code.code_kind === CODE_KIND) {
      setPublicToken((code.public_token ?? '').trim());
      if (
        code.reward_points_override != null &&
        !Number.isNaN(Number(code.reward_points_override))
      ) {
        setRewardPoints(String(code.reward_points_override));
      } else if (
        defaultRewardPoints != null &&
        !Number.isNaN(Number(defaultRewardPoints))
      ) {
        setRewardPoints(String(defaultRewardPoints));
      } else {
        setRewardPoints('150');
      }
      setFieldErrors({});
    }
  }, [open, activityId, code?.id, defaultRewardPoints]);

  if (!open || !code || code.code_kind !== CODE_KIND) return null;

  const err = (k: string) => fieldErrors[k]?.[0];

  function handleClose() {
    if (!saving) onClose();
  }

  function handleRegenerate() {
    const mid = ['NUT', 'WIN', 'VIP', 'NRCC', 'BNS'][
      Math.floor(Math.random() * 5)
    ] as string;
    const tail = ['BONUS', 'EXTRA', 'REWARD', 'PLUS', 'GIFT'][
      Math.floor(Math.random() * 5)
    ] as string;
    if (!saving) setPublicToken(`DMY-${mid}-${tail}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    const t = publicToken.trim();
    if (!t) {
      onToast?.('error', 'Public token wajib diisi.');
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(t)) {
      onToast?.(
        'error',
        'Token hanya boleh huruf, angka, titik, strip, dan garis bawah.'
      );
      return;
    }
    const rp = rewardPoints.trim();
    if (rp === '' || Number.isNaN(Number(rp)) || Number(rp) < 0) {
      onToast?.('error', 'Reward poin override wajib berupa angka ≥ 0.');
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
        `/api/admin/event-activities/${activityId}/scannable-codes/${code.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code_kind: CODE_KIND,
            reward_points_override: Math.round(Number(rp)),
            public_token: t,
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
        onToast?.('error', json.message ?? 'Gagal memperbarui QR usher reward.');
        return;
      }
      onSuccess?.();
      onClose();
      onToast?.(
        'success',
        json.message ?? 'QR token usher reward berhasil diperbarui.',
      );
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
          <h3 className='text-lg font-bold text-gray-900'>Ubah QR Usher</h3>
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
                htmlFor='edit-usher-code-kind'
                className='text-xs font-bold text-gray-600'>
                code_kind
              </label>
              <input
                id='edit-usher-code-kind'
                type='text'
                value={CODE_KIND}
                readOnly
                tabIndex={-1}
                className='mt-1 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm text-gray-700'
              />
            </div>

            <div>
              <label
                htmlFor='edit-usher-reward'
                className='text-xs font-bold text-gray-600'>
                reward_points_override<span className='text-red-500'>*</span>
              </label>
              <input
                id='edit-usher-reward'
                type='number'
                min={0}
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                disabled={saving}
                className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm tabular-nums focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
                placeholder='150'
              />
              {err('reward_points_override') && (
                <p className='mt-1 text-xs text-red-600'>
                  {err('reward_points_override')}
                </p>
              )}
            </div>

            <div>
              <div className='flex items-center justify-between gap-2'>
                <label
                  htmlFor='edit-usher-token'
                  className='text-xs font-bold text-gray-600'>
                  public_token<span className='text-red-500'>*</span>
                </label>
                <button
                  type='button'
                  onClick={handleRegenerate}
                  disabled={saving}
                  className='text-[11px] font-bold text-rc-red underline-offset-2 hover:underline disabled:opacity-50'>
                  Acak ulang
                </button>
              </div>
              <input
                id='edit-usher-token'
                type='text'
                value={publicToken}
                onChange={(e) => setPublicToken(e.target.value.toUpperCase())}
                disabled={saving}
                autoComplete='off'
                className='mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 font-mono text-sm focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/20 disabled:bg-gray-50'
                placeholder='DMY-NUT-BONUS'
              />
              {err('public_token') && (
                <p className='mt-1 text-xs text-red-600'>{err('public_token')}</p>
              )}
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
                  <Icon icon='mdi:content-save' className='h-5 w-5' />
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
