import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';

describe('Achievements API', () => {
  let token = '';

  beforeAll(() => {
    token = loadSession(PRIMARY_USER).token;
  });

  // GET /achievements/me — get achievements list with unlock status and progress
  describe('GET /achievements/me', () => {
    it('should return achievements list', async () => {
      const res = await pactum.spec()
        .get('/achievements/me')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(Array.isArray(res.json)).toBe(true);
    });

    it('each achievement should have an id field', async () => {
      const res = await pactum.spec()
        .get('/achievements/me')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      if (Array.isArray(res.json) && res.json.length > 0) {
        expect(res.json[0]).toHaveProperty('id');
      }
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/achievements/me')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/achievements/me')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // PATCH /achievements/me/seen — mark all new achievements as seen
  describe('PATCH /achievements/me/seen', () => {
    it('should mark all new achievements as seen', async () => {
      await pactum.spec()
        .patch('/achievements/me/seen')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch('/achievements/me/seen')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .patch('/achievements/me/seen')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });
});