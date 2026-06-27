import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER, SECONDARY_USER } from '../../helpers/auth.helper';
import { newId, TINY_PNG } from '../../helpers/uuid.helper';

describe('Ideas API', () => {
  let token = '';
  let token2 = '';
  let ideaId = '';
  let problemId = '';
  let draftVersion: number;
  let mediaId = '';
  let publishedVersion: number;

  beforeAll(async () => {
    const s1 = loadSession(PRIMARY_USER);
    const s2 = loadSession(SECONDARY_USER);
    token = s1.token;
    token2 = s2.token;

    // Publishing an idea requires at least one linked problem
    problemId = newId();
    await pactum.spec()
      .post('/problems')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: problemId,
        isPublished: true,
        stage: 'active',
        title: 'Linked Problem for Idea Tests',
        description: 'A published problem that will be linked to ideas in these tests.',
      })
      .expectStatus(201);
  });

  // POST /ideas — create a new draft idea with a client-generated UUIDv7
  describe('POST /ideas', () => {
    it('should create a draft idea and return the idea object', async () => {
      ideaId = newId();
      const res = await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          id: ideaId,
          isPublished: false,
          title: 'QA Draft Idea',
          description: 'A detailed description for the QA test draft idea creation flow.',
        })
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('id', ideaId);
      expect(res.json).toHaveProperty('version');
      expect(typeof res.json.version).toBe('number');
      draftVersion = res.json.version;
    });

    // POST /ideas — reject creation without auth
    it('should return 401 without auth token', async () => {
      await pactum.spec()
        .post('/ideas')
        .withJson({ id: newId(), isPublished: false, title: 'No auth', description: 'No auth description here.' })
        .expectStatus(401);
    });

    // POST /ideas — reject creation with a forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withJson({ id: newId(), isPublished: false, title: 'Forged', description: 'Forged token description for idea creation.' })
        .expectStatus(401);
    });

    // POST /ideas — reject creation when required id field is missing
    it('should return 422 when id is missing', async () => {
      await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ isPublished: false, title: 'No ID', description: 'Missing id field in body.' })
        .expectStatus(422);
    });

    // POST /ideas — reject creation when body is empty
    it('should return 422 when body is empty', async () => {
      await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(422);
    });

    // POST /ideas — reject creation when title is shorter than minimum 3 characters
    it('should return 422 when title is too short', async () => {
      await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ id: newId(), isPublished: false, title: 'AB', description: 'Title too short.' })
        .expectStatus(422);
    });

    // POST /ideas — idempotency: re-sending the same UUIDv7 must not duplicate the record
    it('should be idempotent when the same id is sent twice', async () => {
      await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          id: ideaId,
          isPublished: false,
          title: 'QA Draft Idea',
          description: 'A detailed description for the QA test draft idea creation flow.',
        })
        .expectStatus(201);
    });
  });

  // POST /ideas/prefill — generate AI draft fields for an idea form
  describe('POST /ideas/prefill', () => {
    it('should return 200 with AI-generated fields (Swagger: 200; 502/503 = AI unavailable bug)', async () => {
      // Swagger specifies 200 for this endpoint.
      // If the AI provider is unavailable and the server returns 502/503, that is a bug to report.
      await pactum.spec()
        .post('/ideas/prefill')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ mode: 'draft', userPrompt: 'An app for neighborhood item sharing' })
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post('/ideas/prefill')
        .withJson({ mode: 'draft', userPrompt: 'test' })
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post('/ideas/prefill')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withJson({ mode: 'draft', userPrompt: 'test' })
        .expectStatus(401);
    });
  });

  // GET /ideas — list all published ideas (public feed, requires auth)
  describe('GET /ideas', () => {
    it('should return paginated published ideas', async () => {
      await pactum.spec()
        .get('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    // GET /ideas — accept page and limit query parameters
    it('should accept page and limit query params', async () => {
      await pactum.spec()
        .get('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ page: 1, limit: 5 })
        .expectStatus(200);
    });

    // GET /ideas — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/ideas')
        .expectStatus(401);
    });

    // GET /ideas — reject request with forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/ideas')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // GET /ideas/my-dashboard — list ideas that belong to the current user including drafts
  describe('GET /ideas/my-dashboard', () => {
    it('should return current user ideas', async () => {
      await pactum.spec()
        .get('/ideas/my-dashboard')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    // GET /ideas/my-dashboard — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/ideas/my-dashboard')
        .expectStatus(401);
    });
  });

  // GET /ideas/{id} — fetch a single idea by its UUID
  describe('GET /ideas/{id}', () => {
    it('should return idea details by ID', async () => {
      const res = await pactum.spec()
        .get(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;

      expect(res.json).toHaveProperty('id', ideaId);
      expect(res.json).toHaveProperty('title', 'QA Draft Idea');
      expect(res.json).toHaveProperty('version');
      expect(typeof res.json.version).toBe('number');
      draftVersion = res.json.version ?? draftVersion;
    });

    // GET /ideas/{id} — return 404 for an unknown UUID
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .get(`/ideas/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    // GET /ideas/{id} — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}`)
        .expectStatus(401);
    });

    // GET /ideas/{id} — return 400 for a non-UUID path parameter
    it('should return 400 for malformed idea ID', async () => {
      await pactum.spec()
        .get('/ideas/not-a-uuid')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });
  });

  // PATCH /ideas/{id} — partial update of a draft with optimistic concurrency via If-Match
  describe('PATCH /ideas/{id}', () => {
    it('should update draft idea title', async () => {
      const res = await pactum.spec()
        .patch(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', String(draftVersion))
        .withJson({
          stage: 'ideation',
          title: 'Updated QA Draft',
          description: 'Updated description for the QA draft idea patch test, sufficient length.',
          problemIds: [problemId],
        })
        .expectStatus(200) as any;

      expect(res.json.title).toBe('Updated QA Draft');
      draftVersion = res.json.version ?? draftVersion;
    });

    // PATCH /ideas/{id} — return 412 when the provided version is stale (version must be a positive integer)
    it('should return 412 when If-Match version is stale', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', '999999')
        .withJson({ title: 'Stale version' })
        .expectStatus(412);
    });

    // PATCH /ideas/{id} — reject update without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}`)
        .withHeaders('If-Match', String(draftVersion))
        .withJson({ title: 'No token' })
        .expectStatus(401);
    });

    // PATCH /ideas/{id} — reject update from a non-author user
    it('should return 403 or 404 when non-author tries to update', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withHeaders('If-Match', String(draftVersion))
        .withJson({ title: 'Unauthorized update' })
        .expect(ctx => expect([403, 404]).toContain(ctx.res.statusCode));
    });

    // PATCH /ideas/{id} — return 404 for non-existent idea
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .patch(`/ideas/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', '1')
        .withJson({ title: 'Ghost idea' })
        .expectStatus(404);
    });
  });

  // PUT /ideas/{id}/main-image — upload or replace the hero image of an idea
  describe('PUT /ideas/{id}/main-image', () => {
    it('should upload a PNG as main image', async () => {
      await pactum.spec()
        .put(`/ideas/${ideaId}/main-image`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'main.png', contentType: 'image/png' })
        .expectStatus(200);
    });

    // PUT /ideas/{id}/main-image — reject upload when file field is absent
    it('should return 400 when file is absent', async () => {
      await pactum.spec()
        .put(`/ideas/${ideaId}/main-image`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });

    // PUT /ideas/{id}/main-image — reject unauthenticated upload
    it('should return 401 without token', async () => {
      await pactum.spec()
        .put(`/ideas/${ideaId}/main-image`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'main.png', contentType: 'image/png' })
        .expectStatus(401);
    });

    // PUT /ideas/{id}/main-image — return 404 for non-existent idea
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .put(`/ideas/${newId()}/main-image`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'main.png', contentType: 'image/png' })
        .expectStatus(404);
    });
  });

  // POST /ideas/{id}/media — attach a file to an idea
  describe('POST /ideas/{id}/media', () => {
    it('should upload a PNG attachment and return updated idea', async () => {
      // Swagger specifies 200; API returning 201 is a bug to report.
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/media`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'attach.png', contentType: 'image/png' })
        .expectStatus(200) as any;

      const body = res?.json ?? {};
      const media = body?.media ?? body?.attachments ?? [];
      if (Array.isArray(media) && media.length > 0) {
        mediaId = media[media.length - 1]?.id ?? '';
      }
    });

    // POST /ideas/{id}/media — reject upload with no file
    it('should return 400 when no file is sent', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/media`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });

    // POST /ideas/{id}/media — reject unauthenticated upload
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/media`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'attach.png', contentType: 'image/png' })
        .expectStatus(401);
    });

    // POST /ideas/{id}/media — return 404 for non-existent idea
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/media`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'x.png', contentType: 'image/png' })
        .expectStatus(404);
    });
  });

  // POST /ideas/{id}/publish — publish a draft idea (requires valid title + description)
  describe('POST /ideas/{id}/publish', () => {
    it('should publish the draft idea', async () => {
      // Swagger specifies 200; API returning 201 is a bug to report.
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/publish`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(200) as any;

      expect(res.json).toHaveProperty('id', ideaId);
      expect(res.json).toHaveProperty('version');
      publishedVersion = res.json.version ?? 1;
    });

    // POST /ideas/{id}/publish — reject publish from a non-author
    it('should return 403 or 404 when non-author tries to publish', async () => {
      const otherId = newId();
      await pactum.spec()
        .post('/ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ id: otherId, isPublished: false, title: 'Another Draft', description: 'Another description for the QA publish authorization test.' });

      await pactum.spec()
        .post(`/ideas/${otherId}/publish`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({})
        .expect(ctx => expect([403, 404]).toContain(ctx.res.statusCode));
    });

    // POST /ideas/{id}/publish — return 404 for non-existent idea
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/publish`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(404);
    });

    // POST /ideas/{id}/publish — reject unauthenticated publish
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/publish`)
        .withJson({})
        .expectStatus(401);
    });
  });

  // GET /similarity?entityType=idea&sourceId={id} — retrieve semantically similar published ideas
  describe('GET /similarity (idea by sourceId)', () => {
    it('should return similar ideas by sourceId', async () => {
      await pactum.spec()
        .get('/similarity')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ entityType: 'idea', sourceId: ideaId, limit: 3 })
        .expectStatus(200);
    });

    // reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/similarity')
        .withQueryParams({ entityType: 'idea', sourceId: ideaId })
        .expectStatus(401);
    });
  });

  // PATCH /ideas/{id}/publish — strict update of a published idea with If-Match concurrency
  describe('PATCH /ideas/{id}/publish', () => {
    it('should update a published idea', async () => {
      const fresh = await pactum.spec()
        .get(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;

      publishedVersion = fresh?.json?.version ?? publishedVersion;

      await pactum.spec()
        .patch(`/ideas/${ideaId}/publish`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', String(publishedVersion))
        .withJson({ title: 'Published QA Idea Updated', description: 'Updated description for the published idea strict validation test.' })
        .expectStatus(200);
    });

    // PATCH /ideas/{id}/publish — return 412 when If-Match version is stale
    it('should return 412 when If-Match version is stale', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}/publish`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', '999999')
        .withJson({ title: 'Stale version' })
        .expectStatus(412);
    });

    // PATCH /ideas/{id}/publish — reject unauthenticated update
    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}/publish`)
        .withHeaders('If-Match', String(publishedVersion))
        .withJson({ title: 'No token' })
        .expectStatus(401);
    });

    // PATCH /ideas/{id}/publish — reject update from non-author
    it('should return 403 or 404 when non-author tries to update published idea', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}/publish`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withHeaders('If-Match', String(publishedVersion))
        .withJson({ title: 'Non-author update' })
        .expect(ctx => expect([403, 404]).toContain(ctx.res.statusCode));
    });
  });

  // POST /ideas/{id}/join — second user joins a published idea
  describe('POST /ideas/{id}/join', () => {
    it('should allow a second user to join the published idea', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/join`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(201);
    });

    // POST /ideas/{id}/join — return 404 for non-existent idea
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/join`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(404);
    });

    // POST /ideas/{id}/join — reject unauthenticated join
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/join`)
        .expectStatus(401);
    });
  });

  // DELETE /ideas/{id}/leave — second user leaves the idea they joined
  describe('DELETE /ideas/{id}/leave', () => {
    it('should allow the joined user to leave the idea', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}/leave`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(204);
    });

    // DELETE /ideas/{id}/leave — return 404 when user is not a member
    it('should return 404 when user is not a member', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}/leave`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(404);
    });

    // DELETE /ideas/{id}/leave — reject unauthenticated request
    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}/leave`)
        .expectStatus(401);
    });
  });

  // POST /ideas/{id}/like — toggle like on a published idea
  describe('POST /ideas/{id}/like', () => {
    it('should toggle like on the published idea', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/like`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    // toggle again (unlike)
    it('should toggle like off (unlike) on the published idea', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/like`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    // reject unauthenticated like
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/like`)
        .expectStatus(401);
    });

    // return 404 for non-existent idea
    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/like`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });
  });

  // DELETE /ideas/{id}/media/{mediaId} — remove a media attachment from an idea
  describe('DELETE /ideas/{id}/media/{mediaId}', () => {
    it('should delete the uploaded attachment', async () => {
      if (!mediaId) return;
      await pactum.spec()
        .delete(`/ideas/${ideaId}/media/${mediaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    // DELETE /ideas/{id}/media/{mediaId} — return 404 for unknown media UUID
    it('should return 404 for non-existent media', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}/media/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    // DELETE /ideas/{id}/media/{mediaId} — reject unauthenticated request
    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}/media/${newId()}`)
        .expectStatus(401);
    });
  });

  // DELETE /ideas/{id} — permanently delete an idea (author only)
  describe('DELETE /ideas/{id}', () => {
    // DELETE /ideas/{id} — reject deletion by a non-author
    it('should return 403 or 404 when non-author tries to delete', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expect(ctx => expect([403, 404]).toContain(ctx.res.statusCode));
    });

    // DELETE /ideas/{id} — reject deletion without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}`)
        .expectStatus(401);
    });

    it('should delete the idea and return 204', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    // DELETE /ideas/{id} — return 404 when the idea is already deleted
    it('should return 404 when idea no longer exists', async () => {
      await pactum.spec()
        .delete(`/ideas/${ideaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });
  });
});