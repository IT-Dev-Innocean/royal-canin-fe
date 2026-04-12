'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAuth, getToken } from '@/lib/auth';

interface Participant {
  id: number;
  name: string;
  email: string;
  role: string;
  detail?: {
    phone?: string;
    clinic_name?: string;
    rc_club?: boolean;
    pet?: string;
    scrub_size?: string;
  };
  qr_code?: {
    code: string;
  } | null;
  check_in?: unknown;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: Participant[];
}

export default function ParticipantsPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

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
    [router]
  );

  useEffect(() => {
    fetchParticipants(page);
  }, [page, fetchParticipants]);

  return (
    <div className='mx-auto max-w-2xl lg:max-w-6xl space-y-5'>
      <div>
        <h2 className='text-xl font-bold text-gray-900'>Daftar Partisipan</h2>
        <p className='text-sm text-gray-500'>
          {pagination
            ? `Total ${pagination.total.toLocaleString('id-ID')} partisipan terdaftar`
            : 'Memuat data...'}
        </p>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  #
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  Nama
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell'>
                  Email
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell'>
                  Telepon
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell'>
                  Klinik
                </th>
                <th className='whitespace-nowrap px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr>
                  <td colSpan={6} className='py-12 text-center'>
                    <Icon
                      icon='svg-spinners:ring-resize'
                      className='mx-auto h-7 w-7 text-gray-300'
                    />
                  </td>
                </tr>
              ) : pagination && pagination.data.length > 0 ? (
                pagination.data.map((p, i) => (
                  <tr key={p.id} className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-4 py-3 text-xs text-gray-400 tabular-nums'>
                      {(pagination.current_page - 1) * pagination.per_page +
                        i +
                        1}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <p className='font-semibold text-gray-800'>{p.name}</p>
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-gray-500 hidden sm:table-cell'>
                      {p.email}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-gray-500 hidden md:table-cell'>
                      {p.detail?.phone ?? '-'}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-gray-500 hidden lg:table-cell max-w-[180px] truncate'>
                      {p.detail?.clinic_name ?? '-'}
                    </td>
                    <td className='whitespace-nowrap px-4 py-3'>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className='py-12 text-center text-sm text-gray-400'>
                    Belum ada data partisipan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
    </div>
  );
}
