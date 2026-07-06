import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';

describe('Tags API', () => {
  let token = '';

  beforeAll(() => {
    token = loadSession(PRIMARY_USER).token;
  });

  // GET /tag — list all available tags
  describe('GET /tag', () => {
    it('should return array of tags', async () => {
      const res = await pactum.spec()
        .get('/tag')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(Array.isArray(res.json)).toBe(true);
    });

    it('each tag should have id, name, label fields', async () => {
      const res = await pactum.spec()
        .get('/tag')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      if (Array.isArray(res.json) && res.json.length > 0) {
        expect(res.json[0]).toHaveProperty('id');
        expect(res.json[0]).toHaveProperty('name');
        expect(res.json[0]).toHaveProperty('label');
      }
    });

    it('tag fields should be strings', async () => {
      const res = await pactum.spec()
        .get('/tag')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      if (Array.isArray(res.json) && res.json.length > 0) {
        expect(typeof res.json[0].id).toBe('string');
        expect(typeof res.json[0].name).toBe('string');
        // label is nullable per Swagger (TagResponseDto: nullable: true)
        expect(res.json[0].label === null || typeof res.json[0].label === 'string').toBe(true);
      }
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/tag')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/tag')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // GET /tag/suggestions — suggest tags for idea or problem forms
  describe('GET /tag/suggestions', () => {
    it('should return tag suggestions for idea context', async () => {
      const res = await pactum.spec()
        .get('/tag/suggestions')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ title: 'community sharing app', context: 'idea', limit: 6 })
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return tag suggestions for problem context', async () => {
      await pactum.spec()
        .get('/tag/suggestions')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ title: 'equipment visibility', context: 'problem', limit: 6 })
        .expectStatus(200);
    });

    it('should accept exclude param to filter out existing tags', async () => {
      await pactum.spec()
        .get('/tag/suggestions')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ title: 'sharing', context: 'idea', exclude: 'community' })
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/tag/suggestions')
        .withQueryParams({ title: 'test' })
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/tag/suggestions')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withQueryParams({ title: 'test' })
        .expectStatus(401);
    });
  });
});