'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const speakersData = [
    {
        id: 1,
        name: "Prof. drh. Deni Noviana, Ph.D., DAiCVIM",
        title: "Professor Diagnostic Imaging IPB University & Diplomate in Asian College of Vet. Internal Medicine",
        topic: "Diagnostic Imaging of Gastrointestinal Disorders in Cats and Dogs Focus on Fibre-Related and Common Clinical Conditions",
        image: "/assets/speaker2.png"
    },
    {
        id: 2,
        name: "dr. Adam Rudinsky, DVM, MS, DACVIM",
        title: "Associate Professor, Small Animal Internal Medicine Veterinary Medical Center, The Ohio State University",
        topic: "Fibre Forward: Unlocking The Power of Fibre in Managing GI Health",
        image: "/assets/speaker1.png"
    },
    {
        id: 3,
        name: "drh. Luh Putu Listriani Wistawan",
        title: "Senior Vet of Listriani Vet Clinic & Semer Vet Clinic Bali",
        topic: "Clinical Case Study and Practical Approach in Daily Practice",
        image: "/assets/speaker3.png"
    },
    {
        id: 4,
        name: "drh. Iga Ismaya",
        title: "Health Affairs Manager PT Royal Canin Indonesia",
        topic: "Nutritional Management Strategy for Gastrointestinal Health",
        image: "/assets/speaker4.png"
    }
];

export default function PembicaraPage() {
    const [selectedSpeaker, setSelectedSpeaker] = useState<typeof speakersData[0] | null>(null);

    return (
        <main className="flex flex-col items-center p-6 bg-slate-50 min-h-screen text-black relative pb-28">
            {/* Header */}
            <div className="mb-6 text-center">
                <Image 
                    src="/assets/rc-logo.svg"
                    alt="Logo Royal Canin"
                    width={100}
                    height={40}
                    className="mx-auto"
                />
                <h1 className="text-xl font-bold mt-6">Daftar Pembicara</h1>
                <p className="text-xs text-gray-500 mt-1">Klik profil untuk melihat detail</p>
            </div>

            <div className="w-full max-w-sm space-y-4">
                {speakersData.map((speaker) => (
                    <div 
                        key={speaker.id} 
                        onClick={() => setSelectedSpeaker(speaker)}
                        className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 relative cursor-pointer hover:shadow-md active:scale-[0.98] transition-all group"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#e2001a] rounded-l-[20px]"></div>

                        <div className="flex items-center gap-4 pl-2">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-red-50 border-2 border-white shadow-sm flex-shrink-0 relative">
                                <Image src={speaker.image} alt={speaker.name} fill className="object-cover" />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-[12px] font-bold text-[#e2001a] leading-tight mb-1 line-clamp-1">
                                    {speaker.name}
                                </h2>
                                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                    {speaker.title}
                                </p>
                            </div>

                            <div className="text-gray-300 group-hover:text-red-500 transition-colors pr-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 via-slate-50 to-transparent p-6 flex justify-center z-10">
                <div className="w-full max-w-sm">
                    <Link  
                        href="/user-info"
                        className="block w-full py-4 bg-gray-200 text-gray-700 text-center rounded-2xl font-bold hover:bg-gray-300 transition-all active:scale-95 shadow-sm"
                    >
                        Kembali ke Menu
                    </Link>
                </div>
            </div>

            {selectedSpeaker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={() => setSelectedSpeaker(null)}
                    ></div>
                    
                    <div className="relative bg-white rounded-[32px] w-full max-w-[320px] shadow-2xl scale-in-center overflow-hidden flex flex-col max-h-[85vh]">
                        
                        <button 
                            onClick={() => setSelectedSpeaker(null)}
                            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors z-10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-6 overflow-y-auto">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-red-50 border-4 border-red-100 shadow-md mx-auto mb-4 relative">
                                <Image src={selectedSpeaker.image} alt={selectedSpeaker.name} fill className="object-cover" />
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-[15px] font-bold text-[#e2001a] mb-2">{selectedSpeaker.name}</h3>
                                <p className="text-[11px] text-gray-600 leading-relaxed">{selectedSpeaker.title}</p>
                            </div>

                            <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 mb-6">
                                <p className="text-[10px] font-bold text-[#e2001a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Topik Pembahasan
                                </p>
                                <p className="text-[12px] font-medium text-gray-800 leading-relaxed">
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