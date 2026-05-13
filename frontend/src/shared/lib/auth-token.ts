export const AUTH_TOKEN_STORAGE_KEY = "auth_token" as const;

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function hasStoredAuthToken(): boolean {
  return Boolean(getStoredAuthToken());
}
