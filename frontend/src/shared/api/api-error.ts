import axios from 'axios';

const INVALID_CREDENTIALS = 'Invalid email or password';

const TECHNICAL_AUTH_MESSAGE =
  /refresh\s*token|access\s*token|bearer|jwt|token\s+missing|token\s+expired|^unauthorized$/i;

const AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/i;

type ApiFieldError = {
  field?: string;
  message?: string;
};

type ApiErrorBody = {
  message?: string | string[] | { errors?: ApiFieldError[] };
  errors?: ApiFieldError[];
};

function isUserFacingAuthMessage(message: string): boolean {
  const trimmed = message.trim();
  return (
    trimmed.length > 0 &&
    !TECHNICAL_AUTH_MESSAGE.test(trimmed) &&
    !AXIOS_STATUS_MESSAGE.test(trimmed)
  );
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

export function isApiNotFoundError(error: unknown): boolean {
  return getApiErrorStatus(error) === 404;
}

function messageFromFieldErrors(
  errors: ApiFieldError[] | undefined,
): string | null {
  if (!errors?.length) {
    return null;
  }

  const messages = errors
    .map(error => error.message?.trim())
    .filter((message): message is string => Boolean(message));

  if (messages.length === 0) {
    return null;
  }

  return messages.join('. ');
}

function messageFromValidationErrors(data: ApiErrorBody | undefined): string | null {
  if (!data) {
    return null;
  }

  const topLevel = messageFromFieldErrors(data.errors);
  if (topLevel) {
    return topLevel;
  }

  const nestedMessage = data.message;
  if (
    nestedMessage &&
    typeof nestedMessage === 'object' &&
    !Array.isArray(nestedMessage)
  ) {
    return messageFromFieldErrors(nestedMessage.errors);
  }

  return null;
}

function messageFromResponseBody(data: ApiErrorBody | undefined): string | null {
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
    const data = error.response?.data as ApiErrorBody | undefined;
    const validationMessage = messageFromValidationErrors(data);
    if (validationMessage) {
      return validationMessage;
    }

    const apiMessage = messageFromResponseBody(data);
    const status = error.response?.status;

    if (apiMessage && isUserFacingAuthMessage(apiMessage)) {
      return apiMessage;
    }
    if (status === 429 && apiMessage && isUserFacingAuthMessage(apiMessage)) {
      return apiMessage;
    }
    if (status === 404) {
      return (
        apiMessage ??
        'This content no longer exists or could not be found.'
      );
    }
    if (status === 401 || status === 403) {
      return wrongCreds;
    }
    if (status === 422) {
      return 'Unable to complete this action. Please check your input and try again.';
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
