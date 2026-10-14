const DISABLED_VALUES = new Set(['false', '0', 'off', 'no']);

export function isFlagEnabled(
  value: string | undefined,
  defaultValue = true,
): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return !DISABLED_VALUES.has(normalized);
}
