import { BadGatewayException, HttpException, HttpStatus } from '@nestjs/common';

import { DEFAULT_GEMINI_MODEL } from './gemini.constants';
import type { GeminiErrorBody } from './gemini.types';

export function parseGeminiProviderErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as GeminiErrorBody;
    return (
      parsed.error?.message?.trim() || raw.trim() || 'Unknown provider error'
    );
  } catch {
    return raw.trim() || 'Unknown provider error';
  }
}

export function isGeminiQuotaExceeded(
  status: number,
  message: string,
): boolean {
  const lower = message.toLowerCase();
  if (
    lower.includes('not found') ||
    lower.includes('is not supported') ||
    lower.includes('listmodels')
  ) {
    return false;
  }

  return (
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource exhausted')
  );
}

export function parseGeminiRetryAfterSeconds(
  message: string,
): number | undefined {
  const match = message.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (!match) return undefined;
  return Math.ceil(Number(match[1]));
}

export function createGeminiQuotaException(
  providerMessage: string,
  options: { isDevelopment: boolean; retryAfterSeconds?: number },
): HttpException {
  const { isDevelopment, retryAfterSeconds } = options;
  const retryHint =
    retryAfterSeconds !== undefined
      ? ` Try again in about ${retryAfterSeconds} seconds.`
      : ' Please wait a minute and try again.';

  const message = isDevelopment
    ? `AI quota exceeded: ${providerMessage}`
    : `AI generation is temporarily unavailable due to API quota limits.${retryHint} You can also set GEMINI_MODEL=${DEFAULT_GEMINI_MODEL} in backend env.`;

  return new HttpException(
    {
      message,
      error: 'Too Many Requests',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      retryAfterSeconds,
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

export function createGeminiProviderException(
  status: number,
  providerMessage: string,
  isDevelopment: boolean,
): BadGatewayException {
  const hint = getGeminiProviderHint(status, providerMessage);
  const clientMessage = isDevelopment
    ? `AI generation provider failed: ${providerMessage}${hint ? ` (${hint})` : ''}`
    : 'AI generation provider failed';

  return new BadGatewayException(clientMessage);
}

function getGeminiProviderHint(status: number, message: string): string | null {
  const lower = message.toLowerCase();
  if (status === 401 || status === 403 || lower.includes('api key')) {
    return 'check GEMINI_API_KEY from Google AI Studio (AIza… prefix)';
  }
  if (status === 404 || lower.includes('not found')) {
    return `try GEMINI_MODEL=${DEFAULT_GEMINI_MODEL}`;
  }
  if (lower.includes('location') || lower.includes('not supported')) {
    return 'model may be unavailable in your region';
  }
  return null;
}
