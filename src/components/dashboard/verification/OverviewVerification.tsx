'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAdminAuth, getAdminToken } from '@/lib/auth';

interface VerificationStats {
  total: number;
  verified: number;
  loading: boolean;
  error: string | null;
}

interface PaginationResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: { id: number; is_account_verified?: boolean }[];
}

export function OverviewVerification() {
  const router = useRouter();
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    verified: 0,
    loading: true,
    error: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      clearAdminAuth();
      router.replace('/dashboard/login');
      return;
    }

    setStats((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res1 = await fetch('/api/participants?page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res1.status === 401) {
        clearAdminAuth();
        router.replace('/dashboard/login');
        return;
      }

      const json1 = await res1.json();
      if (!json1.success || !json1.data) {
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: 'Gagal memuat data verifikasi.',
        }));
        return;
      }

      const first = json1.data as PaginationResponse;
      const rows: { is_account_verified?: boolean }[] = [...first.data];

      for (let p = 2; p <= first.last_page; p++) {
        const res = await fetch(`/api/participants?page=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          clearAdminAuth();
          router.replace('/dashboard/login');
          return;
        }
        const j = await res.json();
        if (j.success && j.data?.data) {
          rows.push(...(j.data as PaginationResponse).data);
        }
      }

      const verified = rows.filter(
        (r) => r.is_account_verified === true
      ).length;

      setStats({
        total: first.total,
        verified,
        loading: false,
        error: null,
      });
      setLastUpdated(new Date());
    } catch {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: 'Gagal memuat data. Periksa koneksi internet Anda.',
      }));
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const notVerified = stats.total - stats.verified;
  const percentage =
    stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className='space-y-4 mb-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>
            Ringkasan Verifikasi
          </h2>
          <p className='text-sm text-gray-500'>
            Pantau status verifikasi akun peserta
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {lastUpdated && (
            <p className='text-xs text-gray-400'>
              Terakhir diperbarui:{' '}
              {lastUpdated.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          )}
          <button
            onClick={fetchStats}
            disabled={stats.loading}
            className='flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50'>
            <Icon
              icon='mdi:refresh'
              className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {stats.error && (
        <div className='flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3'>
          <Icon
            icon='mdi:alert-circle-outline'
            className='mt-0.5 h-5 w-5 shrink-0 text-red-500'
          />
          <p className='text-sm text-red-700'>{stats.error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {/* Total */}
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50'>
              <Icon
                icon='mdi:account-group'
                className='h-6 w-6 text-blue-600'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <p className='text-2xl font-extrabold leading-tight text-gray-900 tabular-nums'>
                  {stats.loading ? '—' : stats.total.toLocaleString('id-ID')}
                </p>
                {stats.loading && (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 shrink-0 text-gray-300'
                  />
                )}
              </div>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Total Partisipan
              </p>
            </div>
          </div>
        </div>

        {/* Verified */}
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50'>
              <Icon
                icon='mdi:check-decagram'
                className='h-6 w-6 text-emerald-600'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <p className='text-2xl font-extrabold leading-tight text-gray-900 tabular-nums'>
                  {stats.loading ? '—' : stats.verified.toLocaleString('id-ID')}
                </p>
                {stats.loading && (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 shrink-0 text-gray-300'
                  />
                )}
              </div>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Sudah Verifikasi
              </p>
            </div>
          </div>
        </div>

        {/* Not verified */}
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1'>
          <div className='flex items-center gap-4'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50'>
              <Icon
                icon='mdi:account-clock-outline'
                className='h-6 w-6 text-amber-600'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <p className='text-2xl font-extrabold leading-tight text-gray-900 tabular-nums'>
                  {stats.loading ? '—' : notVerified.toLocaleString('id-ID')}
                </p>
                {stats.loading && (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 shrink-0 text-gray-300'
                  />
                )}
              </div>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Belum Verifikasi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!stats.loading && stats.total > 0 && (
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-sm font-bold text-gray-800'>
              Progress Verifikasi
            </h3>
            <span className='text-sm font-extrabold text-rc-red tabular-nums'>
              {percentage}%
            </span>
          </div>

          <div className='h-3 w-full overflow-hidden rounded-full bg-gray-100'>
            <div
              className='h-full rounded-full bg-linear-to-r from-rc-red to-[#ff4d6a] transition-all duration-700 ease-out'
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
            <span>
              <span className='font-bold text-gray-700'>
                {stats.verified.toLocaleString('id-ID')}
              </span>{' '}
              dari{' '}
              <span className='font-bold text-gray-700'>
                {stats.total.toLocaleString('id-ID')}
              </span>{' '}
              partisipan
            </span>
            <span className='flex items-center gap-1 font-medium text-emerald-600'>
              <Icon icon='mdi:check-circle' className='h-3.5 w-3.5' />
              Live
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
