import type { VerifiedUserData } from '@/types/registration';

/* ─── Participant (event) ─── */

const TOKEN_KEY = 'vet_sym_2026_token';
const USER_KEY = 'vet_sym_2026_user';

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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getUser();
}

/* ─── Admin / Crew (dashboard) ─── */

const ADMIN_TOKEN_KEY = 'vet_sym_2026_admin_token';
const ADMIN_USER_KEY = 'vet_sym_2026_admin_user';

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
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function isAdminAuthenticated(): boolean {
  const u = getAdminUser();
  return !!u && (u.role === 'admin' || u.role === 'crew');
}
