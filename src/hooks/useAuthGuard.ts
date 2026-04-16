'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, logoutParticipantHard } from '@/lib/auth';

export function useAuthGuard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      logoutParticipantHard();
      return;
    }

    if (user.role === 'admin' || user.role === 'crew') {
      router.replace('/dashboard');
      return;
    }

    setChecked(true);
  }, [router]);

  return { authenticated: checked };
}
