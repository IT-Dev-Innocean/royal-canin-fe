'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  extractActivitiesList,
  type EventActivitiesPagination,
} from '@/components/dashboard/activity';

function formatActivityTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminActivitiesListPage() {
  const [pagination, setPagination] =
    useState<EventActivitiesPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  const fetchList = useCallback(async (p: number) => {
    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/event-activities?page=${p}&t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      const json = await res.json();
      const list = extractActivitiesList(json);
      if (res.ok && list) {
        setPagination(list);
      } else {
        setPagination(null);
        showToast(
          'error',
          typeof json?.message === 'string'
            ? json.message
            : 'Gagal memuat daftar aktivitas.'
        );
      }
    } catch {
      setPagination(null);
      showToast('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList(page);
  }, [page, fetchList]);

  return (
    <div className='mx-auto max-w-3xl space-y-5 lg:max-w-6xl'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>
            Kelola Aktivitas Event
          </h2>
          <p className='text-sm text-gray-500'>
            {pagination
              ? `Total ${pagination.total.toLocaleString('id-ID')} aktivitas`
              : 'Memuat data...'}
          </p>
        </div>
        <Link
          href='/dashboard/activities/new'
          className='inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
          <Icon icon='mdi:plus-circle-outline' className='h-5 w-5' />
          <span className='hidden sm:inline'>Tambah Aktivitas</span>
          <span className='sm:hidden'>Tambah</span>
        </Link>
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch]'>
          <table className='w-full min-w-0 table-fixed text-left text-sm md:min-w-[720px]'>
            <thead className='bg-rc-red'>
              <tr className='border-b border-white/15'>
                <th className='w-2 sm:w-10 whitespace-nowrap px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:w-[4%]'>
                  #
                </th>
                <th className='w-[45%] sm:w-[20%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider'>
                  Judul
                </th>
                <th className='hidden w-[50%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Deskripsi
                </th>
                <th className='hidden w-[12%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Tipe
                </th>
                <th className='hidden w-[10%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider lg:table-cell'>
                  Status
                </th>
                <th className='w-20 sm:w-40 whitespace-nowrap px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider md:px-4'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50 bg-white'>
              {loading ? (
                <tr>
                  <td colSpan={7} className='py-12 text-center'>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='mx-auto h-7 w-7 text-gray-300'
                    />
                  </td>
                </tr>
              ) : pagination && pagination.data.length > 0 ? (
                pagination.data.map((row, i) => (
                  <tr key={row.id} className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-3 py-3 align-middle text-sm text-gray-400 tabular-nums md:px-4'>
                      {(pagination.current_page - 1) * pagination.per_page +
                        i +
                        1}
                    </td>
                    <td className='min-w-0 px-3 py-3 align-middle md:px-4'>
                      <p className='line-clamp-2 text-sm font-semibold text-gray-800'>
                        {row.name ?? '—'}
                      </p>
                      {row.flow_type && (
                        <p className='mt-1 line-clamp-1 text-[11px] text-gray-500 md:hidden'>
                          {row.flow_type}
                        </p>
                      )}
                    </td>
                    <td className='hidden align-middle px-4 py-3 text-xs text-gray-600 md:table-cell'>
                      {row.description ?? '—'}
                    </td>
                    <td className='hidden align-middle px-4 py-3 text-xs text-gray-600 md:table-cell'>
                      {row.flow_type ?? '—'}
                    </td>
                    {/* <td className='hidden px-4 py-3 text-center text-sm text-gray-600 tabular-nums lg:table-cell'>
                      {row.order != null ? row.order : '—'}
                    </td> */}
                    <td className='hidden align-middle px-4 py-3 lg:table-cell'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          row.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {/* <td className='hidden px-4 py-3 text-sm text-gray-600 md:table-cell'>
                      {formatActivityTime(row.updated_at ?? row.created_at)}
                    </td> */}
                    <td className='whitespace-nowrap px-2 py-3 text-center align-middle md:px-3'>
                      <Link
                        href={`/dashboard/activities/${row.id}`}
                        className='inline-flex cursor-pointer items-center gap-0.5 rounded-lg border border-rc-red/30 bg-rc-red/5 px-2 py-1.5 text-[10px] font-bold text-rc-red transition hover:bg-rc-red/10 md:px-2.5 md:text-xs'>
                        <Icon
                          icon='mdi:pencil-outline'
                          className='h-3.5 w-3.5'
                        />
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada aktivitas. Tambah aktivitas baru untuk memulai.
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
                type='button'
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'>
                Sebelumnya
              </button>
              <button
                type='button'
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'>
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className='fixed bottom-6 right-6 z-50'>
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
              <p className='text-sm font-bold'>
                {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
              </p>
              <p className='mt-0.5 text-sm opacity-80'>{toast.message}</p>
            </div>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='shrink-0 cursor-pointer rounded-full p-1 hover:bg-black/5'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
