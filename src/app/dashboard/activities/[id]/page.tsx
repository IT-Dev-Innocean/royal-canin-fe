'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  ActivityDetailView,
  ActivityEditModal,
  extractActivityDetail,
  type EventActivityRow,
} from '@/components/dashboard/activity';

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const activityId =
    typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : NaN;

  const [data, setData] = useState<EventActivityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (Number.isNaN(activityId)) {
      setError('ID aktivitas tidak valid.');
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
      const res = await fetch(`/api/admin/event-activities/${activityId}`, {
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
      if (!res.ok) {
        setError(
          (json as { message?: string }).message ??
            'Gagal memuat detail aktivitas.'
        );
        setData(null);
        return;
      }

      const row = extractActivityDetail(json);
      if (!row) {
        setError('Data aktivitas tidak ditemukan.');
        setData(null);
        return;
      }
      setData(row);
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 5000);
  }

  const handleDeleteActivity = useCallback(async () => {
    if (Number.isNaN(activityId)) return;
    if (
      !window.confirm(
        'Yakin ingin menghapus aktivitas ini? Tindakan tidak dapat dibatalkan.'
      )
    ) {
      return;
    }

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/event-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = (await res.json()) as { success?: boolean; message?: string };

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      if (!res.ok || json.success === false) {
        showToast(
          'error',
          json.message ?? 'Gagal menghapus aktivitas.'
        );
        return;
      }

      router.push('/dashboard/activities');
    } catch {
      showToast('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setDeleting(false);
    }
  }, [activityId, router]);

  if (Number.isNaN(activityId)) {
    return (
      <div className='mx-auto max-w-3xl space-y-4'>
        <Link
          href='/dashboard/activities'
          className='inline-flex items-center gap-1 text-sm font-bold text-rc-red hover:underline'>
          <Icon icon='mdi:chevron-left' className='h-5 w-5' />
          Kembali ke daftar
        </Link>
        <p className='text-sm text-red-600'>ID aktivitas tidak valid.</p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-3xl space-y-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Link
          href='/dashboard/activities'
          className='inline-flex w-fit items-center gap-1 text-sm font-bold text-rc-red hover:underline'>
          <Icon icon='mdi:chevron-left' className='h-5 w-5' />
          Kembali ke daftar aktivitas
        </Link>
        {data && !loading && !error && (
          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end'>
            <button
              type='button'
              onClick={() => setShowEdit(true)}
              disabled={deleting}
              className='inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:opacity-50 sm:w-fit sm:justify-start'>
              <Icon icon='mdi:pencil-outline' className='h-5 w-5' />
              Ubah aktivitas
            </button>
            <button
              type='button'
              onClick={() => void handleDeleteActivity()}
              disabled={deleting}
              className='inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 sm:w-fit'>
              {deleting ? (
                <Icon
                  icon='svg-spinners:ring-resize'
                  className='h-5 w-5 shrink-0'
                />
              ) : (
                <Icon icon='mdi:delete-outline' className='h-5 w-5 shrink-0' />
              )}
              Hapus aktivitas
            </button>
          </div>
        )}
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6'>
        <ActivityDetailView
          data={data}
          loading={loading}
          error={error}
          onRefreshDetail={() => void fetchDetail()}
          onToast={showToast}
        />
      </div>

      <ActivityEditModal
        key={showEdit ? `edit-${activityId}` : 'closed'}
        activityId={showEdit ? activityId : null}
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
