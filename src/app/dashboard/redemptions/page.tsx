'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import { RedeemGift } from '@/components/dashboard/RedeemGift';

interface PrizeRedeemer {
  id?: number;
  name?: string;
  email?: string;
}

interface PrizeRedemptionUser {
  id?: number;
  name?: string;
  email?: string;
  rcc_member?: { member_id?: string; points?: number } | null;
  detail?: {
    phone?: string;
    clinic_name?: string;
    rc_club?: boolean;
    pet?: string;
  };
}

interface PrizeRedemptionRow {
  id: number;
  user_id: number;
  redeemed_by: number;
  created_at: string;
  user?: PrizeRedemptionUser;
  redeemer?: PrizeRedeemer;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: PrizeRedemptionRow[];
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PrizeRedemptionsPage() {
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showRedeem, setShowRedeem] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ type, message });
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    },
    []
  );

  const fetchList = useCallback(
    async (p: number) => {
      const token = getAdminToken();
      if (!token) {
        logoutAdminHard();
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          per_page: '15',
        });

        const res = await fetch(`/api/admin/prize-redemptions?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (res.status === 401) {
          logoutAdminHard();
          return;
        }

        if (json.success && json.data) {
          setPagination(json.data as PaginationData);
        } else {
          setPagination(null);
          showToast('error', json.message ?? 'Gagal memuat data.');
        }
      } catch {
        showToast('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteRedemption = useCallback(
    async (rowId: number) => {
      if (
        !window.confirm(
          'Yakin hapus pencatatan penukaran ini? Peserta dapat dicatat kembali di booth registrasi.'
        )
      ) {
        return;
      }

      const token = getAdminToken();
      if (!token) {
        logoutAdminHard();
        return;
      }

      setDeletingId(rowId);
      try {
        const res = await fetch(`/api/admin/prize-redemptions/${rowId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (res.status === 401) {
          logoutAdminHard();
          return;
        }

        if (!res.ok || !json.success) {
          showToast(
            'error',
            json.message ?? 'Gagal menghapus pencatatan penukaran.'
          );
          return;
        }

        showToast(
          'success',
          json.message ?? 'Pencatatan penukaran hadiah dihapus.'
        );

        const onlyRowOnPage = pagination?.data.length === 1;
        if (onlyRowOnPage && page > 1) {
          setPage((p) => Math.max(1, p - 1));
        } else {
          void fetchList(page);
        }
      } catch {
        showToast('error', 'Tidak dapat terhubung ke server.');
      } finally {
        setDeletingId(null);
      }
    },
    [fetchList, page, pagination?.data.length, showToast]
  );

  useEffect(() => {
    fetchList(page);
  }, [page, fetchList]);

  return (
    <div className='mx-auto max-w-3xl lg:max-w-6xl space-y-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Penukaran Hadiah</h2>
          <p className='text-sm text-gray-600'>
            Daftar peserta yang sudah dicatat mengambil hadiah di booth
            registrasi.
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowRedeem(true)}
          className='flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
          <Icon icon='mdi:qrcode-plus' className='h-5 w-5' />
          <span className='inline-block'>Catat Penukaran</span>
        </button>
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-smooth'>
          <table className='w-full min-w-0 table-fixed text-left text-sm md:min-w-[1180px]'>
            <thead className='bg-rc-red'>
              <tr className='border-b border-white/15'>
                <th className='w-2 whitespace-nowrap px-3 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:px-4 md:w-[3%]'>
                  #
                </th>
                <th className='min-w-0 px-3 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:w-[20%] md:px-4'>
                  Nama Peserta
                </th>
                <th className='hidden whitespace-nowrap px-4 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:table-cell md:w-[12%]'>
                  Telepon
                </th>
                {/* <th className='hidden px-4 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:table-cell md:w-[10%]'>
                  Email
                </th> */}
                <th className='hidden px-4 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:table-cell md:w-[14%]'>
                  Klinik
                </th>
                <th className='hidden px-4 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:table-cell md:w-[12%]'>
                  Dicatat oleh
                </th>
                <th className='min-w-0 px-3 py-3 text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:px-4 md:w-[16%]'>
                  Waktu
                </th>
                <th className='hidden whitespace-nowrap px-3 py-3 text-center text-xs sm:text-sm font-bold text-white uppercase tracking-wider md:table-cell md:w-[13%] md:px-4'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50 bg-white'>
              {loading ? (
                <tr>
                  <td colSpan={8} className='py-12 text-center'>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='mx-auto h-7 w-7 text-gray-300'
                    />
                  </td>
                </tr>
              ) : pagination && pagination.data.length > 0 ? (
                pagination.data.map((row, i) => (
                  <tr key={row.id} className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-3 py-3 align-middle text-xs sm:text-sm text-gray-400 tabular-nums md:px-4'>
                      {(pagination.current_page - 1) * pagination.per_page +
                        i +
                        1}
                    </td>
                    <td className='min-w-0 px-3 py-3 align-middle md:px-4'>
                      <p className='line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-gray-800 md:line-clamp-none'>
                        {row.user?.name ?? '-'}
                      </p>
                      <p className='text-[11px] sm:text-xs text-gray-400 md:hidden'>
                        {row.user?.detail?.clinic_name ?? '-'}
                      </p>
                    </td>
                    {/* <td className='hidden px-4 py-3 align-middle text-xs sm:text-sm text-gray-500 md:table-cell'>
                      <span className='wrap-break-word'>
                        {row.user?.email ?? '-'}
                      </span>
                    </td> */}
                    <td className='hidden whitespace-nowrap px-4 py-3 align-middle text-xs sm:text-sm text-gray-500 md:table-cell'>
                      {row.user?.detail?.phone ?? '-'}
                    </td>
                    <td className='hidden px-4 py-3 align-middle text-xs sm:text-sm text-gray-500 md:table-cell'>
                      <span className='wrap-break-word'>
                        {row.user?.detail?.clinic_name ?? '-'}
                      </span>
                    </td>
                    <td className='hidden px-4 py-3 align-middle text-xs sm:text-sm text-gray-600 md:table-cell'>
                      <span className='wrap-break-word'>
                        {row.redeemer?.name ?? `#${row.redeemed_by}`}
                      </span>
                    </td>
                    <td className='px-3 py-3 align-middle text-xs sm:text-sm text-gray-700 md:px-4'>
                      <span className='inline-flex items-start gap-1.5 md:inline-flex'>
                        <Icon
                          icon='mdi:check-circle'
                          className='mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700 md:inline'
                        />
                        <span className='font-medium text-emerald-700'>
                          {formatDateTime(row.created_at)}
                        </span>
                      </span>
                    </td>
                    <td className='hidden whitespace-nowrap px-2 py-3 text-center align-middle md:table-cell md:px-3'>
                      <button
                        type='button'
                        disabled={deletingId !== null}
                        onClick={() => void handleDeleteRedemption(row.id)}
                        title='Hapus pencatatan penukaran'
                        className='inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 md:text-xs md:px-3'>
                        {deletingId === row.id ? (
                          <Icon
                            icon='svg-spinners:ring-resize'
                            className='h-4 w-4'
                          />
                        ) : (
                          <Icon icon='mdi:delete-outline' className='h-4 w-4' />
                        )}
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada pencatatan penukaran hadiah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className='flex items-center justify-between border-t border-gray-100 px-4 py-3'>
            <p className='text-xs text-gray-500'>
              Halaman {pagination.current_page} dari {pagination.last_page} —{' '}
              {pagination.total.toLocaleString('id-ID')} data
            </p>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40'>
                Sebelumnya
              </button>
              <button
                type='button'
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40'>
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <RedeemGift
        open={showRedeem}
        onClose={() => setShowRedeem(false)}
        onToast={showToast}
        onRecorded={() => {
          void fetchList(page);
        }}
      />

      {toast && (
        <div className='fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]'>
          <div
            className={`flex min-w-[280px] max-w-sm items-start gap-3 rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
                : 'border-red-200 bg-red-50/95 text-red-800'
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
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-bold leading-snug'>
                {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
              </p>
              <p className='mt-0.5 text-sm leading-snug opacity-80'>
                {toast.message}
              </p>
            </div>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='shrink-0 cursor-pointer rounded-full p-1 transition hover:bg-black/5'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
