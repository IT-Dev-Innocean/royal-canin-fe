'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { clearAuth, getUser, isAuthenticated } from '@/lib/auth';
import type { VerifiedUserData } from '@/types/registration';

const NAV_ITEMS = [
  {
    icon: 'mdi:view-dashboard-outline',
    label: 'Overview',
    href: '/dashboard',
  },
  {
    icon: 'mdi:account-group-outline',
    label: 'Participant',
    href: '/dashboard/participants',
  },
  {
    icon: 'mdi:qrcode-scan',
    label: 'Check In',
    href: '/dashboard/check-ins',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<VerifiedUserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/dashboard/login') return;

    if (!isAuthenticated()) {
      router.replace('/dashboard/login');
      return;
    }

    const u = getUser();
    if (!u || (u.role !== 'admin' && u.role !== 'crew')) {
      clearAuth();
      router.replace('/dashboard/login');
      return;
    }

    setUser(u);
  }, [router, pathname]);

  if (pathname === '/dashboard/login') {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Icon
          icon='svg-spinners:ring-resize'
          className='h-10 w-10 text-rc-red'
        />
      </div>
    );
  }

  function handleLogout() {
    clearAuth();
    router.replace('/dashboard/login');
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 lg:w-56 flex-col bg-white border-r border-gray-200 shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Logo / brand */}
        <div className='flex h-24 items-center gap-3 border-b border-gray-100 px-5'>
          <div className='flex min-w-0 flex-1 flex-col justify-center gap-0.5'>
            <Image
              src='/assets/rc-logo.svg'
              alt='Vet Symposium 2026'
              width={420}
              height={300}
              className='h-[55px] w-[min(200px,88vw)] object-contain'
              priority
              sizes='(max-width: 420px) 88vw, 120px'
            />
            <p className='text-xs font-bold text-gray-400 uppercase tracking-wider text-center'>
              Dashboard
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className='ml-auto lg:hidden rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer'>
            <Icon icon='mdi:close' className='h-5 w-5' />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 overflow-y-auto p-3 space-y-1'>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-rc-red/10 text-rc-red'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon icon={item.icon} className='h-5 w-5 shrink-0' />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className='border-t border-gray-100 p-3'>
          <div className='flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-rc-red/10'>
              <Icon icon='mdi:account' className='h-4 w-4 text-rc-red' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-bold text-gray-800 truncate'>
                {user.fullName}
              </p>
              <p className='text-[10px] text-gray-400 uppercase tracking-wider'>
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title='Keluar'
              className='rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-rc-red cursor-pointer'>
              <Icon icon='mdi:logout' className='h-4 w-4' />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className='flex flex-1 flex-col min-w-0'>
        {/* Top bar */}
        <header className='sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 lg:px-6'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer'>
            <Icon icon='mdi:menu' className='h-5 w-5' />
          </button>

          <h1 className='text-lg font-bold text-gray-900'>
            {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? 'Dashboard'}
          </h1>

          <div className='ml-auto flex items-center gap-2'>
            <span className='hidden sm:inline-block rounded-full bg-rc-red/10 px-3 py-1 text-xs font-bold text-rc-red capitalize'>
              {user.role}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className='flex-1 p-4 lg:p-6'>{children}</main>
      </div>
    </div>
  );
}
