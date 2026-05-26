export const AUTH_TOKEN_STORAGE_KEY = 'auth_token' as const;

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export function clearStoredAuthToken(): void {
  setStoredAuthToken(null);
}

export function hasStoredAuthToken(): boolean {
  return Boolean(getStoredAuthToken());
}
