import * as pactum from 'pactum';
import { loadSession, registerAndLogin, PRIMARY_USER, SECONDARY_USER } from '../../helpers/auth.helper';
import { TINY_PNG } from '../../helpers/uuid.helper';

describe('Users API', () => {
  let token = '';
  let userId = '';
  let secondUserId = '';

  beforeAll(async () => {
    const s1 = loadSession(PRIMARY_USER);
    const s2 = loadSession(SECONDARY_USER);
    token = s1.token;

    const res1 = await pactum.spec()
      .get('/users/me')
      .withHeaders('Authorization', `Bearer ${token}`)
      .expectStatus(200) as any;
    userId = res1?.json?.id ?? '';

    const res2 = await pactum.spec()
      .get('/users/me')
      .withHeaders('Authorization', `Bearer ${s2.token}`)
      .expectStatus(200) as any;
    secondUserId = res2?.json?.id ?? '';
  });

  // GET /users/me — return the profile of the currently authenticated user
  describe('GET /users/me', () => {
    it('should return the current user profile', async () => {
      const res = await pactum.spec()
        .get('/users/me')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;

      expect(res.json).toHaveProperty('id');
      expect(res.json).toHaveProperty('email');
      expect(res.json).toHaveProperty('firstName');
      expect(res.json).toHaveProperty('lastName');
    });

    // GET /users/me — reject request without auth token
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get('/users/me')
        .expectStatus(401);
    });

    // GET /users/me — reject request with a forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get('/users/me')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });
  });

  // PATCH /users/me — update profile fields of the current user
  describe('PATCH /users/me', () => {
    it('should update firstName, lastName, and bio', async () => {
      const res = await pactum.spec()
        .patch('/users/me')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ firstName: 'Updated', lastName: 'Name', bio: 'QA bio text' })
        .expectStatus(200) as any;

      expect(res.json.firstName).toBe('Updated');
      expect(res.json.lastName).toBe('Name');
    });

    // PATCH /users/me — partial update with only the bio field
    it('should allow partial update with only bio', async () => {
      await pactum.spec()
        .patch('/users/me')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ bio: 'Only bio updated' })
        .expectStatus(200);
    });

    // PATCH /users/me — reject bio that exceeds 300 characters
    it('should return 400 when bio exceeds max length', async () => {
      await pactum.spec()
        .patch('/users/me')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ bio: 'x'.repeat(301) })
        .expectStatus(400);
    });

    // PATCH /users/me — reject request without token
    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch('/users/me')
        .withJson({ firstName: 'Hacker' })
        .expectStatus(401);
    });

    // PATCH /users/me — reject request with forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .patch('/users/me')
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .withJson({ firstName: 'Hacker' })
        .expectStatus(401);
    });
  });

  // POST /users/me/avatar — upload a new avatar image for the current user
  describe('POST /users/me/avatar', () => {
    it('should upload a PNG avatar successfully', async () => {
      await pactum.spec()
        .post('/users/me/avatar')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withMultiPartFormData('file', TINY_PNG, { filename: 'avatar.png', contentType: 'image/png' })
        .expectStatus(200);
    });

    // POST /users/me/avatar — reject upload without a file
    it('should return 400 when no file is provided', async () => {
      await pactum.spec()
        .post('/users/me/avatar')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });

    // POST /users/me/avatar — reject unauthenticated upload
    it('should return 401 without token', async () => {
      await pactum.spec()
        .post('/users/me/avatar')
        .withMultiPartFormData('file', TINY_PNG, { filename: 'avatar.png', contentType: 'image/png' })
        .expectStatus(401);
    });
  });

  // DELETE /users/me/avatar — remove the avatar of the current user
  describe('DELETE /users/me/avatar', () => {
    it('should remove the current user avatar', async () => {
      await pactum.spec()
        .delete('/users/me/avatar')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    // DELETE /users/me/avatar — reject request without token
    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete('/users/me/avatar')
        .expectStatus(401);
    });
  });

  // PATCH /users/me/password — change password for a user with a local password
  describe('PATCH /users/me/password', () => {
    it('should change password with correct currentPassword', async () => {
      // Use a fresh unique user so the shared primary session password stays unchanged
      const session = await registerAndLogin(`pwchange${Date.now()}`);

      await pactum.spec()
        .patch('/users/me/password')
        .withHeaders('Authorization', `Bearer ${session.token}`)
        .withJson({ currentPassword: session.password, newPassword: 'NewPass@9999' })
        .expectStatus(200);
    });

    // PATCH /users/me/password — reject change when currentPassword is wrong
    it('should return 401 when currentPassword is incorrect', async () => {
      await pactum.spec()
        .patch('/users/me/password')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ currentPassword: 'WrongCurrent@1', newPassword: 'NewPass@9999' })
        .expectStatus(401);
    });

    // PATCH /users/me/password — reject new password shorter than 8 chars
    it('should return 400 when newPassword is too short', async () => {
      await pactum.spec()
        .patch('/users/me/password')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ currentPassword: 'Test@12345', newPassword: 'short' })
        .expectStatus(400);
    });

    // PATCH /users/me/password — reject request without token
    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch('/users/me/password')
        .withJson({ currentPassword: 'Test@12345', newPassword: 'NewPass@9999' })
        .expectStatus(401);
    });
  });

  // PATCH /users/me/theme — update the theme preference for the current user
  describe('PATCH /users/me/theme', () => {
    it('should update theme to DARK', async () => {
      await pactum.spec()
        .patch('/users/me/theme')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ theme: 'DARK' })
        .expectStatus(200);
    });

    it('should update theme to SYSTEM', async () => {
      await pactum.spec()
        .patch('/users/me/theme')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ theme: 'SYSTEM' })
        .expectStatus(200);
    });

    it('should update theme to LIGHT', async () => {
      await pactum.spec()
        .patch('/users/me/theme')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ theme: 'LIGHT' })
        .expectStatus(200);
    });

    it('should return 400 for invalid theme value', async () => {
      await pactum.spec()
        .patch('/users/me/theme')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({ theme: 'INVALID_THEME' })
        .expectStatus(400);
    });

    it('should return 400 when theme is missing', async () => {
      await pactum.spec()
        .patch('/users/me/theme')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(400);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch('/users/me/theme')
        .withJson({ theme: 'SYSTEM' })
        .expectStatus(401);
    });
  });

  // PATCH /users/me/notification-preferences — update notification preferences
  describe('PATCH /users/me/notification-preferences', () => {
    it('should update notification preferences', async () => {
      await pactum.spec()
        .patch('/users/me/notification-preferences')
        .withHeaders('Authorization', `Bearer ${token}`)
        .withJson({})
        .expectStatus(200);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .patch('/users/me/notification-preferences')
        .withJson({})
        .expectStatus(401);
    });
  });

  // POST /users — create a user via the public admin endpoint (no auth required)
  describe('POST /users', () => {
    it('should create a user and return the new record', async () => {
      const res = await pactum.spec()
        .post('/users')
        .withJson({ email: `direct${Date.now()}@qa-test.dev`, password: 'Direct@12345' })
        .expectStatus(201) as any;

      expect(res.json).toHaveProperty('id');
      expect(res.json).toHaveProperty('email');
    });

    // POST /users — reject creation with invalid email format
    it('should return 400 for invalid email', async () => {
      await pactum.spec()
        .post('/users')
        .withJson({ email: 'bad-email', password: 'Direct@12345' })
        .expectStatus(400);
    });

    // POST /users — reject creation when password field is missing
    it('should return 400 when password is missing', async () => {
      await pactum.spec()
        .post('/users')
        .withJson({ email: `nopwd${Date.now()}@qa-test.dev` })
        .expectStatus(400);
    });

    // POST /users — reject creation when email field is missing
    it('should return 400 when email is missing', async () => {
      await pactum.spec()
        .post('/users')
        .withJson({ password: 'Direct@12345' })
        .expectStatus(400);
    });
  });

  // GET /users — list all users (public endpoint, no auth required)
  describe('GET /users', () => {
    it('should return an array of users', async () => {
      const res = await pactum.spec()
        .get('/users')
        .expectStatus(200) as any;

      expect(Array.isArray(res.json)).toBe(true);
    });

    it('should return user objects with id and email fields', async () => {
      const res = await pactum.spec()
        .get('/users')
        .expectStatus(200) as any;

      if (Array.isArray(res.json) && res.json.length > 0) {
        expect(res.json[0]).toHaveProperty('id');
        expect(res.json[0]).toHaveProperty('email');
      }
    });
  });

  // GET /users/{id} — retrieve a public profile by UUID
  describe('GET /users/{id}', () => {
    it('should return user profile by ID', async () => {
      const res = await pactum.spec()
        .get(`/users/${secondUserId}`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;

      expect(res.json).toHaveProperty('id', secondUserId);
      expect(res.json).toHaveProperty('email');
      expect(res.json).toHaveProperty('firstName');
    });

    // GET /users/{id} — return 404 for an unknown UUID
    it('should return 404 for non-existent user', async () => {
      await pactum.spec()
        .get('/users/00000000-0000-7000-a000-000000000000')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    // GET /users/{id} — return 401 when not authenticated
    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/users/${secondUserId}`)
        .expectStatus(401);
    });

    // GET /users/{id} — return 401 with forged token
    it('should return 401 with forged token', async () => {
      await pactum.spec()
        .get(`/users/${secondUserId}`)
        .withHeaders('Authorization', 'Bearer forged.jwt.token')
        .expectStatus(401);
    });

    // GET /users/{id} — return 400 for a non-UUID path parameter
    it('should return 400 for malformed ID', async () => {
      await pactum.spec()
        .get('/users/not-a-uuid')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(400);
    });
  });

  // GET /users/{id}/contributions — list published ideas and problems by user
  describe('GET /users/{id}/contributions', () => {
    it('should return paginated contributions for a user', async () => {
      const res = await pactum.spec()
        .get(`/users/${userId}/contributions`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should filter contributions by type=idea', async () => {
      await pactum.spec()
        .get(`/users/${userId}/contributions`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ type: 'idea', skip: 0, take: 5 })
        .expectStatus(200);
    });

    it('should filter contributions by tab=joined', async () => {
      await pactum.spec()
        .get(`/users/${userId}/contributions`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .withQueryParams({ tab: 'joined' })
        .expectStatus(200);
    });

    it('should return 404 for non-existent user', async () => {
      await pactum.spec()
        .get('/users/00000000-0000-7000-a000-000000000001/contributions')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/users/${userId}/contributions`)
        .expectStatus(401);
    });
  });

  // GET /users/{id}/statistics — get statistics for a user
  describe('GET /users/{id}/statistics', () => {
    it('should return statistics for a user', async () => {
      const res = await pactum.spec()
        .get(`/users/${userId}/statistics`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200) as any;
      expect(res.json).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      await pactum.spec()
        .get('/users/00000000-0000-7000-a000-000000000001/statistics')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .get(`/users/${userId}/statistics`)
        .expectStatus(401);
    });
  });

  // POST /users/{id}/subscribe — subscribe to a user
  describe('POST /users/{id}/subscribe', () => {
    it('should subscribe to another user', async () => {
      await pactum.spec()
        .post(`/users/${secondUserId}/subscribe`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(200);
    });

    it('should return 409 when already subscribed', async () => {
      await pactum.spec()
        .post(`/users/${secondUserId}/subscribe`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(409);
    });

    it('should return 404 for non-existent user', async () => {
      await pactum.spec()
        .post('/users/00000000-0000-7000-a000-000000000001/subscribe')
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    // Business logic: subscribing to yourself should be rejected
    it('should return 409 or 400 when trying to subscribe to yourself', async () => {
      await pactum.spec()
        .post(`/users/${userId}/subscribe`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expect(ctx => expect([400, 409, 422]).toContain(ctx.res.statusCode));
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .post(`/users/${secondUserId}/subscribe`)
        .expectStatus(401);
    });
  });

  // DELETE /users/{id}/subscribe — unsubscribe from a user
  describe('DELETE /users/{id}/subscribe', () => {
    it('should unsubscribe from a user', async () => {
      await pactum.spec()
        .delete(`/users/${secondUserId}/subscribe`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(204);
    });

    it('should return 404 when not subscribed', async () => {
      await pactum.spec()
        .delete(`/users/${secondUserId}/subscribe`)
        .withHeaders('Authorization', `Bearer ${token}`)
        .expectStatus(404);
    });

    it('should return 401 without token', async () => {
      await pactum.spec()
        .delete(`/users/${secondUserId}/subscribe`)
        .expectStatus(401);
    });
  });

});