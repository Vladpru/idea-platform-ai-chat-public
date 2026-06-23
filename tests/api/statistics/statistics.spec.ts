import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';

describe('Statistics API', () => {
  let token = '';

  beforeAll(() => {
    token = loadSession(PRIMARY_USER).token;
  });

  // GET /statistics — dashboard statistics snapshot
  describe('GET /statistics', () => {
    it('should return statistics with default params', async () => {
      const res = await pactum.spec()
        .get('/statistics')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should accept period=day', async () => {
      await pactum.spec()
        .get('/statistics')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ period: 'day' })
        .expectStatus(200);
    });

    it('should accept period=month', async () => {
      await pactum.spec()
        .get('/statistics')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ period: 'month' })
        .expectStatus(200);
    });

    it('should accept period=year', async () => {
      await pactum.spec()
        .get('/statistics')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ period: 'year' })
        .expectStatus(200);
    });

    it('should accept period=all_time with timeZone', async () => {
      await pactum.spec()
        .get('/statistics')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ period: 'all_time', timeZone: 'Europe/Kyiv' })
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/statistics')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/statistics')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // GET /statistics/leaderboard — full contributor leaderboard
  describe('GET /statistics/leaderboard', () => {
    it('should return leaderboard with default params', async () => {
      const res = await pactum.spec()
        .get('/statistics/leaderboard')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should accept period=year_to_date and timeZone', async () => {
      await pactum.spec()
        .get('/statistics/leaderboard')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ period: 'year_to_date', timeZone: 'UTC' })
        .expectStatus(200);
    });

    it('should accept period=all_time', async () => {
      await pactum.spec()
        .get('/statistics/leaderboard')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ period: 'all_time' })
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/statistics/leaderboard')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/statistics/leaderboard')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });
});