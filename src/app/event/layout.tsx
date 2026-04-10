'use client';

import { useEffect } from 'react';
import { BottomNav } from '@/components/event/BottomNav';
import { LogoEvent } from '@/components/event/LogoEvent';

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
    return () => {
      if (footer) footer.style.display = '';
    };
  }, []);

  return (
    <>
      <header className='sticky top-0 z-20 bg-white/95 px-4 py-5 backdrop-blur supports-backdrop-filter:bg-white/80'>
        <LogoEvent className='mb-0' />
      </header>
      <div className='min-h-screen bg-white pb-20'>{children}</div>
      <BottomNav />
    </>
  );
}
