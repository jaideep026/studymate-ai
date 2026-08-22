require('./setup');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

async function registerAndLogin() {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Chat User',
    email: 'chatuser@example.com',
    password: 'password123',
  });
  return res.body.token;
}

describe('Documents + Chat API (RAG pipeline)', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });

  it('uploads a document, chunks it, and answers a grounded question', async () => {
    const token = await registerAndLogin();

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Operating Systems Notes',
        text: 'A deadlock occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process. Deadlock can be prevented using resource ordering, or avoided using the Banker\'s algorithm.',
      });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.chunkCount).toBeGreaterThan(0);

    const documentId = uploadRes.body.id;

    const askRes = await request(app)
      .post(`/api/chat/${documentId}/ask`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What is a deadlock?' });

    expect(askRes.status).toBe(201);
    expect(askRes.body.answer).toBeDefined();
    expect(askRes.body.sources.length).toBeGreaterThan(0);
    expect(Array.isArray(askRes.body.citedIndexes)).toBe(true);
    expect(askRes.body.citedIndexes.length).toBeGreaterThan(0);

    const historyRes = await request(app)
      .get(`/api/chat/${documentId}/history`)
      .set('Authorization', `Bearer ${token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.length).toBe(1);
  });

  it('returns 404 for a document owned by someone else', async () => {
    const token = await registerAndLogin();

    const otherRes = await request(app).post('/api/auth/register').send({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = otherRes.body.token;

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Private Notes', text: 'Some private content that only the owner can query.' });

    const res = await request(app)
      .post(`/api/chat/${uploadRes.body.id}/ask`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Can I see this?' });

    expect(res.status).toBe(404);
  });
});
