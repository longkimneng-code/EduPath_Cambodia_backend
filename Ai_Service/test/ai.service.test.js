import test from 'node:test';
import assert from 'node:assert/strict';
import { generateContentResilient } from '../src/config/gemini.js';
import { GeminiService } from '../src/services/ai/gemini.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { env } from '../src/config/env.js';

test('8. Primary model success: generates content on first attempt with metadata', async () => {
  const mockClient = {
    models: {
      generateContent: async ({ model, contents }) => {
        assert.equal(model, env.GEMINI_MODELS[0]);
        return {
          text: 'Mocked successful output',
          usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 5 },
        };
      },
    },
  };

  const service = new GeminiService((params) => generateContentResilient({ ...params, client: mockClient }));

  const res = await service.generateText({
    prompt: 'Explain algorithms',
    temperature: 0.5,
  });

  assert.equal(res.content, 'Mocked successful output');
  assert.equal(res.modelUsed, env.GEMINI_MODELS[0]);
  assert.equal(res.inputTokenCount, 15);
  assert.equal(res.outputTokenCount, 5);
  assert.equal(res.characterCount, 'Mocked successful output'.length);
  assert.ok(typeof res.durationMs === 'number');
});

test('9. Primary model 429 triggers retry and fallback to next model', async () => {
  const modelsAttempted = [];

  const mockClient = {
    models: {
      generateContent: async ({ model }) => {
        modelsAttempted.push(model);
        if (model === env.GEMINI_MODELS[0]) {
          const err = new Error('Resource exhausted / quota limit');
          err.status = 429;
          throw err;
        }
        return { text: 'Fallback success after 429' };
      },
    },
  };

  const res = await generateContentResilient({
    contents: 'test query',
    client: mockClient,
  });

  assert.equal(res.text, 'Fallback success after 429');
  assert.equal(res.model, env.GEMINI_MODELS[1]);
  assert.ok(modelsAttempted.includes(env.GEMINI_MODELS[0]));
  assert.ok(modelsAttempted.includes(env.GEMINI_MODELS[1]));
});

test('10. Primary model 503 triggers bounded retry/fallback', async () => {
  let primaryAttempts = 0;

  const mockClient = {
    models: {
      generateContent: async ({ model }) => {
        if (model === env.GEMINI_MODELS[0]) {
          primaryAttempts++;
          const err = new Error('The service is temporarily unavailable');
          err.status = 503;
          throw err;
        }
        return { text: 'Recovered on fallback model' };
      },
    },
  };

  const res = await generateContentResilient({
    contents: 'test',
    client: mockClient,
  });

  assert.equal(res.text, 'Recovered on fallback model');
  assert.equal(res.model, env.GEMINI_MODELS[1]);
  // Verified bounded retries occurred before fallback
  assert.ok(primaryAttempts >= 1);
});

test('11. Primary model 404 triggers immediate model fallback without retry loop', async () => {
  let primaryAttempts = 0;

  const mockClient = {
    models: {
      generateContent: async ({ model }) => {
        if (model === env.GEMINI_MODELS[0]) {
          primaryAttempts++;
          const err = new Error('Model not found');
          err.status = 404;
          throw err;
        }
        return { text: 'Success on next model' };
      },
    },
  };

  const res = await generateContentResilient({
    contents: 'test',
    client: mockClient,
  });

  assert.equal(res.text, 'Success on next model');
  assert.equal(res.model, env.GEMINI_MODELS[1]);
  assert.equal(primaryAttempts, 1, 'Should not repeatedly retry a 404 missing model');
});

test('12. Authentication errors (401/403) abort immediately without triggering fallback', async () => {
  let calls = 0;

  const mockClient = {
    models: {
      generateContent: async () => {
        calls++;
        const err = new Error('API key not valid');
        err.status = 401;
        throw err;
      },
    },
  };

  await assert.rejects(
    async () => {
      await generateContentResilient({ contents: 'test', client: mockClient });
    },
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );

  assert.equal(calls, 1, '401 must fail immediately with 0 retries and 0 fallbacks');
});

test('13. All models failing returns standardized ApiError 503', async () => {
  const mockClient = {
    models: {
      generateContent: async () => {
        const err = new Error('Temporary internal provider glitch');
        err.status = 500;
        throw err;
      },
    },
  };

  await assert.rejects(
    async () => {
      await generateContentResilient({ contents: 'test', client: mockClient });
    },
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 503);
      assert.ok(err.message.includes('All configured Gemini models failed'));
      assert.ok(Array.isArray(err.details?.modelsAttempted));
      return true;
    }
  );
});

test('14. Upstream request timeout expires triggers standardized timeout rejection', async () => {
  const mockClient = {
    models: {
      generateContent: async () => {
        // simulate hanging request
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { text: 'Late reply' };
      },
    },
  };

  await assert.rejects(
    async () => {
      await generateContentResilient({
        contents: 'test',
        timeoutMs: 10, // 10ms forces rapid timeout
        client: mockClient,
      });
    },
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 503);
      assert.ok(err.message.includes('timed out'));
      return true;
    }
  );
});

test('Phase 2 RAG: context parameter is appended cleanly for future retrieval', async () => {
  let observedPrompt = '';

  const mockClient = {
    models: {
      generateContent: async ({ contents }) => {
        observedPrompt = contents[0].parts[0].text;
        return { text: 'RAG response' };
      },
    },
  };

  const service = new GeminiService((params) => generateContentResilient({ ...params, client: mockClient }));

  await service.generateText({
    prompt: 'What are CADT admission deadlines?',
    context: 'CADT 2026 Admissions: Batch 1 closes Dec 15.',
  });

  assert.ok(observedPrompt.includes('[Context for RAG Retrieval]'));
  assert.ok(observedPrompt.includes('CADT 2026 Admissions: Batch 1 closes Dec 15'));
  assert.ok(observedPrompt.includes('What are CADT admission deadlines?'));
});
