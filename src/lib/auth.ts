import type { VerifiedUserData } from '@/types/registration';

/** Awalan semua key auth app ini — dipakai untuk sapu localStorage dari sisa key usang. */
export const AUTH_STORAGE_PREFIX = 'vet_sym_2026';

/* ─── Participant (event) ─── */

const TOKEN_KEY = `${AUTH_STORAGE_PREFIX}_token`;
const USER_KEY = `${AUTH_STORAGE_PREFIX}_user`;

function forceRemoveLocalStorageKeys(keys: readonly string[]) {
  if (typeof window === 'undefined') return;
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* mode private / quota */
    }
  }
  for (const key of keys) {
    try {
      if (localStorage.getItem(key) != null) {
        localStorage.setItem(key, '');
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  }
}

/**
 * Hapus semua entri localStorage yang diawali awalan app (participant + admin).
 * Berguna jika ada state korup / key nyangkut; tidak dipanggil otomatis saat logout biasa
 * agar sesi peserta dan admin tetap bisa dipisah di satu browser.
 */
export function purgeAllRoyalCaninAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    const prefix = `${AUTH_STORAGE_PREFIX}_`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k != null && k.startsWith(prefix)) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): VerifiedUserData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VerifiedUserData;
  } catch {
    return null;
  }
}

export function saveAuth(user: VerifiedUserData, token?: string | null) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuth() {
  forceRemoveLocalStorageKeys([TOKEN_KEY, USER_KEY]);
}

export function isAuthenticated(): boolean {
  return !!getUser();
}

/* ─── Admin / Crew (dashboard) ─── */

const ADMIN_TOKEN_KEY = `${AUTH_STORAGE_PREFIX}_admin_token`;
const ADMIN_USER_KEY = `${AUTH_STORAGE_PREFIX}_admin_user`;

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminUser(): VerifiedUserData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VerifiedUserData;
  } catch {
    return null;
  }
}

export function saveAdminAuth(user: VerifiedUserData, token?: string | null) {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export function clearAdminAuth() {
  forceRemoveLocalStorageKeys([ADMIN_TOKEN_KEY, ADMIN_USER_KEY]);
}

export function isAdminAuthenticated(): boolean {
  const u = getAdminUser();
  return !!u && (u.role === 'admin' || u.role === 'crew');
}

/** Logout peserta: bersihkan storage + navigasi penuh (hindari state React / cache client nyangkut). */
export function logoutParticipantHard() {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

/** Logout admin/crew: bersihkan storage + navigasi penuh. */
export function logoutAdminHard() {
  clearAdminAuth();
  if (typeof window !== 'undefined') {
    window.location.assign('/dashboard/login');
  }
}
