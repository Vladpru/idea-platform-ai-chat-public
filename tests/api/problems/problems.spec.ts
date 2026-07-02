import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER, SECONDARY_USER } from '../../helpers/auth.helper';
import { newId, TINY_PNG } from '../../helpers/uuid.helper';

describe('Problems API', () => {
  let token = '';
  let token2 = '';
  let problemId = '';
  let problemVersion: number;
  let mediaId = '';
  let joinProblemId = '';  // separate published problem for join/leave tests

  beforeAll(async () => {
    const s1 = loadSession(PRIMARY_USER);
    const s2 = loadSession(SECONDARY_USER);
    token = s1.token;
    token2 = s2.token;

    // Create a published problem dedicated to join/leave tests
    joinProblemId = newId();
    await pactum.spec()
      .post('/problems')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: joinProblemId,
        isPublished: true,
        stage: 'active',
        title: 'Join Test Problem',
        description: 'A published problem dedicated to join and leave endpoint testing.',
      })
      .expectStatus(201);
  });

  // POST /problems — create a new draft problem with a client-generated UUIDv7
  describe('POST /problems', () => {
    it('should create a draft problem and return the problem object', async () => {
      problemId = newId();
      const res = await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          id: problemId,
          isPublished: false,
          title: 'QA Draft Problem',
          description: 'A detailed description of this QA test problem for the platform.',
        })
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('id', problemId);
      expect(res.json).toHaveProperty('version');
      expect(typeof res.json.version).toBe('number');
      problemVersion = res.json.version;
    });

    // POST /problems — create a problem directly in published state (requires stage field)
    it('should create a published problem when isPublished is true', async () => {
      const publishedId = newId();
      await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          id: publishedId,
          isPublished: true,
          stage: 'active',
          title: 'QA Published Problem',
          description: 'Published problem with enough detail to pass strict validation checks.',
        })
        .expectStatus(201);
    });

    // POST /problems — reject creation without auth
    it('should return 401 without auth token', async () => {
      await pactum.spec()
        .post('/problems')
        .withJson({ id: newId(), isPublished: false, title: 'No auth', description: 'No auth description' })
        .expectStatus(401);
    });

    // POST /problems — reject creation with forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withJson({ id: newId(), isPublished: false, title: 'Forged', description: 'Forged token problem description.' })
        .expectStatus(401);
    });

    // POST /problems — reject creation when required id field is missing
    it('should return 422 when id is missing', async () => {
      await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ isPublished: false, title: 'No id', description: 'Missing id field' })
        .expectStatus(422);
    });

    // POST /problems — reject creation when body is empty
    it('should return 422 when body is empty', async () => {
      await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(422);
    });

    // POST /problems — reject creation when title is shorter than minimum 3 characters
    it('should return 422 when title is too short', async () => {
      await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ id: newId(), isPublished: false, title: 'AB', description: 'Too short' })
        .expectStatus(422);
    });
  });

  // GET /problems — list all published problems (public feed, requires auth)
  describe('GET /problems', () => {
    it('should return paginated published problems', async () => {
      await pactum.spec()
        .get('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    // GET /problems — accept page and limit pagination query params
    it('should accept page and limit query params', async () => {
      await pactum.spec()
        .get('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ page: 1, limit: 5 })
        .expectStatus(200);
    });

    // GET /problems — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/problems')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/problems')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // GET /problems/suggested-ideas — suggest ideas to link while creating/editing a problem
  describe('GET /problems/suggested-ideas', () => {
    it('should return ranked idea suggestions', async () => {
      const res = await pactum.spec()
        .get('/problems/suggested-ideas')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ title: 'equipment visibility', description: 'teams lack insight', limit: 6 })
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/problems/suggested-ideas')
        .withQueryParams({ title: 'test' })
        .expectStatus(401);
    });
  });

  // GET /problems/suggested-tags — suggest tags while creating/editing a problem
  describe('GET /problems/suggested-tags', () => {
    it('should return ranked tag suggestions', async () => {
      const res = await pactum.spec()
        .get('/problems/suggested-tags')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ title: 'equipment visibility', limit: 6 })
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/problems/suggested-tags')
        .withQueryParams({ title: 'test' })
        .expectStatus(401);
    });
  });

  // GET /problems/my-dashboard — list current user problems including drafts
  describe('GET /problems/my-dashboard', () => {
    it('should return current user problems', async () => {
      await pactum.spec()
        .get('/problems/my-dashboard')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    // GET /problems/my-dashboard — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/problems/my-dashboard')
        .expectStatus(401);
    });
  });

  // GET /problems/{id} — fetch a single problem by its UUID
  describe('GET /problems/{id}', () => {
    it('should return problem details by ID', async () => {
      const res = await pactum.spec()
        .get(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;

      expect(res.json).toHaveProperty('id', problemId);
      expect(res.json).toHaveProperty('title', 'QA Draft Problem');
      expect(res.json).toHaveProperty('version');
      expect(typeof res.json.version).toBe('number');
      problemVersion = res.json.version ?? problemVersion;
    });

    // GET /problems/{id} — return 404 for an unknown UUID
    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .get(`/problems/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    // GET /problems/{id} — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/problems/${problemId}`)
        .expectStatus(401);
    });

    // GET /problems/{id} — return 400 for a malformed non-UUID path parameter
    it('should return 400 for malformed problem ID', async () => {
      await pactum.spec()
        .get('/problems/not-a-uuid')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });
  });

  // PATCH /problems/{id} — partial update of a problem using If-Match optimistic concurrency
  describe('PATCH /problems/{id}', () => {
    it('should update problem title and description', async () => {
      const res = await pactum.spec()
        .patch(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', String(problemVersion))
        .withJson({
          title: 'Updated QA Draft Problem',
          description: 'Updated description for the QA draft problem partial update test.',
        })
        .expectStatus(200) as any;

      expect(res.json.title).toBe('Updated QA Draft Problem');
      problemVersion = res.json.version ?? problemVersion;
    });

    // PATCH /problems/{id} — update optional business fields category and impact
    it('should update category and impact fields', async () => {
      const fresh = await pactum.spec()
        .get(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;

      await pactum.spec()
        .patch(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', String(fresh?.json?.version ?? problemVersion))
        .withJson({ category: 'Operations', impact: 'High operational cost reduction' })
        .expectStatus(200);
    });

    // PATCH /problems/{id} — return 412 when the provided If-Match version is stale (version must be a positive integer)
    it('should return 412 when If-Match version is stale', async () => {
      await pactum.spec()
        .patch(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', '999999')
        .withJson({ title: 'Stale version' })
        .expectStatus(412);
    });

    // PATCH /problems/{id} — reject update from a non-author user
    it('should return 403 or 404 when non-author tries to update', async () => {
      await pactum.spec()
        .patch(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withHeaders('If-Match', String(problemVersion))
        .withJson({ title: 'Unauthorized' })
        .expect(ctx => expect([403, 404]).toContain(ctx.res.statusCode));
    });

    // PATCH /problems/{id} — reject request without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/problems/${problemId}`)
        .withHeaders('If-Match', String(problemVersion))
        .withJson({ title: 'No token' })
        .expectStatus(401);
    });

    // PATCH /problems/{id} — return 404 for non-existent problem
    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .patch(`/problems/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withHeaders('If-Match', '1')
        .withJson({ title: 'Ghost problem' })
        .expectStatus(404);
    });
  });

  // POST /problems/{id}/like — toggle like on a published problem
  describe('POST /problems/{id}/like', () => {
    it('should toggle like on a published problem', async () => {
      // use the already-published problem created in POST /problems suite
      const publishedId = newId();
      await pactum.spec()
        .post('/problems')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          id: publishedId,
          isPublished: true,
          stage: 'active',
          title: 'Like Toggle Test Problem',
          description: 'A detailed description for the like toggle test problem endpoint.',
        })
        .expectStatus(201);

      await pactum.spec()
        .post(`/problems/${publishedId}/like`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/like`)
        .expectStatus(401);
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .post(`/problems/${newId()}/like`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });
  });

  // POST /problems/{id}/media — upload a file attachment to a problem
  describe('POST /problems/{id}/media', () => {
    it('should upload a PNG attachment and return updated problem', async () => {
      // Swagger specifies 200; API returning 201 is a bug to report.
      const res = await pactum.spec()
        .post(`/problems/${problemId}/media`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'attach.png', contentType: 'image/png' })
        .expectStatus(200) as any;

      const body = res?.json ?? {};
      const media = body?.media ?? body?.attachments ?? [];
      if (Array.isArray(media) && media.length > 0) {
        mediaId = media[media.length - 1]?.id ?? '';
      }
    });

    // POST /problems/{id}/media — reject upload with no file
    it('should return 400 when file is absent', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/media`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });

    // POST /problems/{id}/media — reject unauthenticated upload
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/media`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'attach.png', contentType: 'image/png' })
        .expectStatus(401);
    });

    // POST /problems/{id}/media — return 404 for non-existent problem
    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .post(`/problems/${newId()}/media`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'x.png', contentType: 'image/png' })
        .expectStatus(404);
    });
  });

  // DELETE /problems/{id}/media/{mediaId} — remove a specific attachment from a problem
  describe('DELETE /problems/{id}/media/{mediaId}', () => {
    it('should delete the uploaded media attachment', async () => {
      if (!mediaId) return;
      await pactum.spec()
        .delete(`/problems/${problemId}/media/${mediaId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    // DELETE /problems/{id}/media/{mediaId} — return 404 for unknown media ID
    it('should return 404 for non-existent media', async () => {
      await pactum.spec()
        .delete(`/problems/${problemId}/media/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    // DELETE /problems/{id}/media/{mediaId} — reject unauthenticated request
    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/problems/${problemId}/media/${newId()}`)
        .expectStatus(401);
    });
  });

  // POST /problems/{id}/join — join a published problem
  describe('POST /problems/{id}/join', () => {
    it('should allow secondary user to join a published problem', async () => {
      await pactum.spec()
        .post(`/problems/${joinProblemId}/join`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(201);
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .post(`/problems/${newId()}/join`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${joinProblemId}/join`)
        .expectStatus(401);
    });
  });

  // DELETE /problems/{id}/leave — leave a problem you joined
  describe('DELETE /problems/{id}/leave', () => {
    it('should allow the joined user to leave the problem', async () => {
      await pactum.spec()
        .delete(`/problems/${joinProblemId}/leave`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(204);
    });

    it('should return 404 when user is not a member', async () => {
      await pactum.spec()
        .delete(`/problems/${joinProblemId}/leave`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/problems/${joinProblemId}/leave`)
        .expectStatus(401);
    });
  });

  // DELETE /problems/{id} — permanently delete a problem (author only)
  describe('DELETE /problems/{id}', () => {
    // DELETE /problems/{id} — reject deletion by a non-author
    it('should return 403 or 404 when non-author tries to delete', async () => {
      await pactum.spec()
        .delete(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expect(ctx => expect([403, 404]).toContain(ctx.res.statusCode));
    });

    // DELETE /problems/{id} — reject deletion without auth
    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/problems/${problemId}`)
        .expectStatus(401);
    });

    it('should delete the problem and return 204', async () => {
      await pactum.spec()
        .delete(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    // DELETE /problems/{id} — return 404 when the problem is already deleted
    it('should return 404 when problem no longer exists', async () => {
      await pactum.spec()
        .delete(`/problems/${problemId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });
  });
});