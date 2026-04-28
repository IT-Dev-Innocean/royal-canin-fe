'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getAdminToken, logoutAdminHard } from '@/lib/auth';
import {
  emptyActivityForm,
  formToJsonPayload,
  nameToActivityCode,
  EventActivityFormCard,
  type ActivityFormState,
} from '@/components/dashboard/activity';

export default function NewActivityPage() {
  const router = useRouter();
  const [form, setForm] = useState<ActivityFormState>(emptyActivityForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Nama wajib diisi.');
      return;
    }
    if (!nameToActivityCode(form.name)) {
      setFormError(
        'Nama perlu berisi huruf atau angka agar kode aktivitas terbentuk.'
      );
      return;
    }
    const qN = Math.round(Number(form.questions_per_session) || 0);
    const dN = Math.round(Number(form.default_reward_points) || 0);
    if (qN < 1 || qN > 100) {
      setFormError('Soal per sesi harus antara 1 dan 100.');
      return;
    }
    if (dN < 1 || dN > 1000) {
      setFormError('Reward poin (default) harus antara 1 dan 1000.');
      return;
    }

    const token = getAdminToken();
    if (!token) {
      logoutAdminHard();
      return;
    }

    setFormError(null);
    setFieldErrors(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/event-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formToJsonPayload(form)),
      });

      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: { id?: number };
        errors?: Record<string, string[]>;
      };

      if (res.status === 401) {
        logoutAdminHard();
        return;
      }

      if (!res.ok || json.success === false) {
        if (json.errors) setFieldErrors(json.errors);
        setFormError(json.message ?? 'Gagal membuat aktivitas.');
        return;
      }

      showToast('success', json.message ?? 'Aktivitas berhasil dibuat.');
      const newId = json.data?.id;
      if (typeof newId === 'number') {
        router.replace(`/dashboard/activities/${newId}`);
      } else {
        router.replace('/dashboard/activities');
      }
    } catch {
      setFormError('Tidak dapat terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div>
        <Link
          href='/dashboard/activities'
          className='inline-flex items-center gap-1 text-sm font-bold text-rc-red hover:underline'>
          <Icon icon='mdi:chevron-left' className='h-5 w-5' />
          Kembali ke daftar
        </Link>
        <h2 className='mt-3 text-xl font-bold text-gray-900'>
          Buat aktivitas baru
        </h2>
        <p className='text-sm text-gray-500'>
          Isi formulir di bawah (contoh tipe: gastro_fact).
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <EventActivityFormCard
          form={form}
          onChange={setForm}
          fieldErrors={fieldErrors}
          disabled={submitting}
          idPrefix='new-activity'
        />

        {formError && (
          <p className='text-sm text-red-600' role='alert'>
            {formError}
          </p>
        )}

        <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
          <Link
            href='/dashboard/activities'
            className='inline-flex justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50'>
            Batal
          </Link>
          <button
            type='submit'
            disabled={submitting}
            className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60'>
            {submitting ? (
              <Icon
                icon='svg-spinners:ring-resize'
                className='h-5 w-5 text-white'
              />
            ) : (
              <Icon icon='mdi:content-save-outline' className='h-5 w-5' />
            )}
            Simpan
          </button>
        </div>
      </form>

      {toast && (
        <div className='fixed bottom-6 right-6 z-50'>
          <div
            className={`flex min-w-[280px] max-w-sm items-start gap-3 rounded-2xl border px-5 py-4 shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}>
            <Icon
              icon={
                toast.type === 'success'
                  ? 'mdi:check-circle'
                  : 'mdi:alert-circle'
              }
              className='mt-0.5 h-5 w-5 shrink-0'
            />
            <p className='text-sm font-medium'>{toast.message}</p>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='shrink-0 rounded-full p-1 opacity-60 hover:opacity-100'>
              <Icon icon='mdi:close' className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
