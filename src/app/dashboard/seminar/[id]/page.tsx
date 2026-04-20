'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  SeminarDetailView,
  SeminarEditModal,
  type SeminarDetail,
} from '@/components/dashboard/seminar';

export default function SeminarDetailPage() {
  const params = useParams();
  const rawId = params.id;
  const seminarId =
    typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : NaN;

  const [data, setData] = useState<SeminarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (Number.isNaN(seminarId)) {
      setError('ID seminar tidak valid.');
      setLoading(false);
      setData(null);
      return;
    }

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/seminars/${seminarId}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? 'Gagal memuat detail seminar.');
        setData(null);
        return;
      }
      setData(json.data as SeminarDetail);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [seminarId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 5000);
  }

  if (Number.isNaN(seminarId)) {
    return (
      <div className='mx-auto max-w-3xl space-y-4'>
        <Link
          href='/dashboard/seminars'
          className='inline-flex items-center gap-1 text-sm font-bold text-rc-red hover:underline'>
          <Icon icon='mdi:chevron-left' className='h-5 w-5' />
          Kembali ke daftar
        </Link>
        <p className='text-sm text-red-600'>ID seminar tidak valid.</p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-3xl space-y-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Link
          href='/dashboard/seminars'
          className='inline-flex w-fit items-center gap-1 text-sm font-bold text-rc-red hover:underline'>
          <Icon icon='mdi:chevron-left' className='h-5 w-5' />
          Kembali ke daftar seminar
        </Link>
        {data && !loading && !error && (
          <button
            type='button'
            onClick={() => setShowEdit(true)}
            className='cursor-pointer inline-flex w-full sm:w-fit justify-center sm:justify-start items-center gap-2 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015]'>
            <Icon icon='mdi:pencil-outline' className='h-5 w-5' />
            Ubah seminar
          </button>
        )}
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6'>
        <SeminarDetailView
          data={data}
          loading={loading}
          error={error}
          onRefresh={() => void fetchDetail()}
          onToast={showToast}
        />
      </div>

      <SeminarEditModal
        key={showEdit ? `edit-${seminarId}` : 'closed'}
        seminarId={showEdit ? seminarId : null}
        onClose={() => setShowEdit(false)}
        onSuccess={(updated) => {
          if (updated) setData(updated);
          void fetchDetail();
        }}
        onToast={showToast}
      />

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
              className='shrink-0 rounded-full p-1 hover:bg-black/5'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
