'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  SeminarCreateModal,
  type SeminarRow,
} from '@/components/dashboard/seminar';
import { formatSeminarDateTimeUtc } from '@/components/dashboard/seminar/seminar-date';

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: SeminarRow[];
}

function SpeakerNamesList({ row }: { row: SeminarRow }) {
  const names = row.speakers?.map((s) => s.name?.trim()).filter(Boolean) ?? [];
  if (names.length === 0) {
    return <span className='text-gray-400'>—</span>;
  }
  return (
    <ul className='max-w-[min(100%,28rem)] list-inside list-disc space-y-0.5 text-xs leading-snug text-gray-700 marker:text-gray-400'>
      {names.map((name, idx) => (
        <li key={idx} className='wrap-break-word pl-0.5'>
          {name}
        </li>
      ))}
    </ul>
  );
}

export default function SeminarsPage() {
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
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

  const fetchSeminars = useCallback(async (p: number) => {
    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/seminars?page=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      const json = await res.json();
      if (json.success) {
        const d = json.data;
        if (Array.isArray(d)) {
          setPagination({
            current_page: 1,
            last_page: 1,
            per_page: d.length || 1,
            total: d.length,
            data: d as SeminarRow[],
          });
        } else {
          setPagination(d as PaginationData);
        }
      }
    } catch {
      // network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeminars(page);
  }, [page, fetchSeminars]);

  return (
    <div className='mx-auto max-w-3xl lg:max-w-6xl space-y-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>List Seminar</h2>
          <p className='text-sm text-gray-500'>
            {pagination
              ? `Total ${pagination.total.toLocaleString('id-ID')} seminar`
              : 'Memuat data...'}
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowCreate(true)}
          className='flex cursor-pointer items-center gap-1.5 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
          <Icon icon='mdi:plus-circle-outline' className='h-5 w-5' />
          <span className='hidden sm:inline'>Tambah Seminar</span>
          <span className='sm:hidden'>Tambah</span>
        </button>
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-smooth'>
          <table className='w-full min-w-0 table-fixed text-left text-sm md:min-w-[960px]'>
            <thead className='bg-rc-red'>
              <tr className='border-b border-white/15'>
                <th className='w-10 whitespace-nowrap px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:w-[3%] md:px-4'>
                  #
                </th>
                <th className='min-w-0 px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:px-4'>
                  Judul
                </th>
                <th className='hidden min-w-48 px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:table-cell md:w-[22%]'>
                  Pembicara
                </th>
                <th className='hidden w-[15%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Mulai
                </th>
                <th className='hidden w-[15%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Selesai
                </th>
                <th className='hidden w-[8%] px-4 py-4 text-xs font-bold text-white uppercase tracking-wider lg:table-cell'>
                  Status
                </th>
                <th className='hidden w-36 md:w-52 whitespace-nowrap px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider md:px-4 md:table-cell'>
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
                      <p className='line-clamp-2 text-sm font-semibold leading-snug text-gray-800 md:line-clamp-none'>
                        {row.title}
                      </p>
                      {row.speakers && row.speakers.length > 0 && (
                        <p className='mt-1 line-clamp-2 text-[11px] text-gray-500 md:hidden'>
                          {row.speakers
                            .map((s) => s.name?.trim())
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                      <div className='mt-3 md:hidden'>
                        <Link
                          href={`/dashboard/seminar/${row.id}`}
                          className='inline-flex cursor-pointer items-center gap-0.5 rounded-lg border border-rc-red/30 bg-rc-red/5 px-2 py-1.5 text-[10px] font-bold text-rc-red transition hover:bg-rc-red/10 md:gap-1 md:px-2.5 md:text-xs'>
                          <Icon
                            icon='mdi:eye-outline'
                            className='h-3.5 w-3.5'
                          />
                          Lihat Detail Seminar
                        </Link>
                      </div>
                    </td>
                    <td className='hidden align-top px-4 py-3 md:table-cell'>
                      <SpeakerNamesList row={row} />
                    </td>
                    <td className='hidden px-4 py-3 align-middle text-sm text-gray-600 md:table-cell'>
                      {formatSeminarDateTimeUtc(row.starts_at)}
                    </td>
                    <td className='hidden px-4 py-3 align-middle text-sm text-gray-600 md:table-cell'>
                      {formatSeminarDateTimeUtc(row.ends_at)}
                    </td>
                    <td className='hidden px-4 py-3 align-middle lg:table-cell'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          row.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className='hidden whitespace-nowrap px-3 py-3 align-middle text-center md:px-4 md:table-cell'>
                      <div className='flex flex-wrap items-center justify-center gap-1'>
                        <Link
                          href={`/dashboard/seminar/${row.id}`}
                          className='inline-flex cursor-pointer items-center gap-0.5 rounded-lg border border-rc-red/30 bg-rc-red/5 px-2 py-1.5 text-[10px] font-bold text-rc-red transition hover:bg-rc-red/10 md:gap-1 md:px-2.5 md:text-xs'>
                          <Icon
                            icon='mdi:eye-outline'
                            className='h-3.5 w-3.5'
                          />
                          Lihat Detail Seminar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada data seminar.
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

      <SeminarCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => fetchSeminars(page)}
        onToast={showToast}
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
