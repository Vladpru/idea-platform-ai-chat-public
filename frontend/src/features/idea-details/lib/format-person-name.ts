export function formatPersonName(
  firstName: string | null,
  lastName: string | null,
  fallback = '',
): string {
  const full = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return full || fallback;
}
