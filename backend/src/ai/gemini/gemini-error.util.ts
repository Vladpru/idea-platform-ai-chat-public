import { BadGatewayException, HttpException, HttpStatus } from '@nestjs/common';

import type { GeminiErrorBody } from './gemini.types';

export function parseGeminiProviderErrorMessage(raw: string): string {
  const trimmed = raw.trim();
  const candidates = [trimmed];
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart > 0) {
    candidates.push(trimmed.slice(jsonStart));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as GeminiErrorBody;
      const message = parsed.error?.message?.trim();
      if (message) {
        return message;
      }
    } catch {
      // try next candidate
    }
  }

  return trimmed || 'Unknown provider error';
}

export function toUserFacingAiErrorMessage(
  providerMessage: string,
  providerStatus?: number,
): string {
  const parsed = parseGeminiProviderErrorMessage(providerMessage);
  const lower = parsed.toLowerCase();

  if (
    providerStatus === 503 ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded')
  ) {
    return 'The AI service is busy right now. Please wait a moment and try again.';
  }

  if (
    providerStatus === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource exhausted')
  ) {
    const retryAfterSeconds = parseGeminiRetryAfterSeconds(parsed);
    if (retryAfterSeconds !== undefined) {
      return `AI usage limit reached. Try again in about ${retryAfterSeconds} seconds.`;
    }
    return 'AI usage limit reached. Please wait a minute and try again.';
  }

  if (
    providerStatus === 500 ||
    lower.includes('internal error') ||
    lower.includes('internal server')
  ) {
    return 'The AI service had a temporary error. Please try again.';
  }

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return 'AI generation took too long. Please try again.';
  }

  return 'AI generation is temporarily unavailable. Please try again later.';
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
  const { retryAfterSeconds } = options;
  const message =
    retryAfterSeconds !== undefined
      ? `AI usage limit reached. Try again in about ${retryAfterSeconds} seconds.`
      : toUserFacingAiErrorMessage(providerMessage, 429);

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
  _isDevelopment: boolean,
): BadGatewayException {
  return new BadGatewayException(
    toUserFacingAiErrorMessage(providerMessage, status),
  );
}
