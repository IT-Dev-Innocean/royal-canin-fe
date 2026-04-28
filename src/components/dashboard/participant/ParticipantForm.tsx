'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Icon } from '@iconify/react';

export const SCRUB_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
export const PET_OPTIONS = [
  { value: 'cat', label: 'Kucing' },
  { value: 'dog', label: 'Anjing' },
  { value: 'both', label: 'Kucing & Anjing' },
];

export interface ParticipantFormState {
  name: string;
  email: string;
  phone: string;
  clinic_name: string;
  outlet_number: string;
  social_media_account: string;
  rc_club: boolean;
  pet: string;
  scrub_size: string;
}

export const PARTICIPANT_FORM_INITIAL: ParticipantFormState = {
  name: '',
  email: '',
  phone: '',
  clinic_name: '',
  outlet_number: '',
  social_media_account: '',
  rc_club: false,
  pet: '',
  scrub_size: '',
};

export function participantDetailToFormState(d: {
  name: string;
  email: string;
  detail?: {
    phone?: string;
    clinic_name?: string;
    outlet_number?: number | null;
    social_media_account?: string;
    rc_club?: boolean;
    pet?: string;
    scrub_size?: string;
  };
}): ParticipantFormState {
  return {
    name: d.name ?? '',
    email: d.email ?? '',
    phone: d.detail?.phone ?? '',
    clinic_name: d.detail?.clinic_name ?? '',
    outlet_number:
      d.detail?.outlet_number != null ? String(d.detail.outlet_number) : '',
    social_media_account: d.detail?.social_media_account ?? '',
    rc_club: Boolean(d.detail?.rc_club),
    pet: d.detail?.pet ?? '',
    scrub_size: d.detail?.scrub_size ?? '',
  };
}

export function buildParticipantPayload(
  form: ParticipantFormState
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  };
  if (form.clinic_name.trim()) payload.clinic_name = form.clinic_name.trim();
  if (form.outlet_number.trim()) {
    payload.outlet_number = parseInt(form.outlet_number, 10);
  }
  if (form.social_media_account.trim()) {
    payload.social_media_account = form.social_media_account.trim();
  }
  payload.rc_club = form.rc_club;
  if (form.pet) payload.pet = form.pet;
  if (form.scrub_size) payload.scrub_size = form.scrub_size;
  return payload;
}

const inputBase =
  'w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-rc-red/30 focus:border-rc-red';
const inputNormal = `${inputBase} border-gray-200 bg-white`;
const inputError = `${inputBase} border-red-300 bg-red-50/30`;

export interface ParticipantFormProps {
  form: ParticipantFormState;
  setForm: Dispatch<SetStateAction<ParticipantFormState>>;
  fieldErrors: Record<string, string[]>;
  saving: boolean;
  primaryLabel: string;
  primaryIcon: string;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  footerClassName?: string;
}

