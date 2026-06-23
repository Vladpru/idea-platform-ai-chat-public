import * as pactum from 'pactum';
import { loadSession, PRIMARY_USER } from '../../helpers/auth.helper';
import { newId } from '../../helpers/uuid.helper';

describe('Notifications API', () => {
  let token = '';

  beforeAll(() => {
    token = loadSession(PRIMARY_USER).token;
  });

  // GET /notifications — list paginated notifications for the current user
  describe('GET /notifications', () => {
    it('should return notifications list', async () => {
      const res = await pactum.spec()
        .get('/notifications')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should accept limit query param', async () => {
      await pactum.spec()
        .get('/notifications')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ limit: 10 })
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/notifications')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/notifications')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // GET /notifications/unread-count — get count of unread notifications
  describe('GET /notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await pactum.spec()
        .get('/notifications/unread-count')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toHaveProperty('count');
      expect(typeof res.json.count).toBe('number');
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/notifications/unread-count')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/notifications/unread-count')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // PATCH /notifications/read-all — mark all notifications as read
  describe('PATCH /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await pactum.spec()
        .patch('/notifications/read-all')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch('/notifications/read-all')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .patch('/notifications/read-all')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // PATCH /notifications/{id}/read — mark a single notification as read
  describe('PATCH /notifications/{id}/read', () => {
    it('should return 404 for non-existent notification', async () => {
      await pactum.spec()
        .patch(`/notifications/${newId()}/read`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch(`/notifications/${newId()}/read`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .patch(`/notifications/${newId()}/read`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // DELETE /notifications/{id} — delete a single notification
  describe('DELETE /notifications/{id}', () => {
    it('should return 404 for non-existent notification', async () => {
      await pactum.spec()
        .delete(`/notifications/${newId()}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/notifications/${newId()}`)
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .delete(`/notifications/${newId()}`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // DELETE /notifications/all — delete all notifications for the current user
  describe('DELETE /notifications/all', () => {
    it('should delete all notifications and return 200', async () => {
      await pactum.spec()
        .delete('/notifications/all')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete('/notifications/all')
        .expectStatus(401);
    });

    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .delete('/notifications/all')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });
});