function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getClientTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && isValidIanaTimeZone(timeZone)) {
      return timeZone;
    }
  } catch {
    // ignore
  }

  return 'UTC';
}
