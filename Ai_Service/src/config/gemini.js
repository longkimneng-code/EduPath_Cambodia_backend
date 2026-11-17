import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY || 'test-mock-key',
});

function extractStatusCode(err) {
  if (typeof err?.status === 'number') return err.status;
  if (typeof err?.statusCode === 'number') return err.statusCode;
  if (typeof err?.code === 'number') return err.code;

  const msg = String(err?.message || '');
  const jsonMatch = msg.match(/"code"\s*:\s*(\d{3})/);
  if (jsonMatch) return parseInt(jsonMatch[1], 10);

  const httpMatch = msg.match(/\b(400|401|403|404|429|500|502|503)\b/);
  if (httpMatch) return parseInt(httpMatch[1], 10);

  return null;
}

function calculateBackoffDelay(attempt, baseMs, maxMs) {
  const exponential = baseMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxMs);
  const jitter = Math.floor(Math.random() * (baseMs / 2));
  return capped + jitter;
}

/**
 * Execute resilient content generation across the configured model hierarchy
 */
async function executeGenerationWithFailover({
  contents,
  systemInstruction,
  temperature,
  client = ai,
}) {
  let lastError = null;
  const modelsAttempted = [];

  for (const model of env.GEMINI_MODELS) {
    modelsAttempted.push(model);
    let modelUnavailable = false;

    for (let attempt = 0; attempt <= env.GEMINI_MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config: {
            ...(systemInstruction && { systemInstruction }),
            ...(temperature !== undefined && { temperature }),
          },
        });

        return {
          text: response.text || '',
          model,
          usageMetadata: response.usageMetadata || null,
        };
      } catch (err) {
        lastError = err;
        const statusCode = extractStatusCode(err);
        const errMsg = err.message || '';

        // 1. Terminal client/auth errors: NEVER retry, NEVER failover
        if (statusCode === 400) {
          throw ApiError.badRequest(`Gemini invalid request: ${errMsg}`, { model });
        }
        if (statusCode === 401) {
          throw ApiError.unauthorized('Gemini authentication failed: Invalid or missing API key', { model });
        }
        if (statusCode === 403) {
          throw ApiError.forbidden('Gemini API access forbidden or permission denied', { model });
        }

        // 2. Model 404 (Not Found / Model Unavailable): Skip model immediately without retry
        if (statusCode === 404 || errMsg.toLowerCase().includes('not found')) {
          logger.warn(`Model ${model} unavailable (HTTP 404). Moving immediately to fallback...`, { model });
          modelUnavailable = true;
          break; // break retry loop to try next model
        }

        // 3. Transient rate-limit (429) or temporary server unavailability (500/503)
        const isTransient = statusCode === 429 || statusCode === 503 || statusCode === 500 || errMsg.toLowerCase().includes('high demand') || errMsg.toLowerCase().includes('quota');

        if (isTransient && attempt < env.GEMINI_MAX_RETRIES_PER_MODEL) {
          const delay = calculateBackoffDelay(attempt, env.GEMINI_RETRY_BASE_DELAY_MS, env.GEMINI_RETRY_MAX_DELAY_MS);
          logger.warn(`Model ${model} encountered transient error (${statusCode || 'transient'}). Retrying in ${delay}ms (Attempt ${attempt + 1}/${env.GEMINI_MAX_RETRIES_PER_MODEL})...`, { model, attempt });
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        logger.warn(`Model ${model} exhausted retry budget. Proceeding to fallback model...`, { model, statusCode });
        break;
      }
    }

    if (modelUnavailable) {
      continue;
    }
  }

  const finalMessage = lastError?.message || 'Upstream provider failure';
  throw ApiError.serviceUnavailable('All configured Gemini models failed. Please try again later.', {
    modelsAttempted,
    reason: finalMessage,
  });
}

/**
 * Public resilient generation function with overall upstream request timeout
 */
export async function generateContentResilient({
  contents,
  systemInstruction,
  temperature,
  timeoutMs = env.GEMINI_TIMEOUT_MS,
  client = ai,
}) {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(ApiError.serviceUnavailable(`Gemini request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      executeGenerationWithFailover({ contents, systemInstruction, temperature, client }),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
