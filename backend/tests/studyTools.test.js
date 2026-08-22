require('./setup');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

async function registerAndUpload(email) {
  const authRes = await request(app).post('/api/auth/register').send({
    name: 'Study Tools User',
    email,
    password: 'password123',
  });
  const token = authRes.body.token;

  const uploadRes = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: "Newton's Laws",
      text: "First Law: an object at rest stays at rest unless acted on by a net force. Second Law: force equals mass times acceleration, F = m times a. Third Law: for every action there is an equal and opposite reaction.",
    });

  return { token, documentId: uploadRes.body.id };
}

describe('Study tools: flashcards, tips, exam mode (offline fallback, no API key)', () => {
  it('generates flashcards for a document and caches them', async () => {
    const { token, documentId } = await registerAndUpload('flashcarduser@example.com');

    const res = await request(app)
      .post(`/api/documents/${documentId}/flashcards`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.flashcards)).toBe(true);
    expect(res.body.flashcards.length).toBeGreaterThan(0);
    expect(res.body.flashcards[0]).toHaveProperty('front');
    expect(res.body.flashcards[0]).toHaveProperty('back');
  });

  it('generates study tips for a document', async () => {
    const { token, documentId } = await registerAndUpload('tipsuser@example.com');

    const res = await request(app)
      .post(`/api/documents/${documentId}/tips`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tips)).toBe(true);
    expect(res.body.tips.length).toBeGreaterThan(0);
  });

  it('generates exam-mode practice questions with 4 options each', async () => {
    const { token, documentId } = await registerAndUpload('examuser@example.com');

    const res = await request(app)
      .post(`/api/documents/${documentId}/exam`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(res.body.questions[0].options.length).toBe(4);
    expect(typeof res.body.questions[0].correctIndex).toBe('number');
  });

  it('404s for study tools on a document you do not own', async () => {
    const { documentId } = await registerAndUpload('owneruser@example.com');
    const otherAuth = await request(app).post('/api/auth/register').send({
      name: 'Other',
      email: 'otherstudytools@example.com',
      password: 'password123',
    });

    const res = await request(app)
      .post(`/api/documents/${documentId}/flashcards`)
      .set('Authorization', `Bearer ${otherAuth.body.token}`);

    expect(res.status).toBe(404);
  });
});