export function ParticipantFormFields({
  form,
  setForm,
  fieldErrors,
}: Pick<ParticipantFormProps, 'form' | 'setForm' | 'fieldErrors'>) {
  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  return (
    <>
      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          Nama Lengkap <span className='text-rc-red'>*</span>
        </label>
        <input
          type='text'
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder='Nama lengkap peserta'
          className={fieldError('name') ? inputError : inputNormal}
        />
        {fieldError('name') && (
          <p className='mt-1 text-xs text-red-500'>{fieldError('name')}</p>
        )}
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          Email <span className='text-rc-red'>*</span>
        </label>
        <input
          type='email'
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder='email@contoh.com'
          className={fieldError('email') ? inputError : inputNormal}
        />
        {fieldError('email') && (
          <p className='mt-1 text-xs text-red-500'>{fieldError('email')}</p>
        )}
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          No. Telepon <span className='text-rc-red'>*</span>
        </label>
        <input
          type='tel'
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder='081234567890'
          className={fieldError('phone') ? inputError : inputNormal}
        />
        {fieldError('phone') && (
          <p className='mt-1 text-xs text-red-500'>{fieldError('phone')}</p>
        )}
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          Nama Klinik
        </label>
        <input
          type='text'
          value={form.clinic_name}
          onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
          placeholder='Nama klinik (opsional)'
          className={fieldError('clinic_name') ? inputError : inputNormal}
        />
        {fieldError('clinic_name') && (
          <p className='mt-1 text-xs text-red-500'>
            {fieldError('clinic_name')}
          </p>
        )}
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          NIO (Nomor Identification Outlet)
        </label>
        <input
          type='number'
          value={form.outlet_number}
          onChange={(e) => setForm({ ...form, outlet_number: e.target.value })}
          placeholder='Nomor outlet (opsional)'
          className={fieldError('outlet_number') ? inputError : inputNormal}
        />
        {fieldError('outlet_number') && (
          <p className='mt-1 text-xs text-red-500'>
            {fieldError('outlet_number')}
          </p>
        )}
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          Akun Media Sosial
        </label>
        <input
          type='text'
          value={form.social_media_account}
          onChange={(e) =>
            setForm({ ...form, social_media_account: e.target.value })
          }
          placeholder='@username (opsional)'
          className={
            fieldError('social_media_account') ? inputError : inputNormal
          }
        />
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          Jenis Hewan Peliharaan
        </label>
        <div className='flex flex-wrap gap-2'>
          {PET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type='button'
              onClick={() =>
                setForm({
                  ...form,
                  pet: form.pet === opt.value ? '' : opt.value,
                })
              }
              className={`cursor-pointer rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                form.pet === opt.value
                  ? 'border-rc-red bg-rc-red text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-rc-red'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className='mb-1 block text-xs font-bold text-gray-600'>
          Ukuran Scrub
        </label>
        <div className='flex flex-wrap gap-2'>
          {SCRUB_SIZES.map((size) => (
            <button
              key={size}
              type='button'
              onClick={() =>
                setForm({
                  ...form,
                  scrub_size: form.scrub_size === size ? '' : size,
                })
              }
              className={`h-10 w-12 cursor-pointer rounded-lg border text-xs font-bold transition-all ${
                form.scrub_size === size
                  ? 'border-rc-red bg-rc-red text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-rc-red'
              }`}>
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3'>
        <label className='text-xs font-bold text-gray-600'>
          Anggota Royal Canin Club
        </label>
        <button
          type='button'
          onClick={() => setForm({ ...form, rc_club: !form.rc_club })}
          className={`relative h-7 w-12 cursor-pointer rounded-full transition-colors ${
            form.rc_club ? 'bg-rc-red' : 'bg-gray-300'
          }`}>
          <span
            className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              form.rc_club ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </>
  );
}

export function ParticipantForm({
  form,
  setForm,
  fieldErrors,
  saving,
  primaryLabel,
  primaryIcon,
  onSubmit,
  onCancel,
  footerClassName = 'flex flex-col gap-3 border-t border-gray-100 p-5 md:flex-row',
}: ParticipantFormProps) {
  return (
    <form onSubmit={onSubmit} className='flex flex-1 flex-col overflow-hidden'>
      <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
        <ParticipantFormFields
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
        />
      </div>

      {Object.keys(fieldErrors).length > 0 && (
        <div className='px-5'>
          <div className='flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800'>
            <Icon
              icon='mdi:alert-circle'
              className='mt-0.5 h-5 w-5 shrink-0 text-red-600'
            />
            <p className='text-sm font-medium leading-snug'>
              Periksa kembali data yang diisi.
            </p>
          </div>
        </div>
      )}

      <div className={footerClassName}>
        <button
          type='button'
          disabled={saving}
          onClick={onCancel}
          className='flex-1 cursor-pointer rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50'>
          Batal
        </button>
        <button
          type='submit'
          disabled={
            saving ||
            !form.name.trim() ||
            !form.email.trim() ||
            !form.phone.trim()
          }
          className='flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rc-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b50015] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'>
          {saving ? (
            <>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Menyimpan...
            </>
          ) : (
            <>
              <Icon icon={primaryIcon} className='h-5 w-5' />
              {primaryLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
