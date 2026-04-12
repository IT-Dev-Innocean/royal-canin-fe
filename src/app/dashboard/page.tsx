'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAuth, getToken } from '@/lib/auth';

interface StatsData {
  totalParticipants: number;
  totalCheckIns: number;
  loading: boolean;
  error: string | null;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    totalParticipants: 0,
    totalCheckIns: 0,
    loading: true,
    error: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace('/dashboard/login');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [participantsRes, checkInsRes] = await Promise.all([
        fetch('/api/participants?page=1', { headers }),
        fetch('/api/check-ins?page=1', { headers }),
      ]);

      if (participantsRes.status === 401 || checkInsRes.status === 401) {
        clearAuth();
        router.replace('/dashboard/login');
        return;
      }

      const participantsJson = await participantsRes.json();
      const checkInsJson = await checkInsRes.json();

      const totalParticipants = participantsJson.success
        ? (participantsJson.data?.total ?? 0)
        : 0;
      const totalCheckIns = checkInsJson.success
        ? (checkInsJson.data?.total ?? 0)
        : 0;

      setStats({
        totalParticipants,
        totalCheckIns,
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

    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const checkInPercentage =
    stats.totalParticipants > 0
      ? Math.round((stats.totalCheckIns / stats.totalParticipants) * 100)
      : 0;

  const notCheckedIn = stats.totalParticipants - stats.totalCheckIns;

  return (
    <div className='mx-auto max-w-2xl lg:max-w-6xl space-y-6'>
      {/* Header row */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Ringkasan Acara</h2>
          <p className='text-sm text-gray-500'>
            Pantau statistik acara secara real-time
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
            className='flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer'>
            <Icon
              icon='mdi:refresh'
              className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error alert */}
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
        {/* Total participants */}
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
                  {stats.loading
                    ? '—'
                    : stats.totalParticipants.toLocaleString('id-ID')}
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

        {/* Total check-ins */}
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
                  {stats.loading
                    ? '—'
                    : stats.totalCheckIns.toLocaleString('id-ID')}
                </p>
                {stats.loading && (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 shrink-0 text-gray-300'
                  />
                )}
              </div>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Sudah Check-in
              </p>
            </div>
          </div>
        </div>

        {/* Not checked in */}
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
                  {stats.loading ? '—' : notCheckedIn.toLocaleString('id-ID')}
                </p>
                {stats.loading && (
                  <Icon
                    icon='svg-spinners:ring-resize'
                    className='h-4 w-4 shrink-0 text-gray-300'
                  />
                )}
              </div>
              <p className='mt-1 text-sm font-medium text-gray-500'>
                Belum Check-in
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!stats.loading && stats.totalParticipants > 0 && (
        <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-bold text-gray-800'>
              Progress Check-in
            </h3>
            <span className='text-sm font-extrabold text-rc-red tabular-nums'>
              {checkInPercentage}%
            </span>
          </div>

          <div className='h-3 w-full overflow-hidden rounded-full bg-gray-100'>
            <div
              className='h-full rounded-full bg-linear-to-r from-rc-red to-[#ff4d6a] transition-all duration-700 ease-out'
              style={{ width: `${checkInPercentage}%` }}
            />
          </div>

          <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
            <span>
              <span className='font-bold text-gray-700'>
                {stats.totalCheckIns.toLocaleString('id-ID')}
              </span>{' '}
              dari{' '}
              <span className='font-bold text-gray-700'>
                {stats.totalParticipants.toLocaleString('id-ID')}
              </span>{' '}
              partisipan
            </span>
            <span className='flex items-center gap-1 text-emerald-600 font-medium'>
              <Icon icon='mdi:check-circle' className='h-3.5 w-3.5' />
              Live
            </span>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <button
          onClick={() => router.push('/dashboard/participants')}
          className='flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-gray-200 cursor-pointer group'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-100'>
            <Icon
              icon='mdi:account-group-outline'
              className='h-6 w-6 text-blue-600'
            />
          </div>
          <div className='text-left'>
            <p className='text-sm font-bold text-gray-800'>Kelola Partisipan</p>
            <p className='text-xs text-gray-500'>
              Lihat daftar semua partisipan
            </p>
          </div>
          <Icon
            icon='mdi:chevron-right'
            className='ml-auto h-5 w-5 text-gray-300 transition group-hover:text-gray-500'
          />
        </button>

        <button
          onClick={() => router.push('/dashboard/check-ins')}
          className='flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-gray-200 cursor-pointer group'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 transition group-hover:bg-emerald-100'>
            <Icon icon='mdi:qrcode-scan' className='h-6 w-6 text-emerald-600' />
          </div>
          <div className='text-left'>
            <p className='text-sm font-bold text-gray-800'>Check-in Event</p>
            <p className='text-xs text-gray-500'>
              Lihat data check-in partisipan
            </p>
          </div>
          <Icon
            icon='mdi:chevron-right'
            className='ml-auto h-5 w-5 text-gray-300 transition group-hover:text-gray-500'
          />
        </button>
      </div>
    </div>
  );
}
