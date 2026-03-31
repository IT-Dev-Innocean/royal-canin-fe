'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRegistrationForm } from '@/context/RegistrationFormContext';
import { PrivacySection } from '@/components/registration/PrivacySection';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';
import {
  RegistrationStyledSelect,
  type RegistrationStyledOption,
} from '@/components/registration/RegistrationStyledSelect';
import type {
  PetTypeOption,
  RegistrationRequestBody,
} from '@/types/registration';

const ROYAL_CANIN_CLUB_OPTIONS: RegistrationStyledOption[] = [
  { value: 'ya', label: 'Ya' },
  { value: 'tidak', label: 'Tidak' },
];

const PET_TYPE_CHOICES: { value: PetTypeOption; label: string }[] = [
  { value: 'kucing', label: 'Kucing' },
  { value: 'anjing', label: 'Anjing' },
  { value: 'tidak_punya', label: 'Tidak punya' },
];

const SCRUB_SIZE_OPTIONS: RegistrationStyledOption[] = [
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
  { value: '3XL', label: '3XL' },
  { value: '4XL', label: '4XL' },
];

const fieldInputClass =
  'w-full rounded-sm border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#e2001a] focus:outline-none focus:ring-1 focus:ring-[#e2001a]';

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className='mb-1.5 block text-sm font-bold text-neutral-900'>
      {children}
      {required ? <span className='text-[#e2001a]'> *</span> : null}
    </label>
  );
}

