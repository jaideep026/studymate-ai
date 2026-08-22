require('./setup');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

async function setup(email) {
  const authRes = await request(app).post('/api/auth/register').send({
    name: 'Mastery User',
    email,
    password: 'password123',
  });
  const token = authRes.body.token;

  const uploadRes = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: "Newton's Laws",
      text: "First Law: an object at rest stays at rest unless acted on by a net force. Second Law: force equals mass times acceleration. Third Law: for every action there is an equal and opposite reaction.",
    });
  const documentId = uploadRes.body.id;

  const examRes = await request(app)
    .post(`/api/documents/${documentId}/exam`)
    .set('Authorization', `Bearer ${token}`);

  return { token, documentId, questions: examRes.body.questions };
}

describe('Exam-mode weak-spot mastery tracking', () => {
  it('starts with every question untested', async () => {
    const { token, documentId } = await setup('masteryuser1@example.com');

    const res = await request(app)
      .get(`/api/documents/${documentId}/exam/mastery`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.perQuestion.every((p) => p.untested)).toBe(true);
    expect(res.body.weakQuestionIndexes.length).toBe(res.body.perQuestion.length);
  });

  it('tracks a question as weak after a wrong answer, and mastered after enough right answers', async () => {
    const { token, documentId } = await setup('masteryuser2@example.com');

    await request(app)
      .post(`/api/documents/${documentId}/exam/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionIndex: 0, correct: false });

    let res = await request(app)
      .get(`/api/documents/${documentId}/exam/mastery`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.weakQuestionIndexes).toContain(0);

    await request(app)
      .post(`/api/documents/${documentId}/exam/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionIndex: 0, correct: true });
    await request(app)
      .post(`/api/documents/${documentId}/exam/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionIndex: 0, correct: true });

    res = await request(app)
      .get(`/api/documents/${documentId}/exam/mastery`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.weakQuestionIndexes).not.toContain(0);
    const q0 = res.body.perQuestion.find((p) => p.questionIndex === 0);
    expect(q0.timesCorrect).toBe(2);
    expect(q0.timesWrong).toBe(1);
  });

  it('rejects an out-of-range question index', async () => {
    const { token, documentId } = await setup('masteryuser3@example.com');

    const res = await request(app)
      .post(`/api/documents/${documentId}/exam/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionIndex: 999, correct: true });

    expect(res.status).toBe(400);
  });
});
