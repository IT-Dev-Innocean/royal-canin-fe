'use client';

import Link from 'next/link';

export default function konfrimasiPertanyaanPage() {
  return (
    <main className='flex flex-col items-center p-6 bg-white min-h-screen text-black text-center'>
      <div className='mb-8 mt-4 flex justify-center'>
        <div className='w-24 h-24 bg-rc-red rounded-full flex items-center justify-center shadow-lg shadow-red-200'>
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

      <h1 className='text-xl font-bold mb-4'>Penilaian Berhasil Dikirim</h1>

      <div className='bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-8 w-full max-w-lg'>
        <p className='text-xs md:text-sm text-gray-600 leading-relaxed'>
          Terima kasih untuk tanggapan yang Anda kirimkan sebagai salah satu
          rekomendasi untuk bisa memberikan fasilitas dan pengalaman yang lebih
          baik di acara kami berikutnya.
        </p>
      </div>

      <div className='bg-rc-red text-white rounded-xl p-4 w-full max-full max-w-lg mb-4 shadow-md'>
        <p className='text-sm md:text-base font-bold text-center'>
          +100 Score Ditambahkan
        </p>
        <p className='text-xs md:text-sm opacity-90 mt-1'>
          Terima Kasih telah berpartisipasi aktif dalam sesi ini.
        </p>
      </div>

      <div className='w-full max-w-lg mt-30 pb-10'>
        <Link
          href='/event'
          className='block w-full py-3 bg-rc-red text-white text-center rounded-xl font-bold shadow-md hover:bg-[#b50015] transition-all active:scale-95 cursor-pointer text-sm md:text-base'>
          Kembali ke Menu
        </Link>
      </div>
    </main>
  );
}
