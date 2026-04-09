'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const speakers = [
    {
        id: 1,
        name: "dr. Adam Rudinsky, DVM, MS, DACVIM",
        title: "Associate Professor",
        image: "/assets/speaker1.png" 
    },
    {
        id: 2,
        name: "Prof. drh. Deni Noviana, Ph.D., DAiCVIM",
        title: "Professor Diagnostic Imaging IPB",
        image: "/assets/speaker2.png"
    },
    {
        id: 3,
        name: "drh. Luh Putu Listriani Wistawan",
        title: "Senior Vet of Listriani Vet Clinic",
        image: "/assets/speaker3.png"
    },
    {
        id: 4,
        name: "drh. Iga Ismaya",
        title: "Health Affairs Manager Royal Canin",
        image: "/assets/speaker4.png"
    },
];

export default function PertanyaanPage() {
    const [selectedId, setSelectedId] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const selectedSpeaker = speakers.find(s => s.id.toString() === selectedId);

    const handleKirim = () => {
        if (selectedId && message) {
            router.push('/pertanyaan/konfirmasi');
        }
    };

    return (
        <main className="flex flex-col items-center p-6 bg-white min-h-screen text-black relative">
            {/* Header */}
            <div className="mb-6 text-center">
                <Image 
                    src="/assets/rc-logo.svg"
                    alt="Logo"
                    width={100}
                    height={40}
                    className="mx-auto" 
                />
                <h1 className="text-xl font-bold mt-6">Formulir Pertanyaan</h1>
            </div>

            <div className="w-full max-w-sm space-y-5">
                {/* Dropdown */}
                <div className="relative">
                    <label className="text-[11px] font-bold mb-1 block text-gray-700">Ditujukan Kepada Pembicara</label>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                        <span className={selectedSpeaker ? "text-black" : "text-gray-400"}>
                            {selectedSpeaker ? selectedSpeaker.name : "Pilih Nama Pembicara"}
                        </span>
                        <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isOpen && (
                        <>
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                                <ul className='max-h-60 overflow-y-auto'>
                                    {speakers.map((s) => (
                                        <li 
                                            key={s.id}
                                            onClick={() => {
                                                setSelectedId(s.id.toString());
                                                setIsOpen(false);
                                            }}
                                            className={`p-3 text-sm cursor-pointer transition-colors border-t border-gray-50
                                                ${selectedId === s.id.toString()
                                                    ? 'bg-red-600 text-white'
                                                    : 'hover:bg-[#e2001a] hover:text-white text-gray-700'
                                                }`}
                                        >
                                            {s.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Overlay untuk menutup dropdown */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                        </>
                    )}
                </div>
                
                {/* Speaker Card */}
                {selectedSpeaker && (
                    <div className="flex items-center gap-3 bg-red-100 p-3 rounded-xl border border-red-200 animate-fadeIn">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-white flex-shrink-0 relative">
                            <Image
                                src={selectedSpeaker.image}
                                alt="Speaker"
                                width={48}
                                height={48}
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-red-700 leading-tight">{selectedSpeaker.name}</p>
                            <p className="text-[10px] text-red-500">{selectedSpeaker.title}</p>
                        </div>
                    </div>
                )}

                {/* Textarea */}
                <div>
                    <label className="text-[11px] font-bold mb-1 block text-gray-700">Silahkan isi pertanyaan</label>
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={1000}
                            placeholder="Tulis pertanyaan di sini..."
                            className="w-full border border-gray-300 rounded-2xl p-4 text-sm min-h-[250px] focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <span className="absolute bottom-4 right-4 text-[10px] text-gray-400">
                            {message.length}/1000
                        </span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 space-y-3">
                    <button
                        onClick={handleKirim}
                        disabled={!selectedId || !message}
                        className="w-full py-3 bg-[#e2001a] text-white rounded-xl font-bold shadow-md hover:bg-[#b50015] disabled:bg-gray-300 transition-all active:scale-95"
                    >
                        Kirim Pertanyaan
                    </button>
                    <Link
                        href="/user-info"
                        className="block w-full py-3 bg-gray-200 text-gray-600 text-center rounded-xl font-bold hover:bg-gray-300 transition-all active:scale-95"
                    >
                        Kembali
                    </Link>
                </div>
            </div>
        </main>
    );
}