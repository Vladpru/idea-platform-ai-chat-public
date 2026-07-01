import axios, { AxiosError, type AxiosResponse } from 'axios';

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

/**
 * Build a synthetic 404 so offline/local code paths can signal "not found" in a
 * shape `getApiErrorStatus` / `shouldRetryDetailResourceQuery` already recognize.
 */
export function createNotFoundError(message = 'Resource not found'): AxiosError {
  const error = new AxiosError(message, 'ERR_NOT_FOUND');
  error.response = {
    status: 404,
    statusText: 'Not Found',
    data: null,
    headers: {},
    config: error.config,
  } as AxiosResponse;
  return error;
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

type GeminiNestedError = {
  error?: { message?: string };
};

function extractGeminiNestedMessage(raw: string): string | null {
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw.slice(jsonStart)) as GeminiNestedError;
    return parsed.error?.message?.trim() || null;
  } catch {
    return null;
  }
}

function formatAiGenerationMessage(apiMessage: string): string | null {
  const lower = apiMessage.toLowerCase();
  const isAiError =
    lower.includes('ai generation') ||
    lower.includes('ai quota') ||
    lower.includes('provider failed') ||
    lower.includes('ai usage limit');

  if (!isAiError) {
    return null;
  }

  const inner =
    extractGeminiNestedMessage(apiMessage) ??
    apiMessage.replace(/^ai generation provider failed:\s*/i, '').trim();
  const innerLower = inner.toLowerCase();

  if (
    innerLower.includes('high demand') ||
    innerLower.includes('unavailable') ||
    innerLower.includes('overloaded')
  ) {
    return 'The AI service is busy right now. Please wait a moment and try again.';
  }

  if (
    innerLower.includes('quota') ||
    innerLower.includes('rate limit') ||
    innerLower.includes('resource exhausted') ||
    innerLower.includes('usage limit')
  ) {
    const retryMatch = inner.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
    if (retryMatch) {
      return `AI usage limit reached. Try again in about ${Math.ceil(Number(retryMatch[1]))} seconds.`;
    }
    if (innerLower.includes('try again in about')) {
      return inner;
    }
    return 'AI usage limit reached. Please wait a minute and try again.';
  }

  if (innerLower.includes('internal error')) {
    return 'The AI service had a temporary error. Please try again.';
  }

  if (innerLower.includes('timed out') || innerLower.includes('timeout')) {
    return 'AI generation took too long. Please try again.';
  }

  if (
    innerLower.includes('temporarily unavailable') ||
    innerLower.includes('busy right now')
  ) {
    return inner;
  }

  return 'AI generation is temporarily unavailable. Please try again later.';
}

function toUserFacingApiMessage(
  apiMessage: string,
  status?: number,
): string {
  const aiMessage = formatAiGenerationMessage(apiMessage);
  if (aiMessage) {
    return aiMessage;
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'Something went wrong. Please try again in a moment.';
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  return apiMessage;
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
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      return 'No internet connection. Please check your network and try again.';
    }

    const data = error.response?.data as ApiErrorBody | undefined;
    const validationMessage = messageFromValidationErrors(data);
    if (validationMessage) {
      return validationMessage;
    }

    const apiMessage = messageFromResponseBody(data);
    const status = error.response?.status;

    if (apiMessage) {
      const friendlyMessage = toUserFacingApiMessage(apiMessage, status);
      if (friendlyMessage !== apiMessage || isUserFacingAuthMessage(apiMessage)) {
        return friendlyMessage;
      }
    }
    if (status === 429 && apiMessage && isUserFacingAuthMessage(apiMessage)) {
      return toUserFacingApiMessage(apiMessage, status);
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
