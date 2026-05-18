import axios from 'axios';

const INVALID_CREDENTIALS = 'Invalid email or password';

const TECHNICAL_AUTH_MESSAGE =
  /refresh\s*token|access\s*token|bearer|jwt|token\s+missing|token\s+expired|^unauthorized$/i;

function isUserFacingAuthMessage(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length > 0 && !TECHNICAL_AUTH_MESSAGE.test(trimmed);
}

function messageFromResponseBody(
  data: { message?: string | string[] } | undefined,
): string | null {
  if (typeof data?.message === 'string' && data.message.trim().length > 0) {
    return data.message.trim();
  }
  if (Array.isArray(data?.message) && data.message.length > 0) {
    return data.message.map(String).join('. ');
  }
  return null;
}

/**
 * Prefer Nest `message` from response body; otherwise map common status codes.
 * Never surfaces token-related implementation details to the user.
 */
export function getApiErrorMessage(
  error: unknown,
  options?: { invalidCredentialsMessage?: string },
): string {
  const wrongCreds = options?.invalidCredentialsMessage ?? INVALID_CREDENTIALS;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const apiMessage = messageFromResponseBody(data);
    if (apiMessage && isUserFacingAuthMessage(apiMessage)) {
      return apiMessage;
    }
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return wrongCreds;
    }
    if (apiMessage) {
      return wrongCreds;
    }
  }
  if (error instanceof Error) {
    if (isUserFacingAuthMessage(error.message)) {
      return error.message;
    }
    return wrongCreds;
  }
  return wrongCreds;
}
