import * as fs from 'fs';
import * as path from 'path';
import * as pactum from 'pactum';

export const PRIMARY_USER = 'qa-user1@qa-test.dev';
export const SECONDARY_USER = 'qa-user2@qa-test.dev';

export interface AuthSession {
  token: string;
  refreshCookie: string;
  email: string;
  password: string;
}

export function loadSession(email: string): AuthSession {
  const stateFile = path.join(__dirname, '../.auth-state.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  const session = state[email];
  if (!session) throw new Error(`No auth state for ${email} — check global setup`);
  return session;
}

// Use only when a truly unique user is required (e.g. testing password change in isolation)
export async function registerAndLogin(uniqueSuffix?: string): Promise<AuthSession> {
  const id = uniqueSuffix ?? String(Date.now() + Math.random());
  const email = `qa${id}@qa-test.dev`;
  const password = 'Test@12345';

  await pactum.spec()
    .post('/auth/register')
    .withJson({ email, password, firstName: 'QA', lastName: 'Tester' })
    .expectStatus(201);

  let token = '';
  let refreshCookie = '';

  const res = await pactum.spec()
    .post('/auth/login')
    .withJson({ email, password })
    .expectStatus(201)
    .expect(ctx => {
      const raw = ctx.res.headers?.['set-cookie'];
      refreshCookie = Array.isArray(raw) ? raw[0] : (raw ?? '');
    }) as any;

  token = res?.json?.accessToken ?? '';
  return { token, refreshCookie, email, password };
}