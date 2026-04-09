'use client';

import Image from "next/image";
import Link from 'next/link';

export default function konfrimasiPertanyaanPage() {
    return(
        <main className="flex flex-col items-center p-6 bg-white min-h-screen text-black text-center">
            <div className="mt-4 mb-16">
                <Image 
                    src="/assets/rc-logo.svg"
                    alt="logo"
                    width={100}
                    height={40}
                    className="mx-auto" 
                />
            </div>

            <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 bg-[#e2001a] rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-14 w-14 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            <h1 className="text-xl font-bold mb-4">Pertanyaan Berhasil Dikirim</h1>

            <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-8 w-full max-w-sm">
                <p className="text-[11px] text-gray-600 leading-relaxed">
                    Pertanyaan Anda telah dikirimkan untuk dikurasi oleh admin kami.
                </p>
                <p className="text-[11px] text-gray-600 leading-relaxed mt-4">
                    Pertanyaan yang lolos proses kurasi akan langsung dijawab oleh para pembicara di Sesi Tanya Jawab.
                </p>
            </div>

            <div className="bg-[#e2001a] text-white rounded-xl p-4 w-full max-full max-w-sm mb-4 shadow-md">
                <p className="text-sm font-bold">+200 Poin Ditambahkan</p>
                <p className="text-[10px] opacity-90 mt-1">Terima Kasih telah berpartisipasi aktif dalam sesi ini.</p>
            </div>

            <p className="text-[10px] text-gray-400 mb-20 px-10 leading-snug">
                Anda sudah mengirimkan 4 dari 4 pertanyaan <br />
                Maksimal 4 pertanyaan yang mendapatkan poin.            
            </p> 

            <div className="w-full max-w-sm mt-auto pb-10">
                <Link
                    href="/user-info"
                    className="block w-full py-3 bg-[#e2001a] text-white trext-center rounded-xl font-bold shadow-md hover:bg-[#b50015] transition-all active:scale-95"
                >
                    Kembali ke Menu
                </Link>
            </div>
        </main>
    )
}