import Link from 'next/link';
import { RoyalCaninLogo } from '@/components/registration/RoyalCaninLogo';

export default function HomePage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16'>
      <RoyalCaninLogo />
      <div className='max-w-md text-center'>
        <h1 className='text-3xl font-bold text-rc-red'>Vet Symposium 2026</h1>
        <p className='mt-4 text-neutral-600'>
          Selamat datang. Gunakan tautan di bawah untuk membuka formulir
          pendaftaran acara.
        </p>
      </div>
      {/* <div className='flex flex-col gap-4 items-center'>
        <Link
          href='/registration-form'
          className='rounded-full bg-rc-red px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#c40016]'>
          Buka formulir pendaftaran
        </Link>
      </div> */}
      {/* <p className='max-w-sm text-center text-sm text-neutral-500'>
        Mengacu pada identitas visual dan komitmen nutrisi{' '}
        <a
          href='https://www.royalcanin.com/id'
          className='font-medium text-rc-red underline'
          target='_blank'
          rel='noopener noreferrer'>
          Royal Canin Indonesia
        </a>
        .
      </p> */}
    </main>
  );
}
