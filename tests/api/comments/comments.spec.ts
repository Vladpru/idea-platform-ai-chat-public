import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER, SECONDARY_USER } from '../../helpers/auth.helper';
import { newId, TINY_PNG } from '../../helpers/uuid.helper';

describe('Comments API', () => {
  let token = '';
  let token2 = '';
  let ideaId = '';
  let problemId = '';
  let commentId = '';

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
        title: 'Linked Problem for Comment Tests',
        description: 'A published problem linked to the comment test idea.',
      })
      .expectStatus(201);

    // create and publish an idea to attach comments to
    ideaId = newId();
    await pactum.spec()
      .post('/ideas')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: ideaId,
        isPublished: true,
        stage: 'ideation',
        title: 'Comment Test Idea',
        description: 'A sufficiently detailed description for the comments test suite.',
        problemIds: [linkedProblemId],
      })
      .expectStatus(201);

    // create a published problem for problem-comments tests
    problemId = newId();
    await pactum.spec()
      .post('/problems')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: problemId,
        isPublished: true,
        stage: 'active',
        title: 'Comment Test Problem',
        description: 'A published problem for comments endpoint testing.',
      })
      .expectStatus(201);
  });

  // GET /{entityType}/{entityId}/comments — list comments for an entity
  describe('GET /ideas/{entityId}/comments', () => {
    it('should return paginated comments for an idea', async () => {
      const res = await pactum.spec()
        .get(`/ideas/${ideaId}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should accept sort=oldest', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ sort: 'oldest', page: 1, limit: 10 })
        .expectStatus(200);
    });

    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .get(`/ideas/${newId()}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/comments`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get(`/ideas/${ideaId}/comments`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // GET /problems/{entityId}/comments — list comments for a problem
  describe('GET /problems/{entityId}/comments', () => {
    it('should return comments for a problem', async () => {
      const res = await pactum.spec()
        .get(`/problems/${problemId}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .get(`/problems/${newId()}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/problems/${problemId}/comments`)
        .expectStatus(401);
    });
  });

  // POST /{entityType}/{entityId}/comments — create a comment on an entity
  describe('POST /ideas/{entityId}/comments', () => {
    it('should create a comment on an idea', async () => {
      const res = await pactum.spec()
        .post(`/ideas/${ideaId}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('content', 'This is a QA test comment on the idea.')
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('id');
      commentId = res.json.id ?? '';
    });

    it('should return 422 when content is empty', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('content', '')
        .expectStatus(422);
    });

    it('should return 404 when idea does not exist', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/comments`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('content', 'Comment on ghost idea.')
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/comments`)
        .withMultiPartFormData('content', 'Unauthorized comment.')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/comments`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withMultiPartFormData('content', 'Forged token comment.')
        .expectStatus(401);
    });
  });

  // POST /comments/{commentId}/like — toggle like on a comment
  describe('POST /comments/{commentId}/like', () => {
    it('should toggle like on a comment', async () => {
      await pactum.spec()
        .post(`/comments/${commentId}/like`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(200);
    });

    it('should toggle like off (unlike) on a comment', async () => {
      await pactum.spec()
        .post(`/comments/${commentId}/like`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(200);
    });

    it('should return 404 for non-existent comment', async () => {
      await pactum.spec()
        .post(`/comments/${newId()}/like`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/comments/${commentId}/like`)
        .expectStatus(401);
    });
  });

  // PATCH /comments/{commentId} — update a comment (author only)
  describe('PATCH /comments/{commentId}', () => {
    it('should update comment content', async () => {
      const res = await pactum.spec()
        .patch(`/comments/${commentId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('content', 'Updated QA test comment content.')
        .expectStatus(200) as any;
      expect(res.json).toHaveProperty('id', commentId);
    });

    it('should return 422 when updated content is empty', async () => {
      await pactum.spec()
        .patch(`/comments/${commentId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('content', '')
        .expectStatus(422);
    });

    it('should return 403 when non-author tries to update', async () => {
      await pactum.spec()
        .patch(`/comments/${commentId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .withMultiPartFormData('content', 'Unauthorized update attempt.')
        .expectStatus(403);
    });

    it('should return 404 for non-existent comment', async () => {
      await pactum.spec()
        .patch(`/comments/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('content', 'Ghost comment.')
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/comments/${commentId}`)
        .withMultiPartFormData('content', 'No token.')
        .expectStatus(401);
    });
  });

  // DELETE /comments/{commentId} — delete a comment (author only)
  describe('DELETE /comments/{commentId}', () => {
    it('should return 403 when non-author tries to delete', async () => {
      await pactum.spec()
        .delete(`/comments/${commentId}`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(403);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/comments/${commentId}`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .delete(`/comments/${commentId}`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });

    it('should delete the comment', async () => {
      await pactum.spec()
        .delete(`/comments/${commentId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    it('should return 404 when comment no longer exists', async () => {
      await pactum.spec()
        .delete(`/comments/${commentId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });
  });
});