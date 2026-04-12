'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const faqData = [
  {
    question: 'Kapan Vet symposium 2026 diselenggarakan?',
    answer:
      'Tanggal pelaksanaan akan diinformasikan melalui email dan whatsapp resmi.',
  },
  {
    question: 'Di kota mana acara ini berlangsung?',
    answer: 'Acara ini akan diselenggarakan di Bali, Indonesia',
  },
  {
    question: 'Apakah acara ini diadakan tahun ini?',
    answer: 'Ya, Royal Canin Symposium akan diadakan pada tahun 2026',
  },
  {
    question: 'Bagaimana cara mendaftar?',
    answer:
      'Pendaftaran dapat dilakukan melalui link registrasi yang tertera dalam undangan',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className='flex flex-col items-center p-6 min-h-screen text-black'>
      {/* 1. Header */}
      <div className='mb-6 text-center'>
        <h1 className='text-xl font-bold mt-0'>Informasi & Pertanyaan Umum</h1>
      </div>

      {/* 2. Gambar Map */}
      <div className='w-full max-w-lg mb-8 border-4 border-blue-400 rounded-lg overflow-hidden shadow-md'>
        <Image
          src='/assets/map.png'
          alt='map'
          width={400}
          height={300}
          className='w-full h-auto'
        />
      </div>

      {/* 3. Accordion Section */}
      <div className='w-full max-w-lg space-y-3'>
        {faqData.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={index}
              className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
              {/* Header Accordion */}
              <button
                onClick={() => toggleAccordion(index)}
                className='w-full flex justify-between items-center p-4 text-left focus:outline-none transition-colors hover:bg-gray-50 cursor-pointer'>
                <span className='text-sm md:text-base font-bold leading-tight pr-4'>
                  {item.question}
                </span>
                {/* Icon + / x dengan Animasi Rotasi */}
                <span
                  className={`text-xl font-mediumtransition-all duration-300 transform ${
                    isOpen ? 'text-red-500 rotate-0' : 'text-red-400'
                  }`}>
                  {isOpen ? '×' : '+'}
                </span>
              </button>

              {/* Container Jawaban dengan Animasi Smooth (Grid Trick) */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}>
                <div className='overflow-hidden'>
                  <div className='px-4 pb-4'>
                    <p className='text-xs md:text-sm text-gray-500 leading-relaxed border-t pt-3'>
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Button Kembali */}
      <div className='w-full max-w-sm mt-10 pb-10'>
        <Link
          href='/user-info'
          className='block w-full py-3 bg-rc-red text-white text-center rounded-xl font-bold shadow-md hover:bg-[#b50015] transition-all active:scale-95'>
          Kembali
        </Link>
      </div>
    </main>
  );
}
