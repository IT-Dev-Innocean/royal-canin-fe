'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function UserInfoPage() {
  return (
    <main className="relative flex flex-col items-center p-6 min-h-screen text-black overflow-hidden bg-slate-50">
      
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-red-50 to-slate-50 -z-10 rounded-b-[40px]"></div>
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-60 -z-10"></div>
      
      {/* 1. Header & Logo */}
      <div className="mb-6 text-center mt-2 relative z-10">
        <Image 
          src="/assets/rc-logo.svg" 
          alt="Logo Royal Canin" 
          width={130} 
          height={45} 
          priority 
          className="mx-auto"
        />
        <h1 className="text-xl font-black mt-5 text-gray-800 tracking-tight">Profil Peserta</h1>
      </div>

      <div className="w-full max-w-sm relative z-10 mt-8">
        <div className="absolute -top-6 inset-x-6 bg-gradient-to-r from-[#e2001a] to-[#b50015] rounded-2xl p-4 text-white shadow-lg shadow-red-200 z-20 flex justify-between items-center border border-red-400/30">
           <div>
             <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider mb-0.5">Total Poin Anda</p>
             <p className="text-2xl font-black tracking-tight leading-none">1,000</p>
           </div>
           <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-7 pt-16 w-full relative z-10">
          
          <div className="text-center mb-6 mt-4">
            <p className="text-[11px] text-gray-500 mb-1">Nama Peserta</p>
            <p className="font-bold text-lg leading-tight text-gray-900">drh. Angga Wirantoko Hadi Saputro</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#e2001a] shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400">Email</p>
                <p className="text-xs font-semibold text-gray-800">angga@hotline-jago.com</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#e2001a] shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400">No. Telepon</p>
                <p className="text-xs font-semibold text-gray-800">0812 3456 7890</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-medium text-gray-400 mb-0.5">Klinik</p>
                <p className="text-[11px] font-bold text-gray-800 line-clamp-1">Klinik Hewan Jago</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-medium text-gray-400 mb-0.5">NIO</p>
                <p className="text-[11px] font-bold text-gray-800">12345678</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-sm flex flex-col items-center relative z-10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          Pindai QR saat Registrasi
        </p>
        
        <div className="relative bg-white p-4 rounded-3xl border-2 border-red-50">
           <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#e2001a] rounded-tl-3xl -translate-x-1 -translate-y-1"></div>
           <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#e2001a] rounded-tr-3xl translate-x-1 -translate-y-1"></div>
           <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#e2001a] rounded-bl-3xl -translate-x-1 translate-y-1"></div>
           <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#e2001a] rounded-br-3xl translate-x-1 translate-y-1"></div>

           <div className="w-40 h-40 bg-gray-50 flex items-center justify-center rounded-2xl border border-dashed border-gray-200">
              <span className="text-[10px] text-gray-400 font-mono tracking-widest">[QR CODE]</span>
           </div>
        </div>

        <p className="mt-5 text-[11px] text-gray-500 font-medium text-center max-w-[220px] leading-relaxed">
          Kumpulkan poin dengan mengunjungi booth dan mengikuti sesi interaktif.
        </p>
      </div>

      <div className="w-full max-w-sm mt-auto pt-10 pb-6 space-y-3 relative z-10">
        <Link 
            href="/" 
            className="block w-full py-4 bg-[#e2001a] text-white text-center rounded-2xl font-bold shadow-lg shadow-red-200 
                    transition-all duration-300 ease-out hover:bg-[#b50015] hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
        >
            Kembali ke Beranda
        </Link>
        <button 
            className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold shadow-sm
                    transition-all duration-200 hover:bg-gray-50 hover:text-red-600 active:scale-[0.98]"
        >
            Keluar Akun
        </button>
      </div>
    </main>
  );
}