import { BadGatewayException, HttpException, HttpStatus } from '@nestjs/common';

import type { DeapiErrorBody } from './deapi.types';

export function parseDeapiErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as DeapiErrorBody;
    return parsed.message?.trim() || raw.trim() || 'Unknown deAPI error';
  } catch {
    return raw.trim() || 'Unknown deAPI error';
  }
}

export function createDeapiProviderException(
  status: number,
  providerMessage: string,
  isDevelopment: boolean,
): BadGatewayException {
  const hint = getDeapiProviderHint(status, providerMessage);
  const clientMessage = isDevelopment
    ? `deAPI image generation failed: ${providerMessage}${hint ? ` (${hint})` : ''}`
    : 'AI image generation provider failed';

  return new BadGatewayException(clientMessage);
}

export function createDeapiRateLimitException(
  providerMessage: string,
  isDevelopment: boolean,
): HttpException {
  const message = isDevelopment
    ? `deAPI rate limit exceeded: ${providerMessage}`
    : 'AI image generation is temporarily unavailable. Please try again shortly.';

  return new HttpException(
    {
      message,
      error: 'Too Many Requests',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

function getDeapiProviderHint(status: number, message: string): string | null {
  const lower = message.toLowerCase();
  if (status === 401 || status === 403 || lower.includes('unauthorized')) {
    return 'check DEAPI_API_KEY from https://deapi.ai dashboard';
  }
  if (status === 422 && lower.includes('balance')) {
    return 'add credits in deAPI billing';
  }
  return null;
}
