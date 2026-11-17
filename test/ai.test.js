import 'dotenv/config';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp as createBackendApp } from '../src/app.js';
import { createApp as createAiServiceApp } from '../Ai_Service/src/app.js';

let backendServer;
let aiServer;
let base;

before(async () => {
  // Start the Ai_Service microservice on an ephemeral port
  const aiApp = createAiServiceApp();
  aiServer = aiApp.listen(0, '127.0.0.1');
  await new Promise((resolve) => aiServer.once('listening', resolve));
  const aiPort = aiServer.address().port;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${aiPort}`;

  // Start the main Edu_backend server
  backendServer = createBackendApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => backendServer.once('listening', resolve));
  base = `http://127.0.0.1:${backendServer.address().port}/api/ai`;
});

after(async () => {
  if (backendServer) {
    await new Promise((resolve) => backendServer.close(resolve));
  }
  if (aiServer) {
    await new Promise((resolve) => aiServer.close(resolve));
  }
});

test('GET /api/ai/health returns microservice online status and model', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.status, 'ok');
  assert.equal(typeof data.data.chatModel, 'string');
});

test('POST /api/ai/chat rejects empty or invalid message with 400', async () => {
  const resEmpty = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(resEmpty.status, 400);

  const resBlank = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ' }),
  });
  assert.equal(resBlank.status, 400);
});

test('POST /api/ai/recommend-major rejects empty body with 400', async () => {
  const res = await fetch(`${base}/recommend-major`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('POST /api/ai/generate rejects missing prompt with 400', async () => {
  const res = await fetch(`${base}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('POST /api/ai/chat generates educational guidance response via Ai_Service', async (t) => {
  if (!process.env.GEMINI_API_KEY) {
    t.skip('Skipping live Gemini test because GEMINI_API_KEY is not set');
    return;
  }

  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Briefly tell me what RUPP and CADT specialize in in 2 sentences.',
      history: [],
      studentProfile: {
        province: 'Phnom Penh',
        interests: 'Technology and Science',
      },
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.reply && json.data.reply.length > 10);
  assert.equal(json.data.language, 'en');
});

test('POST /api/ai/chat responds in Khmer when question is in Khmer', async (t) => {
  if (!process.env.GEMINI_API_KEY) {
    t.skip('Skipping live Gemini test because GEMINI_API_KEY is not set');
    return;
  }

  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'តើខ្ញុំគួររៀបចំខ្លួនយ៉ាងណាដើម្បីប្រឡងបាក់ឌុប?',
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.language, 'km');
  assert.ok(json.data.reply && json.data.reply.length > 10);
});

test('POST /api/ai/recommend-major returns structured major recommendations', async (t) => {
  if (!process.env.GEMINI_API_KEY) {
    t.skip('Skipping live Gemini test because GEMINI_API_KEY is not set');
    return;
  }

  const res = await fetch(`${base}/recommend-major`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interests: 'Programming, artificial intelligence, robotics',
      strengths: 'Mathematics, logical thinking',
      favoriteSubjects: 'Math and Physics',
      careerGoals: 'Software Engineer in Phnom Penh',
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.recommendedMajors || json.data.summary);
});
