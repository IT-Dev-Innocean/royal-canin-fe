'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/event',
    icon: 'mdi:home-outline',
    activeIcon: 'mdi:home',
    label: 'Home',
  },
  {
    href: '/event/agenda',
    icon: 'mdi:calendar-month-outline',
    activeIcon: 'mdi:calendar-month',
    label: 'Event',
  },
  {
    href: '/event/scanner',
    icon: 'mdi:qrcode-scan',
    activeIcon: 'mdi:qrcode-scan',
    label: 'Scanner',
  },
  {
    href: '/event/profile',
    icon: 'mdi:account-circle-outline',
    activeIcon: 'mdi:account-circle',
    label: 'Profile',
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white'
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className='mx-auto flex max-w-lg items-center justify-around py-1'>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-5 py-1.5 text-[11px] transition ${
                active
                  ? 'font-semibold text-rc-red'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}>
              <Icon
                icon={active ? item.activeIcon : item.icon}
                className='h-6 w-6'
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
