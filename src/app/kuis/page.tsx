'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ViewState = 'intro' | 'scan-q' | 'question' | 'scan-a';

export default function KuisPage() {
    const [view, setView] = useState<ViewState>('intro');
    const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);

    const handleCekJawaban = () => {
        const isCorrect = Math.random() > 0.5; 
        setShowResult(isCorrect ? 'correct' : 'wrong');
    };

    const FooterText = () => (
        <div className="mt-8 text-center px-6 mb-6">
            <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                Kumpulkan minimal <span className="font-bold text-[#e2001a]">1000 Poin</span> agar nama Anda ikut disertakan dalam pengundian Doorprize.
            </p>
            <p className="text-[10px] font-bold text-gray-800 leading-relaxed">
                Dapatkan bingkisan khusus* di meja registrasi bagi yang berhasil mengumpulkan minimal <span className="text-[#e2001a]">2000 Poin</span>.
            </p>
            <p className="text-[9px] text-gray-400 mt-1">(*Hanya untuk 50 penukar pertama)</p>
        </div>
    );

    return (
        <main className="flex flex-col items-center p-6 bg-slate-50 min-h-screen text-black relative">
            <div className="mb-6 text-center w-full max-w-sm pt-2">
                <Image src="/assets/rc-logo.svg" alt="Logo" width={100} height={40} className="mx-auto" />
                <h1 className="text-lg font-bold mt-5 text-gray-900">Kuis & Permainan</h1>
            </div>

            {view === 'intro' && (
                <div className="w-full max-w-sm flex flex-col flex-1 animate-fadeIn">
                    <div className="text-center mb-6">
                        <p className="text-sm font-medium">Halo,</p>
                        <p className="font-bold text-[15px] text-[#e2001a]">drh. Angga Wirantoko Hadi Saputro</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center mb-4">
                        <p className="text-[11px] text-gray-700 leading-relaxed mb-4">
                            Kunjungi semua booth selama acara berlangsung dan ikuti setiap kuis dengan memindai QR pertanyaan untuk mengumpulkan Poin.
                        </p>
                        <p className="text-[11px] font-bold text-gray-900 leading-relaxed">
                            Total Poin yang berhasil dikumpulkan akan terakumulasi di halaman profil Anda.
                        </p>
                    </div>

                    <FooterText />

                    <div className="mt-auto space-y-3 pb-8">
                        <button onClick={() => setView('scan-q')} className="w-full py-3.5 bg-[#e2001a] text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] active:scale-95 transition-all">
                            Pindai QR
                        </button>
                        <Link href="/user-info" className="block w-full py-3.5 bg-gray-200 text-gray-600 text-center rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all">
                            Kembali
                        </Link>
                    </div>
                </div>
            )}

            {view === 'scan-q' && (
                <div className="w-full max-w-sm flex flex-col flex-1 animate-fadeIn">
                    <p className="text-[12px] text-center text-gray-600 mb-8 px-4 leading-relaxed">
                        Arahkan kamera Anda untuk memindai QR Code untuk menampilkan kuis / tugas yang harus diselesaikan:
                    </p>

                    <div className="w-64 h-64 bg-black mx-auto rounded-xl border-2 border-red-500 shadow-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(226,0,26,0.8)] animate-scan"></div>
                    </div>

                    <FooterText />

                    <div className="mt-auto space-y-3 pb-8">
                        <button onClick={() => setView('question')} className="w-full py-3.5 bg-[#e2001a] text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] active:scale-95 transition-all">
                            Buka Tautan
                        </button>
                        <button onClick={() => setView('intro')} className="w-full py-3.5 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all">
                            Kembali
                        </button>
                    </div>
                </div>
            )}

            {view === 'question' && (
                <div className="w-full max-w-sm flex flex-col flex-1 animate-fadeIn">
                    <div className="text-center mb-6">
                        <p className="text-sm font-medium">Halo,</p>
                        <p className="font-bold text-[15px] text-[#e2001a]">drh. Angga Wirantoko Hadi Saputro</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center mb-4">
                        <p className="text-[12px] text-gray-800 leading-relaxed">
                            Pasien anjing Anda didiagnosis menderita pankreatitis akut dan membutuhkan diet untuk mengistirahatkan pankreasnya. Pasien ini juga memiliki riwayat hiperlipidemia primer. Varian diet Royal Canin mana yang paling mutlak diresepkan?
                        </p>
                    </div>

                    <div className="bg-[#e2001a] rounded-xl p-5 text-center text-white shadow-md">
                        <p className="text-[11px] font-black tracking-widest mb-2 border-b border-white/20 pb-2 inline-block">PETUNJUK:</p>
                        <p className="text-[10px] leading-relaxed mb-3">
                            Kunjungi booth terkait di area pameran untuk menemukan jawaban yang sesuai.
                        </p>
                        <p className="text-[10px] leading-relaxed opacity-90">
                            Klik tombol <b>JAWAB</b> dan pindai QR Code yang ditempatkan di dekat item sebagai jawaban kuis.
                        </p>
                    </div>

                    <FooterText />

                    <div className="mt-auto space-y-3 pb-8">
                        <button onClick={() => setView('scan-a')} className="w-full py-3.5 bg-[#e2001a] text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] active:scale-95 transition-all">
                            Jawab
                        </button>
                        <button onClick={() => setView('intro')} className="w-full py-3.5 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all">
                            Kembali
                        </button>
                    </div>
                </div>
            )}

            {view === 'scan-a' && (
                <div className="w-full max-w-sm flex flex-col flex-1 animate-fadeIn">
                    <p className="text-[12px] text-center text-gray-600 mb-8 px-4 leading-relaxed">
                        Arahkan kamera Anda untuk memindai QR Code jawaban kuis:
                    </p>

                    <div className="w-64 h-64 bg-white mx-auto rounded-xl border-2 border-red-500 shadow-2xl relative overflow-hidden flex items-center justify-center p-4">
                        <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h-3v2h3v-2zm-3 4h-2v4h2v-4zm2 2h3v2h-3v-2zm-4-4h2v2h-2v-2zm4-2h2v2h-2v-2z"/>
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(226,0,26,0.8)] animate-scan"></div>
                    </div>

                    <FooterText />

                    <div className="mt-auto space-y-3 pb-8 relative z-10">
                        <button onClick={handleCekJawaban} className="w-full py-3.5 bg-[#e2001a] text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] active:scale-95 transition-all">
                            Buka Tautan
                        </button>
                        <button onClick={() => setView('question')} className="w-full py-3.5 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all">
                            Kembali
                        </button>
                    </div>

                    {showResult && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResult(null)}></div>
                            
                            <div className="relative bg-white rounded-[32px] p-8 w-full max-w-[280px] text-center shadow-2xl scale-in-center overflow-hidden">
                                
                                {showResult === 'wrong' ? (
                                    <>
                                        <div className="w-16 h-16 bg-red-50 text-[#e2001a] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 relative">
                                            <div className="absolute inset-1 rounded-full border border-red-100"></div>
                                            <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Hampir Benar!</h3>
                                        
                                        <p className="text-[11px] text-gray-500 leading-relaxed mb-6 px-1">
                                            QR ini bukan jawaban yang sesuai untuk kuis ini.<br/>Yuk, cari petunjuk di booth lain!
                                        </p>
                                        
                                        <button 
                                            onClick={() => setShowResult(null)} 
                                            className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
                                        >
                                            Coba Scan Ulang
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 relative">
                                            <div className="absolute inset-1 rounded-full border border-green-100"></div>
                                            <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">Jawaban Benar!</h3>
                                            
                                            <div className="bg-red-50 text-[#e2001a] rounded-xl p-4 font-black text-3xl mb-1 inline-block min-w-[120px]">
                                                +100
                                            </div>
                                            <p className="text-[10px] text-red-400">Poin ditambahkan ke profil Anda</p>
                                        </div>

                                        <Link 
                                            href="/user-info" 
                                            className="block w-full py-3 bg-[#e2001a] text-white rounded-xl text-xs font-bold shadow-lg shadow-red-100 hover:bg-[#b50015] active:scale-95 transition-all"
                                        >
                                            Cek Total Poin
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}