'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAuth, getToken } from '@/lib/auth';
import {
  ParticipantDetailModal,
  ParticipantAddModal,
} from '@/components/dashboard/participant';

interface ParticipantRow {
  id: number;
  name: string;
  email: string;
  detail?: {
    phone?: string;
    clinic_name?: string;
  };
  check_in?: unknown;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: ParticipantRow[];
}

export default function ParticipantsPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [detailParticipantId, setDetailParticipantId] = useState<number | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
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

  const fetchParticipants = useCallback(
    async (p: number) => {
      const token = getToken();
      if (!token) {
        clearAuth();
        router.replace('/dashboard/login');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/participants?page=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          clearAuth();
          router.replace('/dashboard/login');
          return;
        }

        const json = await res.json();
        if (json.success) {
          setPagination(json.data);
        }
      } catch {
        // network error
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    fetchParticipants(page);
  }, [page, fetchParticipants]);

  return (
    <div className='mx-auto max-w-2xl lg:max-w-6xl space-y-5'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Daftar Partisipan</h2>
          <p className='text-sm text-gray-500'>
            {pagination
              ? `Total ${pagination.total.toLocaleString('id-ID')} partisipan terdaftar`
              : 'Memuat data...'}
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowAddModal(true)}
          className='flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
          <Icon icon='mdi:account-plus-outline' className='h-5 w-5' />
          <span className='hidden sm:inline'>Tambah Peserta</span>
          <span className='sm:hidden'>Tambah</span>
        </button>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-smooth'>
          <table className='w-full text-left text-sm md:min-w-[800px]'>
            <thead className='bg-rc-red'>
              <tr className='border-b border-white/15'>
                <th className='w-10 whitespace-nowrap px-3 py-3 text-xs font-bold text-white uppercase tracking-wider md:px-4'>
                  #
                </th>
                <th className='min-w-0 px-3 py-3 text-xs font-bold text-white uppercase tracking-wider md:min-w-[140px] md:whitespace-nowrap md:px-4'>
                  Nama
                </th>
                <th className='hidden min-w-[180px] whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Email
                </th>
                <th className='hidden min-w-[120px] whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Telepon
                </th>
                <th className='hidden min-w-[160px] whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Klinik
                </th>
                <th className='hidden whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Status
                </th>
                <th className='whitespace-nowrap px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider md:px-4'>
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
                pagination.data.map((p, i) => (
                  <tr key={p.id} className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-3 py-3 text-xs text-gray-400 tabular-nums md:px-4'>
                      {(pagination.current_page - 1) * pagination.per_page +
                        i +
                        1}
                    </td>
                    <td className='min-w-0 px-3 py-3 md:whitespace-nowrap md:px-4'>
                      <p className='line-clamp-2 font-semibold leading-snug text-gray-800 md:line-clamp-none'>
                        {p.name}
                      </p>
                      <div className='mt-1.5 md:hidden'>
                        {p.check_in ? (
                          <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700'>
                            <Icon
                              icon='mdi:check-circle'
                              className='h-3 w-3'
                            />
                            Hadir
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500'>
                            <Icon
                              icon='mdi:clock-outline'
                              className='h-3 w-3'
                            />
                            Belum
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='hidden whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell'>
                      {p.email}
                    </td>
                    <td className='hidden whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell'>
                      {p.detail?.phone ?? '-'}
                    </td>
                    <td className='hidden max-w-[220px] whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell'>
                      <span className='block truncate'>
                        {p.detail?.clinic_name ?? '-'}
                      </span>
                    </td>
                    <td className='hidden whitespace-nowrap px-4 py-3 md:table-cell'>
                      {p.check_in ? (
                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700'>
                          <Icon icon='mdi:check-circle' className='h-3 w-3' />
                          Hadir
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500'>
                          <Icon icon='mdi:clock-outline' className='h-3 w-3' />
                          Belum
                        </span>
                      )}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 text-center md:px-4'>
                      <button
                        type='button'
                        onClick={() => setDetailParticipantId(p.id)}
                        className='inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rc-red/30 bg-rc-red/5 px-2 py-1.5 text-[10px] font-bold text-rc-red transition hover:bg-rc-red/10 md:px-3 md:text-xs'>
                        <Icon icon='mdi:eye-outline' className='h-3.5 w-3.5' />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada data partisipan.
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
                className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40'>
                Sebelumnya
              </button>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className='cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40'>
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <ParticipantDetailModal
        participantId={detailParticipantId}
        onClose={() => setDetailParticipantId(null)}
      />

      <ParticipantAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchParticipants(page)}
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
