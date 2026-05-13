import axios from "axios";

const INVALID_CREDENTIALS = "Email or password is incorrect";

/**
 * Prefer Nest `message` from response body; otherwise map common status codes.
 */
export function getApiErrorMessage(
  error: unknown,
  options?: { invalidCredentialsMessage?: string },
): string {
  const wrongCreds =
    options?.invalidCredentialsMessage ?? INVALID_CREDENTIALS;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message.trim();
    }
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.map(String).join(". ");
    }
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return wrongCreds;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return wrongCreds;
}
