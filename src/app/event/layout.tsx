'use client';

import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { BottomNav } from '@/components/event/BottomNav';
import { LogoEvent } from '@/components/event/LogoEvent';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated } = useAuthGuard();

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
    return () => {
      if (footer) footer.style.display = '';
    };
  }, []);

  if (!authenticated) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Icon
          icon='svg-spinners:ring-resize'
          className='h-10 w-10 text-rc-red'
        />
        <p className='text-sm text-neutral-500'>Mohon tunggu...</p>
      </div>
    );
  }

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
