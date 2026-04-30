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

const faqEventDay = [
  {
    question:
      'Kapan materi pembicara bisa diakses oleh peserta Vet Symposium 2026?',
    answer:
      'Materi pembicara dapat diakses oleh peserta event 15 menit sebelum sesi seminar dimulai',
  },
  {
    question: 'Apakah Royal Canin Vet Symposium 2026 memiliki penilaian SKPB?',
    answer:
      'Event ini memiliki nilai SKPB sebagai berikut:\na. Peserta: 2 (dua) SKPB\nb. Narasumber: 4 (empat) SKPB\nc. Moderator: 3 (tiga) SKPB\nd. Panitia: 2 (dua) SKPB',
  },
  {
    question:
      'Kapan dan dimana saya bisa mengambil Sertifikat Vet Symposium 2026?',
    answer:
      'Sertifikat bisa diambil di meja registrasi setelah seluruh sesi seminar berakhir dengan menyebutkan nama peserta',
  },
  {
    question: 'Dimana saya bisa mengunduh Panduan Nutrisi Praktis?',
    answer:
      '1. Panduan Nutrisi Praktis dapat diunduh melalui menu "Kuis & Aktivitas"\n2. Lalu klik "Panduan Nutrisi Praktis"',
  },
  {
    question: 'Bagaimana caranya memberikan pertanyaan kepada pembicara?',
    answer:
      '1. Pertanyaan diajukan melalui menu "Pembicara & Seminar"\n2. Anda juga dapat memindai QR code di setiap meja seminar',
  },
  {
    question: 'Apa itu Score yang tertera di microsite/App Vet symposium?',
    answer:
      'a. Score adalah poin event yang bisa dikumpulkan sebagai syarat untuk memperoleh kesempatan memenangkan doorprize dan Hadiah Spesial\nb. Score bisa didapatkan dengan menyelesaikan tugas di booth, memberikan pertanyaan ke pembicara, dan mengisi tanggapan (feedback).',
  },
  {
    question: 'Berapa nilai Score pada masing-masing tugas/aktivitas?',
    answer:
      'a. Check-in Registrasi: 100 Score\nb. Gastrointestinal Fact: 200 Score\nc. Gastrointestinal Product: 300 Score\nd. Panduan Nutrisi Praktis: 200 Score\ne. Study Case Poster: 400 Score\nf. Royal Canin Club: 200 Score\ng. Pawtography: 100 Score\nh. Kirim pertanyaan: 50 Score/pertanyaan (Maksimal 200 Score)\ni. Beri tanggapan (Feedback): 100\nj. Peserta yang sudah mencapai Score 1200, namanya akan otomatis masuk ke dalam sistem doorprize\nk. 50 orang pertama yang menukar Score 1500 ke meja registrasi akan mendapatkan Hadiah Spesial',
  },
  {
    question:
      'Bagaimana jika saya sudah beraktivitas, namun Score saya tidak bertambah?',
    answer:
      'Anda dapat segera menghubungi meja registrasi untuk pengecekan lebih lanjut',
  },
  {
    question: 'Bagaimana sistem Photo Group Challenge?',
    answer: '[Poster Video Kompetisi]',
  },
  {
    question:
      'Dimana saya bisa mendapatkan bantuan bila terjadi kendala di microsite saya?',
    answer:
      'Anda dapat mengunjungi meja registrasi atau mendatangi crew terdekat untuk mendapatkan penjelasan lebih lanjut',
  },
  {
    question:
      'Kemana saya bisa menghubungi bila terjadi kendala di microsite saya?',
    answer:
      'Anda dapat menghubungi Admin Vet Symposium 2026 melalui Nomor Whatsapp 0813-1314-1546',
  },
  {
    question:
      'Bagaimana cara penukaran Royal Canin Club di event Vet Symposium 2026',
    answer: '',
  },
];

const postEventDay = [
  {
    question: 'Bagaimana sistem kompetisi video testimoni?',
    answer: '[Poster Video Kompetisi testimoni]',
  },
  {
    question: 'FAQ mengenai Royal Canin Club, If Any',
    answer: '(To Be Confirmed)',
  },
];

type FaqItem = { question: string; answer: string };

function FAQAccordionSection({
  items,
  sectionKey,
  openKey,
  toggleAccordion,
}: {
  items: FaqItem[];
  sectionKey: string;
  openKey: string | null;
  toggleAccordion: (key: string) => void;
}) {
  return (
    <>
      {items.map((item, index) => {
        const rowKey = `${sectionKey}-${index}`;
        const isOpen = openKey === rowKey;

        return (
          <div
            key={rowKey}
            className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
            <button
              onClick={() => toggleAccordion(rowKey)}
              type='button'
              className='w-full flex justify-between items-center p-4 text-left focus:outline-none transition-colors hover:bg-gray-50 cursor-pointer'>
              <span className='text-sm md:text-base font-bold leading-tight pr-4'>
                {item.question}
              </span>
              <span
                className={`text-xl font-medium transition-all duration-300 transform ${
                  isOpen ? 'text-red-500 rotate-0' : 'text-red-400'
                }`}>
                {isOpen ? '×' : '+'}
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}>
              <div className='overflow-hidden'>
                <div className='px-4 pb-4'>
                  <p className='text-xs md:text-sm text-gray-500 leading-relaxed border-t pt-3 whitespace-pre-line'>
                    {item.answer.trim() === '' ? '—' : item.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggleAccordion = (key: string) => {
    setOpenKey(openKey === key ? null : key);
  };

  return (
    <main className='flex flex-col items-center p-6 min-h-screen text-black'>
      <div className='mb-6 text-center'>
        <h1 className='text-xl font-bold mt-0'>Informasi & Pertanyaan Umum</h1>
      </div>
      <div className='w-full max-w-lg mb-8 border-4 border-rc-red rounded-lg overflow-hidden shadow-md'>
        <Image
          src='/assets/map.png'
          alt='map'
          width={400}
          height={300}
          className='w-full h-auto'
        />
      </div>

      <div className='w-full max-w-lg space-y-3'>
        {/* <FAQAccordionSection
          items={faqData}
          sectionKey='general'
          openKey={openKey}
          toggleAccordion={toggleAccordion}
        /> */}

        <h2 className='text-lg font-bold pt-6 pb-1 text-center'>Event Day</h2>
        <FAQAccordionSection
          items={faqEventDay}
          sectionKey='eventDay'
          openKey={openKey}
          toggleAccordion={toggleAccordion}
        />

        <h2 className='text-lg font-bold pt-6 pb-1 text-center'>
          Post Event Day
        </h2>
        <FAQAccordionSection
          items={postEventDay}
          sectionKey='postEventDay'
          openKey={openKey}
          toggleAccordion={toggleAccordion}
        />
      </div>

      <div className='w-full max-w-sm mt-10 pb-10'>
        <Link
          href='/event'
          className='block w-full py-3 bg-rc-red text-white text-center rounded-xl font-bold shadow-md hover:bg-[#b50015] transition-all active:scale-95'>
          Kembali
        </Link>
      </div>
    </main>
  );
}
