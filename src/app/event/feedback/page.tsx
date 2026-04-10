'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const questions = [
  { id: 'q1', label: 'Penilaian Anda untuk penyelenggaraan keseluruhan acara' },
  { id: 'q2', label: 'Penilaian Anda untuk keseluruhan sesi pembicara?' },
  {
    id: 'q3',
    label: 'Penilaian Anda untuk keseluruhan aktivitas di booth Royal Canin?',
  },
  { id: 'q4', label: 'Penilaian Anda untuk produk yang diluncurkan?' },
];

const option = ['Perlu Ditingkatkan', 'Cukup', 'Baik', 'Sangat Baik'];

export default function FeedbackPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [activitySuggestion, setActivitySuggestion] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  const handleKirim = () => {
    const isAllAnswered = questions.every((q) => answers[q.id]);

    if (isAllAnswered) {
      router.push('/event/feedback/confirmation');
    } else {
      setShowModal(true);
    }
  };

  const handleSelect = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  return (
    <main className='flex flex-col items-center p-6 min-h-screen text-black'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <h1 className='text-xl font-bold mt-0'>Formulir Tanggapan</h1>
      </div>

      <div className='w-full max-w-lg space-y-4'>
        {/* 1. Bagian Penilaian (Mapping) */}
        {questions.map((q) => (
          <div
            key={q.id}
            className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5'>
            <p className='text-sm font-bold text-left mb-3 leading-tight'>
              {q.label}
            </p>
            <div className='grid grid-cols-4 gap-2'>
              {option.map((opt) => (
                <button
                  key={opt}
                  type='button'
                  onClick={() => handleSelect(q.id, opt)}
                  className={`py-2 px-1 text-[10px] md:text-xs border rounded-lg transition-all leading-tight h-12 flex items-center justify-center text-center cursor-pointer
                    ${
                      answers[q.id] === opt
                        ? 'bg-red-600 border-red-600 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-rc-red'
                    }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 2. Textarea Aktivitas Menarik */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5'>
          <p className='text-sm font-bold text-left mb-3 leading-tight'>
            Sebutkan Aktivitas yang paling menarik perhatian anda?
          </p>
          <textarea
            value={activitySuggestion}
            onChange={(e) => setActivitySuggestion(e.target.value)}
            placeholder='Tulis Tanggapan Anda...'
            className='w-full border border-gray-100 bg-slate-50 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-red-500'
          />
        </div>

        {/* 3. Textarea Masukan Acara */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5'>
          <p className='text-sm font-bold text-left mb-3 leading-tight'>
            Berikan Masukan Anda agar acara ini bisa lebih baik ke depan?
          </p>
          <textarea
            value={improvementSuggestion}
            onChange={(e) => setImprovementSuggestion(e.target.value)}
            placeholder='Tulis Tanggapan Anda...'
            className='w-full border border-gray-100 bg-slate-50 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-red-500'
          />
        </div>

        {/* 4. Action Buttons */}
        <div className='pt-4 space-y-3'>
          <button
            onClick={handleKirim}
            disabled={Object.keys(answers).length === 0}
            className='w-full py-3 bg-rc-red text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] disabled:bg-gray-300 transition-all active:scale-95 cursor-pointer'>
            Kirim Tanggapan
          </button>
          {/* <Link
            href='/event/profile'
            className='block w-full py-3 bg-gray-200 text-gray-600 text-center rounded-xl font-bold hover:bg-gray-300 transition-all active:scale-95'>
            Kembali
          </Link> */}
        </div>
      </div>

      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeIn'>
          <div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setShowModal(false)}></div>

          <div className='relative bg-white rounded-2xl p-8 w-full max-w-[320px] text-center shadow-2xl scale-in-center'>
            <div className='w-16 h-16 bg-red-50 text-rc-red rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-bold text-gray-900 mb-2'>
              Belum Lengkap!
            </h3>
            <p className='text-xs text-gray-500 leading-relaxed mb-6'>
              Mohon pilih nilai untuk semua pertanyaan sebelum mengirim
              tanggapan.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className='w-full py-3 bg-rc-red text-white rounded-xl font-bold shadow-md active:scale-95 transition-all cursor-pointer'>
              Siap, Lengkapi
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
