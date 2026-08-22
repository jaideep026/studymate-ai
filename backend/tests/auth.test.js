require('./setup');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

describe('Auth API', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jaideep Kommineni',
      email: 'jaideep@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jaideep@example.com');
  });

  it('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'dup@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'B',
      email: 'dup@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'wrongpw@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpw@example.com',
      password: 'nope',
    });

    expect(res.status).toBe(401);
  });
});