export function RegistrationFormView() {
  const router = useRouter();
  const { form, setField, submit, submitting, submitError } =
    useRegistrationForm();

  return (
    <main className='relative min-h-screen overflow-hidden pb-32'>
      <div
        className='pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-neutral-100/80 blur-2xl'
        aria-hidden
      />
      <div
        className='pointer-events-none absolute -left-20 bottom-24 h-56 w-56 rounded-full bg-neutral-100/80 blur-2xl'
        aria-hidden
      />

      <div className='relative mx-auto flex max-w-lg flex-col gap-6 px-4 pb-8 pt-8'>
        <RoyalCaninLogo className='mb-2' />

        <header className='text-center'>
          <p className='text-sm font-semibold uppercase tracking-widest text-[#e2001a]'>
            Pendaftaran
          </p>
          <h1 className='mt-1 text-2xl font-bold text-[#e2001a]'>
            VET SYMPOSIUM 2026
          </h1>
        </header>

        <form
          className='flex flex-col gap-4'
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}>
          <div className='rounded-md border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6'>
            <div className='flex flex-col gap-5'>
              <div>
                <FieldLabel htmlFor='email' required>
                  Email
                </FieldLabel>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder='nama@email.com'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor='fullName' required>
                  Nama Lengkap Dokter
                </FieldLabel>
                <p className='mb-1.5 text-xs leading-snug text-neutral-600'>
                  Untuk penulisan nama di ID peserta &amp; sertifikat (Mohon
                  pastikan agar tidak ada kesalahan pada penulisan gelar dan
                  titel)
                </p>
                <input
                  id='fullName'
                  name='fullName'
                  type='text'
                  required
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder='drh. Nama Lengkap'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor='phone' required>
                  Nomer Telepon WhatsApp
                </FieldLabel>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  inputMode='tel'
                  autoComplete='tel'
                  required
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder='08xxxxxxxxxx'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor='clinicName' required>
                  Nama Klinik
                </FieldLabel>
                <input
                  id='clinicName'
                  name='clinicName'
                  type='text'
                  required
                  value={form.clinicName}
                  onChange={(e) => setField('clinicName', e.target.value)}
                  placeholder='Nama klinik'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor='noi' required>
                  Number Outlet Identification (NOI)
                </FieldLabel>
                <input
                  id='noi'
                  name='noi'
                  type='text'
                  required
                  value={form.noi}
                  onChange={(e) => setField('noi', e.target.value)}
                  placeholder='Nomor NOI'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor='socialMedia'>Akun Media Sosial</FieldLabel>
                <input
                  id='socialMedia'
                  name='socialMedia'
                  type='text'
                  value={form.socialMedia}
                  onChange={(e) => setField('socialMedia', e.target.value)}
                  placeholder='@akun atau link'
                  className={fieldInputClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor='royalCaninClub' required>
                  Apakah Anda sudah memiliki akun Royal Canin Club?
                </FieldLabel>
                <RegistrationStyledSelect
                  id='royalCaninClub'
                  name='royalCaninClub'
                  value={form.royalCaninClub}
                  onValueChange={(v) =>
                    setField('royalCaninClub', v as typeof form.royalCaninClub)
                  }
                  options={ROYAL_CANIN_CLUB_OPTIONS}
                  placeholder='Pilih opsi'
                />
              </div>

              <div
                role='group'
                aria-labelledby='pet-types-question'
                className='min-w-0'>
                <p
                  id='pet-types-question'
                  className='mb-1.5 block text-sm font-bold text-neutral-900'>
                  Pilih hewan kesayangan yang Anda miliki di bawah ini?
                  <span className='text-[#e2001a]'> *</span>
                </p>
                <div className='flex flex-col gap-2'>
                  {PET_TYPE_CHOICES.map((opt) => {
                    const selected = form.petTypes === opt.value;
                    return (
                      <label
                        key={opt.value}
                        htmlFor={`petTypes-${opt.value}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 text-sm font-medium transition ${
                          selected
                            ? 'border-[#e2001a] bg-red-50/60 text-neutral-900'
                            : 'border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400'
                        }`}>
                        <input
                          id={`petTypes-${opt.value}`}
                          name='petTypes'
                          type='checkbox'
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setField('petTypes', opt.value);
                            } else if (selected) {
                              setField('petTypes', 'kucing');
                            }
                          }}
                          className='rc-checkbox'
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <section className='space-y-3 border-t border-neutral-100 pt-5'>
                <div>
                  <h2 className='text-center text-sm font-bold text-[#e2001a]'>
                    Panduan ukuran scrub
                  </h2>
                  <p className='mt-1 text-center text-xs text-neutral-600'>
                    Perhatikan size chart dengan baik
                  </p>
                </div>
                <Image
                  src='/assets/scrub-rc.jpeg'
                  alt='Scrub Diagram'
                  width={1100}
                  height={400}
                  className='w-full h-auto'
                />
              </section>

              <div>
                <FieldLabel htmlFor='scrubSizeDropdown' required>
                  Mohon untuk memilih ukuran Scrub dari list berikut?
                </FieldLabel>
                <RegistrationStyledSelect
                  id='scrubSizeDropdown'
                  name='scrubSize'
                  value={form.scrubSize}
                  onValueChange={(v) =>
                    setField(
                      'scrubSize',
                      v as RegistrationRequestBody['scrubSize']
                    )
                  }
                  options={SCRUB_SIZE_OPTIONS}
                  placeholder='Pilih ukuran scrub'
                />
              </div>
            </div>
          </div>

          <PrivacySection />

          {submitError ? (
            <p
              className='rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700'
              role='alert'>
              {submitError}
            </p>
          ) : null}

          <div className='flex flex-col items-center gap-3 pt-4'>
            <button
              type='submit'
              disabled={submitting}
              className='flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#e2001a] px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#c40016] disabled:opacity-60'>
              {submitting ? (
                <>
                  <Icon icon='svg-spinners:ring-resize' className='h-5 w-5' />
                  Mengirim…
                </>
              ) : (
                'Kirim'
              )}
            </button>
            <button
              type='button'
              onClick={() => router.push('/')}
              className='w-full max-w-xs rounded-full border-2 border-[#e2001a] bg-white px-8 py-3.5 text-base font-semibold text-[#e2001a] transition hover:bg-red-50'>
              Kembali
            </button>
          </div>
        </form>
      </div>

      <footer className='relative mt-8 border-t border-neutral-100 bg-gradient-to-b from-white to-neutral-50 px-4 pb-10 pt-8'>
        <div className='mx-auto flex max-w-lg flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between'>
          <div className='text-center sm:text-left'>
            <p className='text-lg font-bold leading-tight text-[#e2001a]'>
              VET
            </p>
            <p className='text-lg font-bold leading-tight text-[#e2001a]'>
              SYMPOSIUM
            </p>
            <p className='text-lg font-bold text-[#e2001a]'>2026</p>
          </div>
          <div className='flex items-end gap-2' aria-hidden>
            <Icon icon='mdi:cat' className='h-16 w-16 text-neutral-400' />
            <Icon icon='mdi:dog' className='h-20 w-20 text-neutral-400' />
          </div>
        </div>
        <p className='mt-6 text-center text-xs text-neutral-500'>
          Nutrisi kesehatan khusus untuk kucing &amp; anjing — mengacu pada{' '}
          <Link
            href='https://www.royalcanin.com/id'
            className='text-[#e2001a] underline'
            target='_blank'
            rel='noopener noreferrer'>
            royalcanin.com/id
          </Link>
        </p>
      </footer>
    </main>
  );
}
