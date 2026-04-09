import Image from 'next/image';
import Link from 'next/link';

// 1. Data Agenda
const agendaData = [
  { time: "08.00 - 08.45", duration: "45 menit", title: "Registrasi & Aktivitas Booth" },
  { time: "08.45 - 08.55", duration: "10 menit", title: "Peserta Memasuki Ruangan" },
  { time: "08.55 - 09.00", duration: "5 menit", title: "Arahan Safety Briefing" },
  { time: "09.00 - 09.05", duration: "5 menit", title: "Penampilan Pembuka" },
  { time: "09.05 - 09.10", duration: "5 menit", title: "Pembukaan oleh MC" },
  { time: "09.10 - 09.20", duration: "10 menit", title: "Sambutan oleh Asosiasi" },
  { time: "09.20 - 09.55", duration: "35 menit", title: "Sambutan oleh Royal Canin" },
  { time: "09.55 - 10.00", duration: "5 menit", title: "Peluncuran & Presentasi Produk" },
  { time: "10.00 - 10.05", duration: "5 menit", title: "Ice Breaking", isItalic: true },
  { 
    time: "10.05 - 10.55", 
    duration: "50 menit", 
    title: "Sesi Seminar Bersama:", 
    speaker: "Dr. Adam J. Rudinsky, DVM, MS, DACVIM (SAIM)" 
  },
  { time: "10.55 - 11.00", duration: "5 menit", title: "Ice Breaking", isItalic: true },
  { 
    time: "11.00 - 11.50", 
    duration: "50 menit", 
    title: "Sesi Seminar Bersama:", 
    speaker: "Prof. drh. Deni Noviana, Ph.D., DAiCVIM" 
  },
  { time: "11.50 - 13.10", duration: "80 menit", title: "ISOMA" },
  { time: "13.10 - 13.15", duration: "5 menit", title: "Ice Breaking", isItalic: true },
  { 
    time: "13.15 - 14.05", 
    duration: "50 menit", 
    title: "Sesi Seminar Bersama:", 
    speaker: "drh. Luh Putu Listriani Wistawan" 
  },
  { time: "14.05 - 14.10", duration: "5 menit", title: "Ice Breaking", isItalic: true },
  { 
    time: "14.10 - 15.00", 
    duration: "50 menit", 
    title: "Sesi Seminar Bersama:", 
    speaker: "drh. Iga Ismaya" 
  },
  { time: "15.00 - 15.25", duration: "25 menit", title: "Coffee Break", isItalic: true },
  { time: "15.25 - 16.25", duration: "60 menit", title: "Sesi Tanya Jawab" },
  { time: "16.25 - 16.35", duration: "10 menit", title: "Kuis Kahoot!" },
  { time: "16.35 - 16.50", duration: "15 menit", title: "Sesi Foto & Pengundian Doorprize" },
  { time: "16.50 - 16.55", duration: "5 menit", title: "Penutupan Acara" },
];

export default function AgendaPage() {
  return (
    <main className="flex flex-col items-center p-6 bg-slate-50 min-h-screen text-black">
      {/* Header */}
      <div className="mb-10 text-center">
        <Image 
          src="/assets/rc-logo.svg" 
          alt="Logo" 
          width={120} 
          height={40} 
          className="mx-auto" 
          priority 
        />
        <h1 className="text-2xl font-bold mt-6">Agenda Acara</h1>
      </div>

      {/* Container untuk Timeline */}
      <div className="w-full max-w-md relative px-2">
        
        {/* Garis Vertikal (Penyambung Titik-titik) */}
        <div className="absolute left-[15px] top-2 bottom-10 w-[2px] bg-gray-200"></div>

        {/* List Agenda menggunakan Map */}
        {agendaData.map((item, index) => (
          <div key={index} className="relative pl-10 mb-2">
            
            {/* Titik Merah (Dot) */}
            <div className="absolute left-0 top-1 w-4 h-4 bg-[#e2001a] rounded-full z-10 border-4 border-white shadow-sm"></div>

            {/* Waktu */}
            <p className="text-sm font-bold mb-2 text-gray-800">{item.time}</p>

            {/* Card Informasi */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 border border-gray-100 mb-6 transition-all hover:shadow-md">
              <h3 className={`font-bold text-[14px] leading-tight ${item.isItalic ? 'italic text-gray-600' : 'text-gray-900'}`}>
                {item.title}
              </h3>
              
              {item.speaker && (
                <p className="text-[12px] font-bold text-[#e2001a] mt-2 leading-snug">
                  {item.speaker}
                </p>
              )}

              <p className="text-[11px] text-gray-400 mt-2 font-medium">Durasi: {item.duration}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Button Kembali */}
      <div className="w-full max-w-md mt-6 pb-20">
        <Link 
          href="/user-info" 
          className="block w-full py-3 bg-[#e2001a] text-white text-center rounded-full font-bold shadow-lg transition-all hover:bg-[#b50015] active:scale-95"
        >
          Kembali
        </Link>
      </div>
    </main>
  );
}