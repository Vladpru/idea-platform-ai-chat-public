import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';

describe('Search API', () => {
  let token = '';

  beforeAll(() => {
    token = loadSession(PRIMARY_USER).token;
  });

  // GET /search — global full-text search across Ideas and Problems
  describe('GET /search', () => {
    it('should return idea results by default', async () => {
      const res = await pactum.spec()
        .get('/search')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ q: 'platform' })
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return results for activeTab=ideas', async () => {
      await pactum.spec()
        .get('/search')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ q: 'sharing', activeTab: 'ideas' })
        .expectStatus(200);
    });

    it('should return results for activeTab=problems', async () => {
      await pactum.spec()
        .get('/search')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ q: 'equipment', activeTab: 'problems' })
        .expectStatus(200);
    });

    it('should accept page and limit params', async () => {
      await pactum.spec()
        .get('/search')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ q: 'test', page: 1, limit: 5 })
        .expectStatus(200);
    });

    it('should return 400 when q is missing', async () => {
      await pactum.spec()
        .get('/search')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/search')
        .withQueryParams({ q: 'test' })
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/search')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withQueryParams({ q: 'test' })
        .expectStatus(401);
    });
  });
});