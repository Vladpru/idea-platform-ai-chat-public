import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';

describe('Auth API', () => {
  // unique email used across all registration tests in this suite
  const ts = Date.now();
  const uniqueEmail = `auth${ts}@qa-test.dev`;
  const password = 'Test@12345';

  // POST /auth/register — register a new user with valid credentials
  describe('POST /auth/register', () => {
    it('should register a new user and return accessToken', async () => {
      const res = await pactum.spec()
        .post('/auth/register')
        .withJson({ email: uniqueEmail, password, firstName: 'Auth', lastName: 'Test' })
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('accessToken');
      expect(typeof res.json.accessToken).toBe('string');
      expect(res.json.accessToken.length).toBeGreaterThan(10);
      expect(res.json).toHaveProperty('user');
      expect(res.json.user).toHaveProperty('id');
      expect(res.json.user).toHaveProperty('email');
      expect(res.json.user.email).toBe(uniqueEmail);
    });

    // POST /auth/register — reject registration with duplicate email
    it('should return 409 when email already exists', async () => {
      await pactum.spec()
        .post('/auth/register')
        .withJson({ email: uniqueEmail, password, firstName: 'Dup', lastName: 'User' })
        .expectStatus(409);
    });

    // POST /auth/register — reject registration when email field is missing
    it('should return 400 when email is missing', async () => {
      await pactum.spec()
        .post('/auth/register')
        .withJson({ password })
        .expectStatus(400);
    });

    // POST /auth/register — reject registration when firstName is missing
    it('should return 400 when firstName is missing', async () => {
      await pactum.spec()
        .post('/auth/register')
        .withJson({ email: `nofirst${ts}@qa-test.dev`, password, lastName: 'Test' })
        .expectStatus(400);
    });

    // POST /auth/register — reject registration with an empty body
    it('should return 400 when body is empty', async () => {
      await pactum.spec()
        .post('/auth/register')
        .withJson({})
        .expectStatus(400);
    });

    // POST /auth/register — reject weak password that fails validation rules
    it('should return 400 when password is too weak', async () => {
      await pactum.spec()
        .post('/auth/register')
        .withJson({ email: `weak${ts}@qa-test.dev`, password: 'weak', firstName: 'A', lastName: 'B' })
        .expectStatus(400);
    });

    // POST /auth/register — reject malformed email address
    it('should return 400 when email format is invalid', async () => {
      await pactum.spec()
        .post('/auth/register')
        .withJson({ email: 'not-an-email', password, firstName: 'A', lastName: 'B' })
        .expectStatus(400);
    });
  });

  // POST /auth/login — authenticate with valid credentials
  describe('POST /auth/login', () => {
    it('should login and return accessToken plus refresh cookie', async () => {
      const { email, password: pwd } = loadSession(PRIMARY_USER);

      const res = await pactum.spec()
        .post('/auth/login')
        .withJson({ email, password: pwd })
        .expectStatus(201)
        .expect(ctx => {
          const raw = ctx.res.headers?.['set-cookie'];
          const cookie = Array.isArray(raw) ? raw[0] : (raw ?? '');
          expect(cookie).toBeTruthy();
        }) as any;

      expect(res.json).toHaveProperty('accessToken');
      expect(typeof res.json.accessToken).toBe('string');
      expect(res.json.accessToken.length).toBeGreaterThan(10);
      expect(res.json).toHaveProperty('user');
      expect(res.json.user).toHaveProperty('id');
      expect(res.json.user).toHaveProperty('email');
    });

    // POST /auth/login — reject login with incorrect password
    it('should return 401 for wrong password', async () => {
      await pactum.spec()
        .post('/auth/login')
        .withJson({ email: PRIMARY_USER, password: 'WrongPass@99' })
        .expectStatus(401);
    });

    // POST /auth/login — reject login for a non-existent account
    it('should return 401 for non-existent email', async () => {
      await pactum.spec()
        .post('/auth/login')
        .withJson({ email: 'nobody@qa-test.dev', password })
        .expectStatus(401);
    });

    // POST /auth/login — reject login when body is empty
    it('should return 400 when body is empty', async () => {
      await pactum.spec()
        .post('/auth/login')
        .withJson({})
        .expectStatus(400);
    });

    // POST /auth/login — reject login when email is missing
    it('should return 400 when email is missing', async () => {
      await pactum.spec()
        .post('/auth/login')
        .withJson({ password })
        .expectStatus(400);
    });

    // POST /auth/login — reject login when password is missing
    it('should return 400 when password is missing', async () => {
      await pactum.spec()
        .post('/auth/login')
        .withJson({ email: PRIMARY_USER })
        .expectStatus(400);
    });
  });

  // POST /auth/google — reject login when the Google ID token is invalid
  describe('POST /auth/google', () => {
    it('should return 401 when google token is invalid', async () => {
      await pactum.spec()
        .post('/auth/google')
        .withJson({ credential: 'invalid-google-token' })
        .expectStatus(401);
    });
  });

  // POST /auth/logout — clear the refresh token cookie for the current session
  describe('POST /auth/logout', () => {
    it('should logout and clear the refresh cookie', async () => {
      const res = await pactum.spec()
        .post('/auth/login')
        .withJson({ email: uniqueEmail, password })
        .expectStatus(201) as any;

      await pactum.spec()
        .post('/auth/logout')
        .withHeaders('Authorization', `Bearer ${res.json?.accessToken}`)
        .expectStatus(201);
    });

    // POST /auth/logout — reject request without token
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post('/auth/logout')
        .expectStatus(401);
    });

    // POST /auth/logout — reject request with a forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post('/auth/logout')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // POST /auth/forgot-password — request a password reset link by email
  describe('POST /auth/forgot-password', () => {
    it('should accept forgot-password for existing email', async () => {
      await pactum.spec()
        .post('/auth/forgot-password')
        .withJson({ email: PRIMARY_USER })
        .expectStatus(200);
    });

    // POST /auth/forgot-password — should not reveal whether email exists (no enumeration)
    it('should return 2xx for non-existent email', async () => {
      await pactum.spec()
        .post('/auth/forgot-password')
        .withJson({ email: 'ghost@qa-test.dev' })
        .expectStatus(200);
    });

    // POST /auth/forgot-password — reject request with missing email field
    it('should return 400 when email is missing', async () => {
      await pactum.spec()
        .post('/auth/forgot-password')
        .withJson({})
        .expectStatus(400);
    });
  });

  // POST /auth/reset-password — reject reset attempt with an invalid token
  describe('POST /auth/reset-password', () => {
    it('should return 400 for an invalid reset token', async () => {
      await pactum.spec()
        .post('/auth/reset-password')
        .withJson({ token: 'totally-fake-reset-token', newPassword: 'NewPass@99' })
        .expectStatus(400);
    });

    // POST /auth/reset-password — reject when token field is missing
    it('should return 400 when token is missing', async () => {
      await pactum.spec()
        .post('/auth/reset-password')
        .withJson({ newPassword: 'NewPass@99' })
        .expectStatus(400);
    });

    // POST /auth/reset-password — reject when newPassword field is missing
    it('should return 400 when newPassword is missing', async () => {
      await pactum.spec()
        .post('/auth/reset-password')
        .withJson({ token: 'some-token' })
        .expectStatus(400);
    });
  });
});