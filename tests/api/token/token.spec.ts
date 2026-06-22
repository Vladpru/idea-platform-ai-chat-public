import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';

describe('Token API', () => {
  let refreshCookie = '';
  let accessToken = '';

  beforeAll(() => {
    const session = loadSession(PRIMARY_USER);
    accessToken = session.token;
    refreshCookie = session.refreshCookie;
  });

  // POST /token/refresh — exchange a valid refresh-token cookie for a new access token
  describe('POST /token/refresh', () => {
    it('should return new accessToken when refresh cookie is valid', async () => {
      const res = await pactum.spec()
        .post('/token/refresh')
        .withHeaders('Cookie', refreshCookie)
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('accessToken');
      expect(typeof res.json.accessToken).toBe('string');
      expect(res.json.accessToken.length).toBeGreaterThan(10);
    });

    // POST /token/refresh — reject refresh when no cookie is provided
    it('should return 401 when refresh cookie is absent', async () => {
      await pactum.spec()
        .post('/token/refresh')
        .expectStatus(401);
    });

    // POST /token/refresh — reject refresh with a tampered or invalid token value
    it('should return 401 for a forged refresh token', async () => {
      await pactum.spec()
        .post('/token/refresh')
        .withHeaders('Cookie', 'refreshToken=forged.token.value')
        .expectStatus(401);
    });

    // POST /token/refresh — the newly issued access token must differ from the original
    it('should issue a fresh access token different from the original', async () => {
      const res = await pactum.spec()
        .post('/token/refresh')
        .withHeaders('Cookie', refreshCookie)
        .expectStatus(201) as any;

      expect(res.json.accessToken).not.toBe(accessToken);
    });

    // POST /token/refresh — the response must not expose user credentials
    it('should return only accessToken in response body', async () => {
      const res = await pactum.spec()
        .post('/token/refresh')
        .withHeaders('Cookie', refreshCookie)
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('accessToken');
      // Sensitive fields must not be returned
      expect(res.json).not.toHaveProperty('password');
      expect(res.json).not.toHaveProperty('refreshToken');
    });
  });
});