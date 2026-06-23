import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER, SECONDARY_USER } from '../../helpers/auth.helper';
import { newId } from '../../helpers/uuid.helper';

describe('Conferences API', () => {
  let token = '';
  let token2 = '';
  let ideaId = '';
  let problemId = '';
  let ideaConferenceId = '';
  let problemConferenceId = '';

  beforeAll(async () => {
    token = loadSession(PRIMARY_USER).token;
    token2 = loadSession(SECONDARY_USER).token;

    // publishing an idea requires at least one linked problem
    const linkedProblemId = newId();
    await pactum.spec()
      .post('/problems')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: linkedProblemId,
        isPublished: true,
        stage: 'active',
        title: 'Linked Problem for Conference Tests',
        description: 'A published problem linked to the conference test idea.',
      })
      .expectStatus(201);

    // publish an idea to schedule conferences for
    ideaId = newId();
    await pactum.spec()
      .post('/ideas')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: ideaId,
        isPublished: true,
        stage: 'ideation',
        title: 'Conference Test Idea',
        description: 'A sufficiently detailed description for the conferences test suite.',
        problemIds: [linkedProblemId],
      })
      .expectStatus(201);

    // publish a problem to schedule conferences for
    problemId = newId();
    await pactum.spec()
      .post('/problems')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: problemId,
        isPublished: true,
        stage: 'active',
        title: 'Conference Test Problem',
        description: 'A sufficiently detailed description for the conferences test suite.',
      })
      .expectStatus(201);
  });

  // ─── IDEA CONFERENCES ──────────────────────────────────────────────────────

  describe('GET /ideas/{ideaId}/conferences', () => {
    it('should return empty conference list for new idea', async () => {
      const res = await pactum.spec()
        .get(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .get(`/ideas/${newId()}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/conferences`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  describe('POST /ideas/{ideaId}/conferences', () => {
    it('should schedule a conference for an idea', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          title: 'QA Idea Conference',
          description: 'Live walkthrough of the QA test idea.',
          scheduledFor,
        })
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('id');
      ideaConferenceId = res.json.id ?? '';
    });

    it('should return 403 when non-author tries to schedule', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({ title: 'Unauthorized Conference', scheduledFor })
        .expectStatus(403);
    });

    it('should return 422 when title is missing', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(422);
    });

    it('should return 422 when scheduledFor is missing', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'No date conference' })
        .expectStatus(422);
    });

    it('should return 422 when body is empty', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(422);
    });

    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Ghost', scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withJson({ title: 'No auth', scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(401);
    });
  });

  describe('GET /ideas/{ideaId}/conferences/suggested-speakers', () => {
    it('should return suggested speakers for an idea conference', async () => {
      const res = await pactum.spec()
        .get(`/ideas/${ideaId}/conferences/suggested-speakers`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should accept conferenceId query param', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/conferences/suggested-speakers`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ conferenceId: ideaConferenceId })
        .expectStatus(200);
    });

    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .get(`/ideas/${newId()}/conferences/suggested-speakers`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/conferences/suggested-speakers`)
        .expectStatus(401);
    });
  });

  describe('POST /ideas/{ideaId}/conferences/{conferenceId}/invites', () => {
    it('should return 403 when non-author tries to invite', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${ideaConferenceId}/invites`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({ email: 'speaker@qa-test.dev' })
        .expectStatus(403);
    });

    it('should return 422 when both userId and email are missing', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${ideaConferenceId}/invites`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(422);
    });

    it('should return 404 for non-existent conference', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${newId()}/invites`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ email: 'speaker@qa-test.dev' })
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${ideaConferenceId}/invites`)
        .withJson({ email: 'speaker@qa-test.dev' })
        .expectStatus(401);
    });
  });

  describe('PATCH /ideas/{ideaId}/conferences/{conferenceId}', () => {
    it('should cancel the idea conference', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}/conferences/${ideaConferenceId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ action: 'cancel' })
        .expectStatus(200);
    });

    it('should return 403 when non-author tries to update', async () => {
      // create a new conference to update
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Another Conference', scheduledFor })
        .expectStatus(201) as any;
      const otherId = res.json.id;

      await pactum.spec()
        .patch(`/ideas/${ideaId}/conferences/${otherId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({ action: 'cancel' })
        .expectStatus(403);
    });

    it('should return 422 for invalid action', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Conf for invalid action', scheduledFor })
        .expectStatus(201) as any;
      const confId = res.json.id;

      await pactum.spec()
        .patch(`/ideas/${ideaId}/conferences/${confId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ action: 'invalid' })
        .expectStatus(422);
    });

    it('should return 404 for non-existent conference', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}/conferences/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ action: 'cancel' })
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/ideas/${ideaId}/conferences/${ideaConferenceId}`)
        .withJson({ action: 'cancel' })
        .expectStatus(401);
    });
  });

  describe('POST /ideas/{ideaId}/conferences/{conferenceId}/join', () => {
    it('should return 422 when conference is not live', async () => {
      // ideaConferenceId is now cancelled; any non-live conference should return 422
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Scheduled only conf', scheduledFor })
        .expectStatus(201) as any;
      const scheduledId = res.json.id;

      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${scheduledId}/join`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(422);
    });

    it('should return 404 for non-existent conference', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${newId()}/join`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/conferences/${ideaConferenceId}/join`)
        .expectStatus(401);
    });
  });

  // ─── PROBLEM CONFERENCES ───────────────────────────────────────────────────

  describe('GET /problems/{problemId}/conferences', () => {
    it('should return empty conference list for new problem', async () => {
      const res = await pactum.spec()
        .get(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .get(`/problems/${newId()}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/problems/${problemId}/conferences`)
        .expectStatus(401);
    });
  });

  describe('POST /problems/{problemId}/conferences', () => {
    it('should schedule a conference for a problem', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({
          title: 'QA Problem Conference',
          description: 'Discussion on the QA test problem.',
          scheduledFor,
        })
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('id');
      problemConferenceId = res.json.id ?? '';
    });

    it('should return 403 when non-author tries to schedule', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({ title: 'Unauthorized', scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(403);
    });

    it('should return 422 when title is missing', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(422);
    });

    it('should return 422 when scheduledFor is missing', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'No date conference' })
        .expectStatus(422);
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .post(`/problems/${newId()}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Ghost', scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withJson({ title: 'No auth', scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString() })
        .expectStatus(401);
    });
  });

  describe('GET /problems/{problemId}/conferences/suggested-speakers', () => {
    it('should return suggested speakers for a problem conference', async () => {
      const res = await pactum.spec()
        .get(`/problems/${problemId}/conferences/suggested-speakers`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .get(`/problems/${newId()}/conferences/suggested-speakers`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/problems/${problemId}/conferences/suggested-speakers`)
        .expectStatus(401);
    });
  });

  describe('PATCH /problems/{problemId}/conferences/{conferenceId}', () => {
    it('should cancel the problem conference', async () => {
      await pactum.spec()
        .patch(`/problems/${problemId}/conferences/${problemConferenceId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ action: 'cancel' })
        .expectStatus(200);
    });

    it('should return 403 when non-author tries to update', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Another Problem Conf', scheduledFor })
        .expectStatus(201) as any;
      const otherId = res.json.id;

      await pactum.spec()
        .patch(`/problems/${problemId}/conferences/${otherId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({ action: 'cancel' })
        .expectStatus(403);
    });

    it('should return 422 for invalid action', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Problem Conf for invalid action', scheduledFor })
        .expectStatus(201) as any;
      const confId = res.json.id;

      await pactum.spec()
        .patch(`/problems/${problemId}/conferences/${confId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ action: 'invalid' })
        .expectStatus(422);
    });

    it('should return 404 for non-existent conference', async () => {
      await pactum.spec()
        .patch(`/problems/${problemId}/conferences/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ action: 'cancel' })
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/problems/${problemId}/conferences/${problemConferenceId}`)
        .withJson({ action: 'cancel' })
        .expectStatus(401);
    });
  });

  describe('POST /problems/{problemId}/conferences/{conferenceId}/invites', () => {
    it('should return 403 when non-author tries to invite', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${problemConferenceId}/invites`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withJson({ email: 'speaker@qa-test.dev' })
        .expectStatus(403);
    });

    it('should return 422 when both userId and email are missing', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${problemConferenceId}/invites`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(422);
    });

    it('should return 404 for non-existent conference', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${newId()}/invites`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ email: 'speaker@qa-test.dev' })
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${problemConferenceId}/invites`)
        .withJson({ email: 'speaker@qa-test.dev' })
        .expectStatus(401);
    });
  });

  describe('POST /problems/{problemId}/conferences/{conferenceId}/join', () => {
    it('should return 422 when conference is not live', async () => {
      const scheduledFor = new Date(Date.now() + 7200 * 1000).toISOString();
      const res = await pactum.spec()
        .post(`/problems/${problemId}/conferences`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ title: 'Scheduled problem conf', scheduledFor })
        .expectStatus(201) as any;
      const scheduledId = res.json.id;

      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${scheduledId}/join`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(422);
    });

    it('should return 404 for non-existent conference', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${newId()}/join`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/conferences/${problemConferenceId}/join`)
        .expectStatus(401);
    });
  });

  // ─── CONFERENCE INVITES (external token flow) ──────────────────────────────

  describe('GET /conference-invites/preview', () => {
    it('should return 422 for invalid invite token format', async () => {
      await pactum.spec()
        .get('/conference-invites/preview')
        .withQueryParams({ token: 'totally-invalid-token' })
        .expectStatus(422);
    });

    it('should return 422 when token is missing', async () => {
      await pactum.spec()
        .get('/conference-invites/preview')
        .expectStatus(422);
    });
  });
});