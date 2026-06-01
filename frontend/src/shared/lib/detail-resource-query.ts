import { getApiErrorStatus } from '@/shared/api/api-error';

/** Invalid id (400), missing (404), or forbidden (403) — show the not-found page. */
export function isDetailResourceUnavailableError(error: unknown): boolean {
  const status = getApiErrorStatus(error);
  return status === 400 || status === 403 || status === 404;
}

/** Detail pages should fail fast; never retry client errors (e.g. invalid UUID → 400). */
export function shouldRetryDetailResourceQuery(
  failureCount: number,
  error: unknown,
): boolean {
  const status = getApiErrorStatus(error);
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
}
