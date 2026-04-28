'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { getAdminToken } from '@/lib/auth';
import {
  ParticipantForm,
  PARTICIPANT_FORM_INITIAL,
  type ParticipantFormState,
  buildParticipantPayload,
} from './ParticipantForm';

export interface ParticipantAddModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast?: (type: 'success' | 'error', message: string) => void;
}

export function ParticipantAddModal({
  open,
  onClose,
  onSuccess,
  onToast,
}: ParticipantAddModalProps) {
  const [form, setForm] = useState<ParticipantFormState>(
    PARTICIPANT_FORM_INITIAL
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function resetAndClose() {
    setForm(PARTICIPANT_FORM_INITIAL);
    setFieldErrors({});
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const token = getAdminToken();
    if (!token) return;

    const payload = buildParticipantPayload(form);

    setSaving(true);

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) {
          setFieldErrors(json.errors);
        }
        onToast?.('error', json.message ?? 'Gagal menambahkan peserta.');
        return;
      }

      setForm(PARTICIPANT_FORM_INITIAL);
      setFieldErrors({});
      onSuccess();
      resetAndClose();
      onToast?.('success', json.message ?? 'Peserta berhasil ditambahkan.');
    } catch {
      onToast?.('error', 'Tidak dapat terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={() => !saving && resetAndClose()}
      />
      <div className='relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
          <h3 className='text-lg font-bold text-gray-900'>Tambah Peserta</h3>
          <button
            type='button'
            disabled={saving}
            onClick={resetAndClose}
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        <ParticipantForm
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          saving={saving}
          primaryLabel='Tambah Peserta'
          primaryIcon='mdi:account-plus-outline'
          onSubmit={handleSubmit}
          onCancel={() => !saving && resetAndClose()}
        />
      </div>
    </div>
  );
}
