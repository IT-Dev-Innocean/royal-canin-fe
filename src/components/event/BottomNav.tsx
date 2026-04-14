'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EVENT_MENU_FEATURES_OPEN_AT } from '@/lib/eventMenuFeaturesOpenAt';

/** Schedule & Activity — sama jam buka dengan menu terkait di beranda. */
const GATED_BOTTOM_NAV_HREFS = new Set([
  '/event/schedule',
  '/event/information',
]);

const NAV_ITEMS = [
  {
    href: '/event',
    icon: 'mdi:home-outline',
    activeIcon: 'mdi:home',
    label: 'Home',
  },
  {
    href: '/event/schedule',
    icon: 'mdi:calendar-month-outline',
    activeIcon: 'mdi:calendar-month',
    label: 'Schedule',
  },
  {
    href: '/event/information',
    icon: 'mynaui:activity-square',
    activeIcon: 'mynaui:activity-square',
    label: 'Activity',
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
  const [gatedNavOpen, setGatedNavOpen] = useState(
    () => Date.now() >= EVENT_MENU_FEATURES_OPEN_AT.getTime()
  );

  useEffect(() => {
    if (gatedNavOpen) return;
    const ms = EVENT_MENU_FEATURES_OPEN_AT.getTime() - Date.now();
    if (ms <= 0) {
      setGatedNavOpen(true);
      return;
    }
    const id = window.setTimeout(() => setGatedNavOpen(true), ms);
    return () => window.clearTimeout(id);
  }, [gatedNavOpen]);

  return (
    <nav
      className='fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white'
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className='mx-auto flex max-w-lg items-center justify-around py-1'>
        {NAV_ITEMS.map((item) => {
          const gatedLocked =
            GATED_BOTTOM_NAV_HREFS.has(item.href) && !gatedNavOpen;
          const active = pathname === item.href && !gatedLocked;

          if (gatedLocked) {
            return (
              <div
                key={item.href}
                className='flex cursor-not-allowed flex-col items-center gap-0.5 rounded-lg px-5 py-1.5 text-[11px] text-neutral-300'
                aria-disabled='true'
                title='Schedule & Activity terbuka 4 Mei 2026 pukul 23.00 WIB'>
                <Icon icon={item.icon} className='h-6 w-6 opacity-60' />
                <span>{item.label}</span>
              </div>
            );
          }

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
