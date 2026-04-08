import type { VerifiedUserData } from '@/types/registration';

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
