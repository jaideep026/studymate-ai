require('./setup');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

describe('Stats API (traffic assessment)', () => {
  it('rejects requests without the admin key', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });

  it('rejects requests with the wrong admin key', async () => {
    const res = await request(app).get('/api/stats').set('x-admin-key', 'wrong-key');
    expect(res.status).toBe(401);
  });

  it('returns aggregate totals for the right admin key', async () => {
    // JWT_SECRET doubles as the default admin key when ADMIN_KEY isn't set.
    await request(app).post('/api/auth/register').send({
      name: 'Stats User',
      email: 'statsuser@example.com',
      password: 'password123',
    });

    const res = await request(app).get('/api/stats').set('x-admin-key', process.env.JWT_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.totals).toBeDefined();
    expect(res.body.totals.users).toBeGreaterThanOrEqual(1);
    expect(res.body.visitsLast7Days).toHaveLength(7);
    expect(res.body.newUsersLast7Days).toHaveLength(7);
  });
});
