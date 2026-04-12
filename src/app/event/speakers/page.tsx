'use client';

import { useState } from 'react';
import Image from 'next/image';

const speakersData = [
  {
    id: 1,
    name: 'Prof. drh. Deni Noviana, Ph.D., DAiCVIM',
    title:
      'Professor Diagnostic Imaging IPB University & Diplomate in Asian College of Vet. Internal Medicine',
    topic:
      'Diagnostic Imaging of Gastrointestinal Disorders in Cats and Dogs Focus on Fibre-Related and Common Clinical Conditions',
    image: '/assets/speaker-deni.webp',
  },
  {
    id: 2,
    name: 'dr. Adam Rudinsky, DVM, MS, DACVIM',
    title:
      'Associate Professor, Small Animal Internal Medicine Veterinary Medical Center, The Ohio State University',
    topic: 'Fibre Forward: Unlocking The Power of Fibre in Managing GI Health',
    image: '/assets/speaker-adam.webp',
  },
  {
    id: 3,
    name: 'drh. Luh Putu Listriani Wistawan',
    title: 'Senior Vet of Listriani Vet Clinic & Semer Vet Clinic Bali',
    topic: 'Clinical Case Study and Practical Approach in Daily Practice',
    image: '/assets/speaker-luh-putu.webp',
  },
  {
    id: 4,
    name: 'drh. Iga Ismaya',
    title: 'Health Affairs Manager PT Royal Canin Indonesia',
    topic: 'Nutritional Management Strategy for Gastrointestinal Health',
    image: '/assets/speaker-iga.webp',
  },
];

export default function PembicaraPage() {
  const [selectedSpeaker, setSelectedSpeaker] = useState<
    (typeof speakersData)[0] | null
  >(null);

  return (
    <main className='flex flex-col items-center p-4 pb-20 min-h-screen text-black relative'>
      {/* Header */}
      <div className='mb-6 text-center'>
        <h1 className='text-xl font-bold mt-0'>Daftar Pembicara</h1>
        <p className='text-xs text-gray-500 mt-1'>
          Klik profil untuk melihat detail
        </p>
      </div>

      <div className='w-full max-w-lg space-y-4'>
        {speakersData.map((speaker) => (
          <div
            key={speaker.id}
            onClick={() => setSelectedSpeaker(speaker)}
            className='bg-white rounded-r-2xl rounded-l-lg shadow-sm border border-gray-100 p-4 relative cursor-pointer hover:shadow-md active:scale-[0.98] transition-all group'>
            <div className='absolute top-0 left-0 w-1 h-full bg-rc-red rounded-l-[20px]'></div>

            <div className='flex items-center gap-4 pl-2'>
              <div className='w-16 h-16 rounded-full overflow-hidden bg-red-50 border-2 border-white shadow-sm shrink-0 relative'>
                <Image
                  src={speaker.image}
                  alt={speaker.name}
                  fill
                  className='object-cover'
                />
              </div>

              <div className='flex-1'>
                <h2 className='text-[13px] md:text-sm font-bold text-rc-red leading-tight mb-1'>
                  {speaker.name}
                </h2>
                <p className='text-[11px] md:text-xs text-gray-500 line-clamp-2 leading-relaxed'>
                  {speaker.title}
                </p>
              </div>
            </div>

            <div className='mt-5 flex items-center justify-center md:justify-end'>
              <button className='w-full md:w-[35%] py-3 bg-rc-red text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#b50015] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer'>
                Lihat Profil
              </button>
              {/* <button className='cursor-pointer flex items-center justify-center gap-2 w-full py-3 bg-white text-rc-red text-center text-sm rounded-2xl font-bold border-2 border-rc-red shadow-sm transition-all duration-300 ease-out hover:bg-red-50 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:scale-[0.98]'>
                Lihat Profil
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {selectedSpeaker && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-3 md:p-0 animate-fadeIn'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setSelectedSpeaker(null)}></div>

          <div className='relative bg-white rounded-3xl w-full max-w-[340px] md:max-w-lg shadow-2xl scale-in-center overflow-hidden flex flex-col max-h-[90vh]'>
            <button
              onClick={() => setSelectedSpeaker(null)}
              className='absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-10 cursor-pointer'>
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>

            <div className='py-6 px-4 md:px-6 overflow-y-auto'>
              <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-red-100 shadow-md mx-auto mb-4 relative'>
                <Image
                  src={selectedSpeaker.image}
                  alt={selectedSpeaker.name}
                  fill
                  className='object-cover'
                />
              </div>

              <div className='text-center mb-6'>
                <h3 className='text-base font-bold text-rc-red mb-2'>
                  {selectedSpeaker.name}
                </h3>
                <p className='text-[11px] md:text-xs text-gray-600 leading-relaxed'>
                  {selectedSpeaker.title}
                </p>
              </div>

              <div className='bg-red-50/50 rounded-2xl p-4 border border-red-100 mb-6'>
                <p className='text-[11px] md:text-xs font-bold text-rc-red uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                  <svg
                    className='w-3 h-3'
                    fill='currentColor'
                    viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Topik Pembahasan
                </p>
                <p className='text-xs md:text-sm font-medium text-gray-800 leading-relaxed'>
                  {selectedSpeaker.topic}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
