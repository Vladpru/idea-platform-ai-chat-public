import { createHash, timingSafeEqual } from 'crypto';

export function hashInviteSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function parseInviteToken(
  token: string,
): { inviteId: string; secret: string } | null {
  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [inviteId, secret] = parts;

  if (!inviteId || !secret) {
    return null;
  }

  return { inviteId, secret };
}

export function inviteSecretsMatch(
  storedHash: string,
  secret: string,
): boolean {
  const computedHash = hashInviteSecret(secret);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');

  if (storedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, computedBuffer);
}
