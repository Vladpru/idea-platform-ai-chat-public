import type { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

function readHandshakeHeaderValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const [first] = value as unknown[];
    return typeof first === 'string' ? first : undefined;
  }

  return undefined;
}

function readAuthToken(auth: unknown): string | undefined {
  if (typeof auth !== 'object' || auth === null) {
    return undefined;
  }

  const token: unknown = Reflect.get(auth, 'token');
  return typeof token === 'string' ? token : undefined;
}

export function extractBearerToken(client: Socket): string | null {
  const headerValue = readHandshakeHeaderValue(
    client.handshake.headers.authorization,
  );

  if (headerValue?.startsWith('Bearer ')) {
    const token = headerValue.slice(7).trim();
    return token.length > 0 ? token : null;
  }

  const authToken = readAuthToken(client.handshake.auth);
  if (authToken && authToken.length > 0) {
    return authToken;
  }

  return null;
}

export function extractCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.trim().split('=');
    if (rawKey === name) {
      const value = rawValueParts.join('=');
      return value.length > 0 ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

async function verifyTokenAndExtractId(
  token: string,
  jwt: JwtService,
): Promise<string | null> {
  try {
    const payload = await jwt.verifyAsync<{ id?: unknown }>(token);
    if (typeof payload.id === 'string' && payload.id.length > 0) {
      return payload.id;
    }
  } catch {
    return null;
  }
  return null;
}

export async function resolveUserIdFromSocket(
  client: Socket,
  jwt: JwtService,
  refreshCookieName: string,
): Promise<string | null> {
  const bearerToken = extractBearerToken(client);
  if (bearerToken) {
    const id = await verifyTokenAndExtractId(bearerToken, jwt);
    if (id) return id;
  }

  const cookieHeader = readHandshakeHeaderValue(
    client.handshake.headers.cookie,
  );
  const refreshToken = extractCookieValue(cookieHeader, refreshCookieName);
  if (refreshToken) {
    return verifyTokenAndExtractId(refreshToken, jwt);
  }

  return null;
}
