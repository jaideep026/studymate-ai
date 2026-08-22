require('./setup');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

async function registerAndLogin(email) {
  const res = await request(app).post('/api/auth/register').send({
    name: 'File Upload User',
    email,
    password: 'password123',
  });
  return res.body.token;
}

const fixture = (name) => path.join(__dirname, 'fixtures', name);

describe('Document file upload (PDF / PPTX / DOCX)', () => {
  it('extracts text from an uploaded DOCX and chunks it', async () => {
    const token = await registerAndLogin('docxuser@example.com');
    const res = await request(app)
      .post('/api/documents/file')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('sample.docx'));

    expect(res.status).toBe(201);
    expect(res.body.sourceType).toBe('docx');
    expect(res.body.chunkCount).toBeGreaterThan(0);
  });

  it('extracts text from an uploaded PPTX and chunks it', async () => {
    const token = await registerAndLogin('pptxuser@example.com');
    const res = await request(app)
      .post('/api/documents/file')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('sample.pptx'));

    expect(res.status).toBe(201);
    expect(res.body.sourceType).toBe('pptx');
    expect(res.body.chunkCount).toBeGreaterThan(0);
  });

  it('extracts text from an uploaded PDF and chunks it', async () => {
    const token = await registerAndLogin('pdfuser@example.com');
    const res = await request(app)
      .post('/api/documents/file')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('sample.pdf'));

    expect(res.status).toBe(201);
    expect(res.body.sourceType).toBe('pdf');
    expect(res.body.chunkCount).toBeGreaterThan(0);
  });

  it('rejects an unsupported file type', async () => {
    const token = await registerAndLogin('badfileuser@example.com');
    const res = await request(app)
      .post('/api/documents/file')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('just some plain text'), 'notes.txt');

    expect(res.status).toBe(400);
  });

  it('rejects a request with no file attached', async () => {
    const token = await registerAndLogin('nofileuser@example.com');
    const res = await request(app)
      .post('/api/documents/file')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
