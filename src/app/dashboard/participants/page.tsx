'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  ParticipantDetailModal,
  ParticipantAddModal,
  SearchParticipant,
} from '@/components/dashboard/participant';
import { OverviewVerification } from '@/components/dashboard/verification';
import { isParticipantAccountVerified } from '@/lib/participantVerification';

interface ParticipantRow {
  id: number;
  name: string;
  email: string;
  is_account_verified?: unknown;
  email_verified_at?: unknown;
  detail?: {
    phone?: string;
    clinic_name?: string;
    sales_responsible?: string;
    outlet_number?: number | null;
    pet?: string;
    scrub_size?: string;
    social_media_account?: string;
    points?: number;
    rc_club?: boolean;
  };
  qr_code?: {
    code?: string;
    image_path?: string;
  } | null;
  check_in?: unknown;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: ParticipantRow[];
}

function escapeCsvCell(value: string): string {
  const s = String(value).replace(/\r\n/g, '\n');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvBool(value: boolean | undefined): string {
  if (value === true) return 'Ya';
  if (value === false) return 'Tidak';
  return '';
}

function csvCheckIn(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

function buildParticipantsQuery(
  pageNum: number,
  filters: {
    name: string;
    email: string;
    phone: string;
    isAccountVerified: '' | '0' | '1';
  }
): string {
  const params = new URLSearchParams();
  params.set('page', String(pageNum));
  const n = filters.name.trim();
  const e = filters.email.trim();
  const ph = filters.phone.trim();
  if (n) params.set('name', n);
  if (e) params.set('email', e);
  if (ph) params.set('phone', ph);
  if (filters.isAccountVerified === '0' || filters.isAccountVerified === '1') {
    params.set('is_account_verified', filters.isAccountVerified);
  }
  return params.toString();
}

export default function ParticipantsPage() {
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [detailParticipantId, setDetailParticipantId] = useState<number | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [appliedSearch, setAppliedSearch] = useState({
    name: '',
    email: '',
    phone: '',
    isAccountVerified: '' as '' | '0' | '1',
  });

  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  const fetchParticipants = useCallback(
    async (p: number) => {
      const token = getAdminToken();
      if (!token) {
        logoutAdminHard();
        return;
      }

      setLoading(true);
      try {
        const qs = buildParticipantsQuery(p, appliedSearch);
        const res = await fetch(`/api/participants?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          logoutAdminHard();
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
    [appliedSearch]
  );

  useEffect(() => {
    fetchParticipants(page);
  }, [page, fetchParticipants]);

  const handleExportCsv = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setExporting(true);
    try {
      const qs1 = buildParticipantsQuery(1, appliedSearch);
      const res1 = await fetch(`/api/participants?${qs1}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res1.status === 401) {
        logoutAdminHard();
        return;
      }

      const json1 = await res1.json();
      if (!json1.success || !json1.data) {
        showToast('error', json1.message ?? 'Gagal mengambil data partisipan.');
        return;
      }

      const first = json1.data as PaginationData;
      const rows: ParticipantRow[] = [...first.data];

      for (let p = 2; p <= first.last_page; p++) {
        const qs = buildParticipantsQuery(p, appliedSearch);
        const res = await fetch(`/api/participants?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          logoutAdminHard();
          return;
        }
        const j = await res.json();
        if (j.success && j.data?.data) {
          rows.push(...(j.data as PaginationData).data);
        }
      }

      const header = [
        'id',
        'name',
        'email',
        'detail.phone',
        'detail.outlet_number',
        'detail.pet',
        'detail.scrub_size',
        'detail.social_media_account',
        'detail.points',
        'qr_code.code',
        'qr_code.image_path',
        'detail.rc_club',
        'is_account_verified',
      ];
      const lines = [
        header.map(escapeCsvCell).join(','),
        ...rows.map((row) =>
          [
            String(row.id),
            row.name,
            row.email,
            row.detail?.phone ?? '',
            row.detail?.outlet_number != null
              ? String(row.detail.outlet_number)
              : '',
            row.detail?.pet ?? '',
            row.detail?.scrub_size ?? '',
            row.detail?.social_media_account ?? '',
            row.detail?.points != null ? String(row.detail.points) : '',
            row.qr_code?.code ?? '',
            row.qr_code?.image_path ?? '',
            csvBool(row.detail?.rc_club),
            csvBool(isParticipantAccountVerified(row)),
          ]
            .map(escapeCsvCell)
            .join(',')
        ),
      ];

      const csv = `\uFEFF${lines.join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partisipan-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast(
        'success',
        `File CSV berhasil diunduh (${rows.length.toLocaleString('id-ID')} baris). Buka di Excel atau impor ke Google Sheets.`
      );
    } catch {
      showToast('error', 'Gagal mengekspor. Periksa koneksi Anda.');
    } finally {
      setExporting(false);
    }
  }, [appliedSearch]);

  const hasActiveSearch = Boolean(
    appliedSearch.name ||
    appliedSearch.email ||
    appliedSearch.phone ||
    appliedSearch.isAccountVerified === '0' ||
    appliedSearch.isAccountVerified === '1'
  );

  return (
    <div className='mx-auto max-w-3xl lg:max-w-6xl space-y-5'>
      <OverviewVerification />

      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Daftar Partisipan</h2>
          <p className='text-sm text-gray-500'>
            {pagination
              ? hasActiveSearch
                ? `Menampilkan ${pagination.total.toLocaleString('id-ID')} hasil pencarian`
                : `Total ${pagination.total.toLocaleString('id-ID')} partisipan terdaftar`
              : 'Memuat data...'}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end'>
          <button
            type='button'
            disabled={
              exporting || loading || !pagination || pagination.total === 0
            }
            onClick={handleExportCsv}
            title='Unduh semua partisipan sebagai CSV (bisa dibuka di Excel atau diimpor ke Google Sheets)'
            className='flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'>
            {exporting ? (
              <Icon
                icon='svg-spinners:ring-resize'
                className='h-5 w-5 text-gray-400'
              />
            ) : (
              <Icon icon='mdi:file-delimited-outline' className='h-5 w-5' />
            )}
            <span className='hidden sm:inline'>
              {exporting ? 'Mengekspor…' : 'Export CSV'}
            </span>
            <span className='sm:hidden'>{exporting ? '…' : 'CSV'}</span>
          </button>
          <button
            type='button'
            onClick={() => setShowAddModal(true)}
            className='flex cursor-pointer items-center gap-1.5 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98]'>
            <Icon icon='mdi:account-plus-outline' className='h-5 w-5' />
            <span className='hidden sm:inline'>Tambah Peserta</span>
            <span className='sm:hidden'>Tambah</span>
          </button>
        </div>
      </div>

      <SearchParticipant
        loading={loading}
        appliedSearch={appliedSearch}
        onSearch={(filters) => {
          setAppliedSearch(filters);
          setPage(1);
        }}
        onReset={() => {
          setAppliedSearch({
            name: '',
            email: '',
            phone: '',
            isAccountVerified: '',
          });
          setPage(1);
        }}
      />

      {/* Table */}
      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-smooth'>
          <table className='w-full min-w-0 table-fixed text-left text-sm md:min-w-[960px]'>
            <thead className='bg-rc-red'>
              <tr className='border-b border-white/15'>
                <th className='w-10 whitespace-nowrap px-3 py-3 text-xs font-bold text-white uppercase tracking-wider md:w-[3%] md:px-4'>
                  #
                </th>
                <th className='min-w-0 w-[25%] px-3 py-3 text-xs font-bold text-white uppercase tracking-wider md:w-[18%] md:px-4'>
                  Nama
                </th>
                <th className='hidden w-[20%] px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Email
                </th>
                <th className='hidden w-[12%] whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Telepon
                </th>
                <th className='hidden w-[12%] px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Klinik
                </th>
                <th className='hidden w-[15%] px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  BDM (Sales)
                </th>
                <th className='hidden w-[10%] whitespace-nowrap px-4 py-3 text-xs font-bold text-white uppercase tracking-wider md:table-cell'>
                  Verifikasi
                </th>
                <th className='w-28 whitespace-nowrap px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider md:w-[15%] md:px-4'>
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
                pagination.data.map((p, i) => (
                  <tr key={p.id} className='transition hover:bg-gray-50/50'>
                    <td className='whitespace-nowrap px-3 py-3 align-middle text-xs text-gray-400 tabular-nums md:px-4'>
                      {(pagination.current_page - 1) * pagination.per_page +
                        i +
                        1}
                    </td>
                    <td className='min-w-0 px-3 py-3 align-middle md:px-4'>
                      <p className='line-clamp-2 text-xs wrap-break-word font-semibold leading-snug text-gray-800 md:line-clamp-none'>
                        {p.name}
                      </p>
                      <div className='mt-1.5 md:hidden'>
                        {isParticipantAccountVerified(p) ? (
                          <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700'>
                            <Icon icon='mdi:check-circle' className='h-3 w-3' />
                            Verifikasi
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
                    <td className='hidden px-4 py-3 align-middle text-xs text-gray-500 md:table-cell'>
                      <span className='break-all leading-snug'>{p.email}</span>
                    </td>
                    <td className='hidden whitespace-nowrap px-4 py-3 align-middle text-xs text-gray-500 md:table-cell'>
                      {p.detail?.phone ?? '-'}
                    </td>
                    <td className='hidden px-4 py-3 align-middle text-xs text-gray-500 md:table-cell'>
                      <span className='wrap-break-word leading-snug'>
                        {p.detail?.clinic_name ?? '-'}
                      </span>
                    </td>
                    <td className='hidden px-4 py-3 align-middle text-xs text-gray-500 md:table-cell'>
                      <span className='wrap-break-word leading-snug'>
                        {p.detail?.sales_responsible ?? '-'}
                      </span>
                    </td>
                    <td className='hidden px-4 py-3 align-middle md:table-cell'>
                      {isParticipantAccountVerified(p) ? (
                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700'>
                          <Icon icon='mdi:check-circle' className='h-3 w-3' />
                          Verifikasi
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500'>
                          <Icon icon='mdi:clock-outline' className='h-3 w-3' />
                          Belum
                        </span>
                      )}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 align-middle text-center md:px-4'>
                      <button
                        type='button'
                        onClick={() => setDetailParticipantId(p.id)}
                        className='inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rc-red/30 bg-rc-red/5 px-2 py-1.5 text-[10px] font-bold text-rc-red transition hover:bg-rc-red/10 md:px-3 md:text-[11px]'>
                        <Icon icon='mdi:eye-outline' className='h-3.5 w-3.5' />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className='py-12 text-center text-sm text-gray-400'>
                    {hasActiveSearch
                      ? 'Tidak ada partisipan yang cocok dengan pencarian.'
                      : 'Belum ada data partisipan.'}
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
