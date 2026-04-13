import Link from 'next/link';
import { ScheduleMaterialDownloadButton } from '@/components/event/ScheduleMaterialDownloadButton';

type AgendaItem = {
  time: string;
  duration: string;
  title: string;
  speaker?: string;
  isItalic?: boolean;
  /** URL materi (PDF/drive). Opsional; default `#` jika tidak diisi. */
  materialUrl?: string;
};

const SEMINAR_TITLE_PREFIX = 'Sesi Seminar Bersama';

// 1. Data Agenda
const agendaData: AgendaItem[] = [
  {
    time: '08.00 - 08.45',
    duration: '45 menit',
    title: 'Registrasi & Aktivitas Booth',
  },
  {
    time: '08.45 - 08.55',
    duration: '10 menit',
    title: 'Peserta Memasuki Ruangan',
  },
  {
    time: '08.55 - 09.00',
    duration: '5 menit',
    title: 'Arahan Safety Briefing',
  },
  { time: '09.00 - 09.05', duration: '5 menit', title: 'Penampilan Pembuka' },
  { time: '09.05 - 09.10', duration: '5 menit', title: 'Pembukaan oleh MC' },
  {
    time: '09.10 - 09.20',
    duration: '10 menit',
    title: 'Sambutan oleh Asosiasi',
  },
  {
    time: '09.20 - 09.55',
    duration: '35 menit',
    title: 'Sambutan oleh Royal Canin',
  },
  {
    time: '09.55 - 10.00',
    duration: '5 menit',
    title: 'Peluncuran & Presentasi Produk',
  },
  {
    time: '10.00 - 10.05',
    duration: '5 menit',
    title: 'Ice Breaking',
    isItalic: true,
  },
  {
    time: '10.05 - 10.55',
    duration: '50 menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM)',
    materialUrl: '#',
  },
  {
    time: '10.55 - 11.00',
    duration: '5 menit',
    title: 'Ice Breaking',
    isItalic: true,
  },
  {
    time: '11.00 - 11.50',
    duration: '50 menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'Prof. drh. Deni Noviana, Ph.D., DAiCVIM',
    materialUrl: '#',
  },
  { time: '11.50 - 13.10', duration: '80 menit', title: 'ISOMA' },
  {
    time: '13.10 - 13.15',
    duration: '5 menit',
    title: 'Ice Breaking',
    isItalic: true,
  },
  {
    time: '13.15 - 14.05',
    duration: '50 menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'drh. Luh Putu Listriani Wistawan',
    materialUrl: '#',
  },
  {
    time: '14.05 - 14.10',
    duration: '5 menit',
    title: 'Ice Breaking',
    isItalic: true,
  },
  {
    time: '14.10 - 15.00',
    duration: '50 menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'drh. Iga Ismaya',
    materialUrl: '#',
  },
  {
    time: '15.00 - 15.25',
    duration: '25 menit',
    title: 'Coffee Break',
    isItalic: true,
  },
  { time: '15.25 - 16.25', duration: '60 menit', title: 'Sesi Tanya Jawab' },
  { time: '16.25 - 16.35', duration: '10 menit', title: 'Kuis Kahoot!' },
  {
    time: '16.35 - 16.50',
    duration: '15 menit',
    title: 'Sesi Foto & Pengundian Doorprize',
  },
  { time: '16.50 - 16.55', duration: '5 menit', title: 'Penutupan Acara' },
];

export default function AgendaPage() {
  return (
    <main className='flex min-h-screen flex-col items-center p-6 text-black'>
      {/* Header */}
      <div className='mb-10 text-center'>
        <h1 className='mt-0 text-xl font-bold md:text-2xl'>Agenda Acara</h1>
      </div>

      {/* Container untuk Timeline */}
      <div className='relative w-full max-w-lg px-2'>
        <div className='absolute bottom-10 left-[15px] top-2 w-[2px] bg-gray-200'></div>

        {agendaData.map((item, index) => {
          const showMaterialButton = item.title.includes(SEMINAR_TITLE_PREFIX);
          return (
            <div key={index} className='relative mb-2 w-full pl-8 md:pl-10'>
              <div className='absolute left-0 top-1 z-10 h-4 w-4 rounded-full border-4 border-white bg-rc-red shadow-sm'></div>
              <p className='mb-2 text-sm font-bold text-gray-800'>{item.time}</p>
              <div className='mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all hover:shadow-md'>
                <h3
                  className={`text-[14px] font-bold leading-tight ${item.isItalic ? 'italic text-gray-600' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                {item.speaker && (
                  <p className='mt-1 text-[12px] font-bold italic leading-snug text-rc-red'>
                    {item.speaker}
                  </p>
                )}
                <p className='mt-1 text-[11px] font-medium text-gray-400'>
                  Durasi: {item.duration}
                </p>
                {showMaterialButton ? (
                  <ScheduleMaterialDownloadButton
                    href={item.materialUrl ?? '#'}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Button Kembali */}
      <div className='mt-6 w-full max-w-md pb-20'>
        <Link
          href='/event'
          className='block w-full rounded-full bg-rc-red py-3 text-center font-bold text-white shadow-lg transition-all hover:bg-rc-red/80 active:scale-95'>
          Kembali
        </Link>
      </div>
    </main>
  );
}
