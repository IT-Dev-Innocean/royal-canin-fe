'use client';

import { Icon } from '@iconify/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';

export interface RedeemGiftProps {
  open: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error', message: string) => void;
  /** Dipanggil setelah pencatatan sukses (mis. refresh daftar). */
  onRecorded?: () => void;
}

type Html5Qr = {
  start: (
    _: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onDecode: (t: string) => void,
    onError?: () => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
  getState?: () => number;
};

const SCANNER_DOM_ID = 'redeem-gift-qr-reader';

function firstValidationMessage(
  errors: unknown
): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const obj = errors as Record<string, string[] | undefined>;
  for (const arr of Object.values(obj)) {
    if (Array.isArray(arr) && typeof arr[0] === 'string') return arr[0];
  }
  return undefined;
}

export function RedeemGift({
  open,
  onClose,
  onToast,
  onRecorded,
}: RedeemGiftProps) {
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [cameraOn, setCameraOn] = useState(false);

  const scannerHostRef = useRef<HTMLDivElement>(null);
  const html5QrScannerRef = useRef<Html5Qr | null>(null);
  const redeemingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrScannerRef.current;
    html5QrScannerRef.current = null;

    if (scanner) {
      try {
        const state = scanner.getState?.();
        if (state === 2) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // noop
      }
    }

    const host = scannerHostRef.current;
    if (host) host.innerHTML = '';

    setCameraOn(false);
  }, []);

  const redeem = useCallback(
    async (payload: { qr_code: string } | { phone: string }) => {
      if (redeemingRef.current) return;
      redeemingRef.current = true;

      const token = getAdminToken();
      if (!token) {
        redeemingRef.current = false;
        logoutAdminHard();
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/admin/prize-redemptions/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = (await res.json()) as {
          success?: boolean;
          message?: string;
          errors?: unknown;
        };

        if (res.status === 401) {
          logoutAdminHard();
          return;
        }

        if (!res.ok || !json.success) {
          const errMsg =
            firstValidationMessage(json.errors) ??
            json.message ??
            'Pencatatan penukaran gagal.';
          onToast('error', errMsg);
          return;
        }

        onToast(
          'success',
          json.message ?? 'Pencatatan penukaran berhasil.'
        );
        onRecorded?.();
        await stopScanner();
        setPhone('');
      } catch {
        onToast('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setSubmitting(false);
        redeemingRef.current = false;
      }
    },
    [onToast, onRecorded, stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (!open || redeemingRef.current) return;

    await stopScanner();
    await new Promise((r) => setTimeout(r, 120));

    const { Html5Qrcode } = await import('html5-qrcode');

    const host = scannerHostRef.current;
    if (!host || !open) return;

    host.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.id = SCANNER_DOM_ID;
    host.appendChild(wrapper);

    const scanner = new Html5Qrcode(SCANNER_DOM_ID) as unknown as Html5Qr;
    html5QrScannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          if (redeemingRef.current) return;
          const code = decodedText.trim();
          if (!code) return;
          void (async () => {
            await stopScanner();
            await redeem({ qr_code: code });
          })();
        },
        () => {}
      );
      setCameraOn(true);
    } catch {
      onToast(
        'error',
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.'
      );
      await stopScanner();
    }
  }, [open, onToast, redeem, stopScanner]);

  useEffect(() => {
    if (!open) {
      void stopScanner();
      setPhone('');
      redeemingRef.current = false;
      setSubmitting(false);
    }
  }, [open, stopScanner]);

  function handleSubmitPhone(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim().replace(/\s+/g, '');
    if (!trimmed) {
      onToast('error', 'Masukkan nomor telepon peserta.');
      return;
    }
    void redeem({ phone: trimmed });
  }

  if (!open) {
    return null;
  }

  const busy = submitting;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        role='presentation'
        onClick={() => !busy && onClose()}
      />
      <div
        className='relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'
        onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <div className='flex items-center gap-2'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-rc-red/10'>
              <Icon icon='mdi:gift-outline' className='h-5 w-5 text-rc-red' />
            </div>
            <h2 className='text-lg font-bold text-gray-900'>
              Penukaran Hadiah
            </h2>
          </div>
          <button
            type='button'
            disabled={busy}
            onClick={() => {
              void stopScanner();
              onClose();
            }}
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <div className='overflow-y-auto px-5 py-4'>
          <p className='text-sm text-gray-600'>
            Catat bahwa peserta sudah mengambil hadiah di booth registrasi.
            Kirim salah satu: scan QR kartu peserta atau nomor HP terdaftar.
          </p>

          <div className='mt-4 space-y-3'>
            <p className='text-xs font-bold uppercase tracking-wider text-gray-500'>
              Scan QR kartu peserta
            </p>
            <div
              ref={scannerHostRef}
              className='min-h-[200px] w-full overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50'
            />
            {cameraOn ? (
              <button
                type='button'
                disabled={busy}
                onClick={() => void stopScanner()}
                className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50'>
                <Icon icon='mdi:camera-off' className='h-5 w-5' />
                Matikan kamera
              </button>
            ) : (
              <button
                type='button'
                disabled={busy}
                onClick={() => void startScanner()}
                className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-rc-red bg-white py-3 text-sm font-bold text-rc-red transition hover:bg-red-50 disabled:opacity-50'>
                {busy ? (
                  <>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='h-5 w-5 shrink-0'
                    />
                    Memproses…
                  </>
                ) : (
                  <>
                    <Icon icon='mdi:qrcode-scan' className='h-5 w-5 shrink-0' />
                    Aktifkan kamera untuk scan
                  </>
                )}
              </button>
            )}
          </div>

          <div className='relative my-6'>
            <div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-100' />
            <p className='relative mx-auto w-max bg-white px-3 text-center text-xs font-semibold text-gray-400'>
              atau
            </p>
          </div>

          <form onSubmit={handleSubmitPhone} className='space-y-3'>
            <p className='text-xs font-bold uppercase tracking-wider text-gray-500'>
              Nomor telepon peserta
            </p>
            <input
              type='tel'
              inputMode='tel'
              autoComplete='tel'
              placeholder='Contoh: 08123456789'
              value={phone}
              disabled={busy}
              onChange={(e) => setPhone(e.target.value)}
              className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-rc-red focus:outline-none focus:ring-2 focus:ring-rc-red/30 disabled:bg-gray-50'
            />
            <button
              type='submit'
              disabled={busy || phone.trim() === ''}
              className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-50'>
              {busy ? (
                <Icon
                  icon='svg-spinners:ring-resize'
                  className='h-5 w-5 shrink-0 text-white'
                />
              ) : (
                <Icon icon='mdi:check-bold' className='h-5 w-5 shrink-0' />
              )}
              Catat penukaran
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}