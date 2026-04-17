'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

/** '' = semua; API: is_account_verified=1 sudah, =0 belum */
export type SearchVerificationFilter = '' | '0' | '1';

export interface SearchParticipantFilters {
  name: string;
  email: string;
  phone: string;
  isAccountVerified: SearchVerificationFilter;
}

export interface SearchParticipantProps {
  loading: boolean;
  appliedSearch: SearchParticipantFilters;
  onSearch: (filters: SearchParticipantFilters) => void;
  onReset: () => void;
}

export function SearchParticipant({
  loading,
  appliedSearch,
  onSearch,
  onReset,
}: SearchParticipantProps) {
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [verifyDraft, setVerifyDraft] = useState<SearchVerificationFilter>('');

  const hasActiveSearch = Boolean(
    appliedSearch.name ||
    appliedSearch.email ||
    appliedSearch.phone ||
    appliedSearch.isAccountVerified === '0' ||
    appliedSearch.isAccountVerified === '1'
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({
      name: nameDraft.trim(),
      email: emailDraft.trim(),
      phone: phoneDraft.replace(/\D/g, '').slice(0, 13),
      isAccountVerified: verifyDraft,
    });
  }

  function handleReset() {
    setNameDraft('');
    setEmailDraft('');
    setPhoneDraft('');
    setVerifyDraft('');
    onReset();
  }

  const resetDisabled =
    !nameDraft &&
    !emailDraft &&
    !phoneDraft &&
    !verifyDraft &&
    !hasActiveSearch;

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5'>
      <p className='mb-3 text-xs font-bold uppercase tracking-wider text-gray-500'>
        Cari partisipan
      </p>
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end'>
        <div className='lg:col-span-2'>
          <label
            htmlFor='search-name'
            className='mb-1 block text-xs font-medium text-gray-600'>
            Nama
          </label>
          <input
            id='search-name'
            type='text'
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder='Contoh: agus'
            autoComplete='off'
            className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rc-red focus:outline-none focus:ring-1 focus:ring-rc-red'
          />
        </div>
        <div className='lg:col-span-3'>
          <label
            htmlFor='search-email'
            className='mb-1 block text-xs font-medium text-gray-600'>
            Email
          </label>
          <input
            id='search-email'
            type='email'
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            placeholder='Contoh: nama@email.com'
            autoComplete='off'
            className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rc-red focus:outline-none focus:ring-1 focus:ring-rc-red'
          />
        </div>
        <div className='lg:col-span-2'>
          <label
            htmlFor='search-phone'
            className='mb-1 block text-xs font-medium text-gray-600'>
            Telepon
          </label>
          <input
            id='search-phone'
            type='text'
            inputMode='numeric'
            maxLength={13}
            value={phoneDraft}
            onChange={(e) =>
              setPhoneDraft(e.target.value.replace(/\D/g, '').slice(0, 13))
            }
            placeholder='Contoh: 0812'
            autoComplete='off'
            className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rc-red focus:outline-none focus:ring-1 focus:ring-rc-red'
          />
        </div>
        <div className='lg:col-span-2'>
          <label
            htmlFor='search-verification'
            className='mb-1 block text-xs font-medium text-gray-600'>
            Verifikasi
          </label>
          <select
            id='search-verification'
            value={verifyDraft}
            onChange={(e) =>
              setVerifyDraft(e.target.value as SearchVerificationFilter)
            }
            className='w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-rc-red focus:outline-none focus:ring-1 focus:ring-rc-red'>
            <option value=''>Semua</option>
            <option value='1'>Sudah verifikasi</option>
            <option value='0'>Belum verifikasi</option>
          </select>
        </div>
        <div className='flex flex-wrap gap-2 md:col-span-2 lg:col-span-3'>
          <button
            type='submit'
            disabled={loading}
            className='inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rc-red px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b50015] disabled:opacity-50 sm:flex-initial'>
            <Icon icon='mdi:magnify' className='h-5 w-5' />
            Cari
          </button>
          <button
            type='button'
            onClick={handleReset}
            disabled={resetDisabled}
            className='inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 sm:flex-initial'>
            <Icon icon='mdi:filter-off-outline' className='h-5 w-5' />
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}
