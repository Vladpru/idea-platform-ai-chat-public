import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';
import { newId } from '../../helpers/uuid.helper';

describe('Similarity API', () => {
  let token = '';

  beforeAll(() => {
    token = loadSession(PRIMARY_USER).token;
  });

  // GET /similarity — find similar ideas or problems via hybrid search
  describe('GET /similarity', () => {
    it('should return similar ideas by free text', async () => {
      const res = await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'idea', text: 'neighborhood item sharing platform', limit: 3 })
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return similar problems by free text', async () => {
      const res = await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'problem', text: 'equipment visibility tracking' })
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should accept limit param', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'idea', text: 'sharing', limit: 5 })
        .expectStatus(200);
    });

    it('should return 400 when both sourceId and text are provided', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'idea', sourceId: newId(), text: 'some text' })
        .expectStatus(400);
    });

    it('should return 400 when neither sourceId nor text is provided', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'idea' })
        .expectStatus(400);
    });

    it('should return 400 when entityType is missing', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ text: 'test query' })
        .expectStatus(400);
    });

    it('should return 400 when entityType is invalid', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'invalidType', text: 'test' })
        .expectStatus(400);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/similarity')
        .withQueryParams({ entityType: 'idea', text: 'test' })
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withQueryParams({ entityType: 'idea', text: 'test' })
        .expectStatus(401);
    });
  });
});