'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  readSeminarFaqConfirmation,
  type SeminarFaqConfirmationPayload,
} from '@/lib/seminarFaqConfirmation';

export default function KonfirmasiPertanyaanPage() {
  const router = useRouter();
  const [data, setData] = useState<SeminarFaqConfirmationPayload | null>(null);
  const [ready, setReady] = useState(false);

  /** Baca payload tanpa menghapus di sini — hapus saat buka halaman FAQ (hindari bug React Strict Mode ganda). */
  useEffect(() => {
    setData(readSeminarFaqConfirmation());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!data) {
      router.replace('/event/seminar/faq');
    }
  }, [ready, data, router]);

  if (!ready) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-white p-6 text-black'>
        <p className='text-sm text-gray-500'>Memuat…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center bg-white p-6 text-black'>
        <p className='text-sm text-gray-500'>Mengalihkan…</p>
      </main>
    );
  }

  const hasPoints = data.points_earned > 0;

  return (
    <main className='flex min-h-screen flex-col items-center bg-white p-6 text-center text-black'>
      <div className='mb-8 mt-4 flex justify-center'>
        <div className='flex h-24 w-24 items-center justify-center rounded-full bg-rc-red shadow-lg shadow-red-200'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-14 w-14 text-white'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={3}>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M5 13l4 4L19 7'
            />
          </svg>
        </div>
      </div>

      <h1 className='mb-2 text-xl font-bold'>Pertanyaan Berhasil Dikirim</h1>

      <p className='mb-4 max-w-md text-sm font-medium text-rc-red'>
        {data.message}
      </p>

      <div className='mb-6 w-full max-w-sm rounded-xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.1)] md:p-6'>
        <p className='text-[11px] font-bold uppercase tracking-wider text-gray-400'>
          Untuk pembicara
        </p>
        <p className='mt-1 text-sm font-bold text-gray-900'>{data.speaker_name}</p>
        <p className='mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400'>
          Pertanyaan Anda
        </p>
        <p className='mt-1 text-xs md:text-sm leading-relaxed text-gray-700 whitespace-pre-wrap'>
          {data.question}
        </p>
        <p className='mt-4 text-xs md:text-sm leading-relaxed text-gray-600'>
          Pertanyaan Anda telah dikirimkan untuk dikurasi oleh admin kami.
          Pertanyaan yang lolos proses kurasi akan dijawab oleh pembicara di
          sesi tanya jawab.
        </p>
      </div>

      {hasPoints ? (
        <div className='mb-4 w-full max-w-sm rounded-xl bg-rc-red p-4 text-white shadow-md'>
          <p className='text-lg font-bold'>
            +{data.points_earned.toLocaleString('id-ID')} Poin ditambahkan
          </p>
          <p className='mt-1 text-xs opacity-90'>
            Terima kasih telah berpartisipasi aktif dalam sesi ini.
          </p>
        </div>
      ) : (
        <div className='mb-4 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-4 text-left'>
          <p className='text-sm text-gray-700'>
            Untuk pertanyaan ini tidak ada poin tambahan (misalnya sudah melewati
            kuota pertanyaan yang mendapat poin).
          </p>
        </div>
      )}

      <div className='mt-auto w-full max-w-sm pb-10'>
        <Link
          href='/event'
          className='block w-full rounded-xl bg-rc-red py-3 text-center font-bold text-white shadow-md transition-all hover:bg-[#b50015] active:scale-95 cursor-pointer'>
          Kembali ke Menu Acara
        </Link>
      </div>
    </main>
  );
}
