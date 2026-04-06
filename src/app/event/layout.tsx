'use client';

import { useEffect } from 'react';
import { BottomNav } from '@/components/event/BottomNav';

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
      <div className='min-h-screen bg-white pb-20'>{children}</div>
      <BottomNav />
    </>
  );
}
