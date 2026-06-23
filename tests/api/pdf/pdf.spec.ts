import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER, SECONDARY_USER } from '../../helpers/auth.helper';
import { newId } from '../../helpers/uuid.helper';

describe('PDF Export API', () => {
  let token = '';
  let token2 = '';
  let ideaId = '';
  let problemId = '';

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
        title: 'Linked Problem for PDF Tests',
        description: 'A published problem linked to the PDF export test idea.',
      })
      .expectStatus(201);

    ideaId = newId();
    await pactum.spec()
      .post('/ideas')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: ideaId,
        isPublished: true,
        stage: 'ideation',
        title: 'PDF Export Test Idea',
        description: 'A sufficiently detailed description for the PDF export endpoint test.',
        problemIds: [linkedProblemId],
      })
      .expectStatus(201);

    problemId = newId();
    await pactum.spec()
      .post('/problems')
      .withHeaders('Authorization', `Bearer ${token}`)
      .withJson({
        id: problemId,
        isPublished: true,
        stage: 'active',
        title: 'PDF Export Test Problem',
        description: 'A sufficiently detailed description for the PDF export endpoint test.',
      })
      .expectStatus(201);
  });

  // POST /ideas/{id}/export-pdf — trigger async PDF generation for an idea
  describe('POST /ideas/{id}/export-pdf', () => {
    it('should queue PDF generation and return 202', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/export-pdf`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(202);
    });

    // POST /ideas/{id}/export-pdf — non-author gets 403
    it('should return 403 when non-author tries to export PDF', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/export-pdf`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(403);
    });

    it('should return 404 for non-existent idea', async () => {
      await pactum.spec()
        .post(`/ideas/${newId()}/export-pdf`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/export-pdf`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post(`/ideas/${ideaId}/export-pdf`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });

    it('should return 400 for malformed idea ID', async () => {
      await pactum.spec()
        .post('/ideas/not-a-uuid/export-pdf')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });
  });

  // POST /problems/{id}/export-pdf — trigger async PDF generation for a problem
  describe('POST /problems/{id}/export-pdf', () => {
    it('should queue PDF generation and return 202', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/export-pdf`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(202);
    });

    // POST /problems/{id}/export-pdf — non-author gets 403
    it('should return 403 when non-author tries to export PDF', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/export-pdf`)
        .withHeaders('Authorization', `Bearer ${token2}`)
        .expectStatus(403);
    });

    it('should return 404 for non-existent problem', async () => {
      await pactum.spec()
        .post(`/problems/${newId()}/export-pdf`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/export-pdf`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .post(`/problems/${problemId}/export-pdf`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });

    it('should return 400 for malformed problem ID', async () => {
      await pactum.spec()
        .post('/problems/not-a-uuid/export-pdf')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });
  });
});