'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearAuth } from '@/lib/auth';

export function useAuthGuard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      clearAuth();
      router.replace('/login');
      return;
    }

    setChecked(true);
  }, [router]);

  return { authenticated: checked };
}
