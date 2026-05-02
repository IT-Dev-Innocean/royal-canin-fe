import Link from 'next/link';
import { ScheduleMaterialDownloadButton } from '@/components/event/ScheduleMaterialDownloadButton';

type AgendaItem = {
  time: string;
  duration: string;
  title: string;
  subtitle?: string;
  noticeText?: string;
  speaker?: string;
  theme?: string;
  isItalic?: boolean;
  materialUrl?: string;
};

const agendaData: AgendaItem[] = [
  {
    time: '08.00 - 08.35',
    duration: '35 Menit',
    title: 'Registrasi Peserta',
    subtitle: 'Aktivitas Booth & Networking',
  },
  {
    time: '08.35 - 09.20',
    duration: '45 Menit',
    title: 'Pembukaan Acara',
  },
  {
    time: '09.20 - 09.55',
    duration: '35 Menit',
    title: 'Peluncuran & Presentasi Produk',
    materialUrl: '/assets/pdf/Panduan-Nutrisi-Praktis.pdf',
  },
  {
    time: '09.55 - 10.20',
    duration: '25 Menit',
    title: 'Coffee Break',
    subtitle: 'Aktivitas Booth & Networking',
    noticeText:
      'Kesempatan Anda untuk mengunjungi booth dan mendapatkan Score!',
  },
  {
    time: '10.20 - 11.20',
    duration: '60 Menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM)',
    theme: 'Fibre Forward: Unlocking The Power of Fibre in Managing GI Health',
    materialUrl: '/assets/pdf/Fibre-Forward.pdf',
  },
  {
    time: '11.20 - 12.20',
    duration: '60 Menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM)',
    theme:
      'Dietary Fiber Aids in The Management of Cat and Dog Gastrointestinal Disease',
    materialUrl: '/assets/pdf/Dietary-Fiber.pdf',
  },
  {
    time: '12.20 - 13.40',
    duration: '80 Menit',
    title: 'Makan Siang',
    subtitle: 'Aktivitas Booth & Networking',
    noticeText:
      'Kesempatan Anda untuk mengunjungi booth dan menambahkan Score!',
  },
  {
    time: '13.40 - 14.40',
    duration: '60 Menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'Prof. drh. Deni Noviana, Ph.D., DAiCVIM',
    theme:
      'Diagnostic Imaging of Gastrointestinal Disorders in Cats and Dogs: Focus on Fibre-Related and Common Clinical Conditions',
    materialUrl: '/assets/pdf/Diagnostic-Imaging.pdf',
  },
  {
    time: '14.40 - 15.40',
    duration: '60 Menit',
    title: 'Sesi Seminar Bersama:',
    speaker: 'drh. Luh Putu Listriani Wistawan',
    theme:
      'From Diagnosis to Therapy: Case-Based Insights and Nutritional Guidance for Fibre-Related GI Problems',
    materialUrl: '/assets/pdf/From-Diagnosis-to-Therapy.pdf',
  },
  {
    time: '15.40 - 16.05',
    duration: '25 Menit',
    title: 'Coffee Break',
    subtitle: 'Aktivitas Booth & Networking',
    noticeText:
      'Kesempatan terakhir Anda untuk mengunjungi booth dan mendapatkan Score sebelum sesi doorprize dimulai!',
  },
  {
    time: '16.05 - 17.05',
    duration: '60 Menit',
    title: 'Sesi Tanya Jawab',
  },
  {
    time: '17.05 - 17.25',
    duration: '20 Menit',
    title: 'Kuis, Feedback & Doorprize',
  },
  {
    time: '17.25 - 17.35',
    duration: '10 Menit',
    title: 'Foto Bersama',
  },
  {
    time: '17.35',
    duration: '',
    title: 'Penutupan Acara',
  },
];

export default function AgendaPage() {
  return (
    <main className='flex min-h-screen flex-col items-center p-6 text-black'>
      <div className='mb-10 text-center'>
        <h1 className='mt-0 text-xl font-bold md:text-2xl'>Agenda Acara</h1>
      </div>

      <div className='relative w-full max-w-lg px-2'>
        <div className='absolute bottom-10 left-[15px] top-2 w-[2px] bg-gray-200'></div>

        {agendaData.map((item, index) => {
          const showMaterialButton = Boolean(item.materialUrl?.trim());

          return (
            <div key={index} className='relative mb-2 w-full pl-8 md:pl-10'>
              <div className='absolute left-0 top-1 z-10 h-4 w-4 rounded-full border-4 border-white bg-rc-red shadow-sm'></div>
              <p className='mb-2 text-sm font-bold text-gray-800'>
                {item.time}
              </p>
              <div className='mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all hover:shadow-md'>
                <h3
                  className={`text-sm font-bold leading-tight ${item.isItalic ? 'italic text-gray-600' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                {item.subtitle ? (
                  <p className='mt-1 text-xs italic leading-snug text-gray-500'>
                    {item.subtitle}
                  </p>
                ) : null}
                {item.noticeText?.trim() ? (
                  <p className='mt-1.5 text-xs leading-relaxed text-amber-950 mb-1.5 p-2 bg-yellow-50 rounded-lg'>
                    {item.noticeText.trim()}
                  </p>
                ) : null}
                {item.speaker ? (
                  <p className='mt-1 text-sm font-bold italic leading-snug text-rc-red'>
                    {item.speaker}
                  </p>
                ) : null}
                {item.theme ? (
                  <p className='mt-1.5 text-xs italic leading-snug text-gray-700'>
                    <span className='font-semibold not-italic text-gray-800'>
                      Tema:{' '}
                    </span>
                    {item.theme}
                  </p>
                ) : null}
                {item.duration ? (
                  <p className='mt-1 text-[11px] font-medium text-gray-400'>
                    Durasi: {item.duration}
                  </p>
                ) : null}
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
