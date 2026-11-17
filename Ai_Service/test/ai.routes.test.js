import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { geminiService } from '../src/services/ai/gemini.service.js';

let server;
let baseUrl;

// Mock the internal generator method so routes test completely offline
const originalGenerator = geminiService.generator;

test.before(async () => {
  geminiService.generator = async ({ contents }) => {
    return {
      text: 'Mocked successful AI reply',
      model: 'gemini-3.5-flash-lite',
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 8 },
    };
  };

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  geminiService.generator = originalGenerator;
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Health endpoint: GET /health returns liveness status & uptime', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.status, 'ok');
  assert.equal(json.service, 'ai-microservice');
  assert.equal(typeof json.uptime, 'number');
});

test('1. Successful text generation: POST /api/ai/generate returns 200 & content', async () => {
  const res = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Explain quantum computing in simple terms.',
      temperature: 0.3,
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.model, 'gemini-3.5-flash-lite');
  assert.equal(json.content, 'Mocked successful AI reply');
  assert.equal(typeof json.durationMs, 'number');
});

test('2. Successful chat generation: POST /api/ai/chat returns 200 & reply', async () => {
  const res = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello!',
      history: [
        { role: 'user', text: 'Hi' },
        { role: 'model', text: 'Hello! How can I help?' },
      ],
      systemInstruction: 'You are a helpful assistant.',
    }),
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.model, 'gemini-3.5-flash-lite');
  assert.equal(json.reply, 'Mocked successful AI reply');
  assert.equal(typeof json.durationMs, 'number');
});

test('3. Missing prompt returns HTTP 400', async () => {
  const res = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.error.includes('prompt'));
});

test('4. Empty or whitespace prompt returns HTTP 400', async () => {
  const res = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '    ' }),
  });

  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.error.includes('non-empty string'));
});

test('5. Missing message returns HTTP 400', async () => {
  const res = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.error.includes('message'));
});

test('6. Invalid temperature returns HTTP 400', async () => {
  const resHigh = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'test', temperature: 3.5 }),
  });
  assert.equal(resHigh.status, 400);

  const resString = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'test', temperature: 'hot' }),
  });
  assert.equal(resString.status, 400);
});

test('7. Invalid history returns HTTP 400', async () => {
  // Not an array
  const resNotArray = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hi', history: 'not-array' }),
  });
  assert.equal(resNotArray.status, 400);

  // Invalid role
  const resInvalidRole = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'hi',
      history: [{ role: 'admin', text: 'forbidden' }],
    }),
  });
  assert.equal(resInvalidRole.status, 400);
  const jsonRole = await resInvalidRole.json();
  assert.ok(jsonRole.error.includes('role'));

  // Empty message text
  const resEmptyText = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'hi',
      history: [{ role: 'user', text: '' }],
    }),
  });
  assert.equal(resEmptyText.status, 400);
});

test('15. Unknown routes return standardized JSON with HTTP 404', async () => {
  const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
  assert.equal(res.status, 404);

  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.error.includes('Route not found'));
});

test('16. Malformed JSON returns HTTP 400', async () => {
  const res = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"prompt": "unclosed json',
  });

  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.error.includes('Malformed JSON'));
});
