'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAdminAuth, getAdminToken } from '@/lib/auth';

interface CheckInRecord {
  id: number;
  user_id: number;
  verified_by: number;
  checked_in_at: string;
  user?: {
    id: number;
    name: string;
    detail?: {
      phone?: string;
      clinic_name?: string;
    };
  };
  verifier?: {
    id: number;
    name: string;
  };
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: CheckInRecord[];
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function CheckInsPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrScannerRef = useRef<unknown>(null);

  const fetchCheckIns = useCallback(
    async (p: number) => {
      const token = getAdminToken();
      if (!token) {
        clearAdminAuth();
        router.replace('/dashboard/login');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/check-ins?page=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          clearAdminAuth();
          router.replace('/dashboard/login');
          return;
        }

        const json = await res.json();
        if (json.success) {
          setPagination(json.data);
        }
      } catch {
        // network error
        showToast('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchCheckIns(page);
  }, [page, fetchCheckIns]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleCheckIn(qrCode: string) {
    const token = getAdminToken();
    if (!token) return;

    setScanning(true);
    try {
      const res = await fetch('/api/check-in/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_code: qrCode }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const userName = json.data?.user?.name ?? 'Partisipan';
        showToast('success', `${json.message} — ${userName}`);
        closeScanner();
        fetchCheckIns(1);
        setPage(1);
      } else {
        showToast('error', json.message ?? 'Check-in gagal.');
      }
    } catch {
      showToast('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setScanning(false);
    }
  }

  async function openScanner() {
    setShowScanner(true);

    await new Promise((r) => setTimeout(r, 100));
    const { Html5Qrcode } = await import('html5-qrcode');

    if (!scannerRef.current) return;
    const scannerId = 'qr-reader';
    scannerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    html5QrScannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 320, height: 320 } },
        (decodedText) => {
          scanner
            .stop()
            .then(() => {
              scanner.clear();
            })
            .catch(() => {});
          handleCheckIn(decodedText);
        },
        () => {}
      );
    } catch {
      showToast(
        'error',
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.'
      );
      setShowScanner(false);
    }
  }

  function closeScanner() {
    const scanner = html5QrScannerRef.current as {
      stop: () => Promise<void>;
      clear: () => void;
      getState: () => number;
    } | null;

    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === 2) {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
        }
      } catch {
        // already stopped
        console.error('Scanner already stopped');
      }
      html5QrScannerRef.current = null;
    }

    setShowScanner(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className='mx-auto max-w-2xl lg:max-w-6xl space-y-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Data Check-in</h2>
          <p className='text-sm text-gray-500'>
            {pagination
              ? `Total ${pagination.total.toLocaleString('id-ID')} partisipan sudah check-in`
              : 'Memuat data...'}
          </p>
        </div>
        <button
          onClick={openScanner}
          className='flex items-center justify-center gap-2 rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.97] cursor-pointer'>
          <Icon icon='mdi:qrcode-scan' className='h-5 w-5' />
          Scan QR Code
        </button>
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-rc-red'>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider'>
                  #
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider'>
                  Nama Partisipan
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider hidden sm:table-cell'>
                  Klinik
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell'>
                  Diverifikasi Oleh
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider'>
                  Waktu Check-in
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr>
                  <td colSpan={5} className='py-12 text-center'>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='mx-auto h-7 w-7 text-gray-300'
                    />
                  </td>
                </tr>
              ) : pagination && pagination.data.length > 0 ? (
                pagination.data.map((record, i) => (
                  <tr
                    key={record.id}
                    className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-4 py-3 text-xs text-gray-400 tabular-nums'>
                      {(pagination.current_page - 1) * pagination.per_page +
                        i +
                        1}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <p className='font-semibold text-gray-800'>
                        {record.user?.name ?? `User #${record.user_id}`}
                      </p>
                      <p className='text-xs text-gray-400 md:hidden'>
                        {record.user?.detail?.clinic_name ?? '-'}
                      </p>
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-gray-500 hidden sm:table-cell max-w-[180px] truncate'>
                      {record.user?.detail?.clinic_name ?? '-'}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-gray-500 hidden md:table-cell'>
                      {record.verifier?.name ?? '-'}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700'>
                        <Icon icon='mdi:check-circle' className='h-3.5 w-3.5' />
                        {formatDate(record.checked_in_at)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada data check-in.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className='flex items-center justify-between border-t border-gray-100 px-4 py-3'>
            <p className='text-xs text-gray-500'>
              Halaman {pagination.current_page} dari {pagination.last_page}
            </p>
            <div className='flex gap-2'>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer'>
                Sebelumnya
              </button>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer'>
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner modal */}
      {showScanner && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/70 backdrop-blur-sm'
            onClick={closeScanner}
          />
          <div className='relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-bold text-gray-900'>Scan QR Code</h3>
              <button
                onClick={closeScanner}
                className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 cursor-pointer'>
                <Icon icon='mdi:close' className='h-5 w-5' />
              </button>
            </div>

            <div className='relative overflow-hidden rounded-lg bg-black'>
              <div ref={scannerRef} className='w-full' />
              {scanning && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/70'>
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-10 w-10 text-white'
                  />
                  <p className='mt-3 text-sm font-medium text-white'>
                    Memproses check-in...
                  </p>
                </div>
              )}
            </div>

            <p className='mt-4 text-center text-xs text-gray-500 leading-relaxed'>
              Arahkan kamera ke QR Code peserta. Pastikan QR code terlihat jelas
              dan berada di dalam kotak pemindai.
            </p>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className='fixed top-6 right-6 z-100 animate-slide-in-right'>
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm max-w-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <Icon
              icon={
                toast.type === 'success'
                  ? 'mdi:check-circle'
                  : 'mdi:alert-circle'
              }
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                toast.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            />
            <p className='text-sm font-medium leading-snug'>{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className='shrink-0 ml-1 mt-0.5 text-gray-400 hover:text-gray-600 cursor-pointer'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
