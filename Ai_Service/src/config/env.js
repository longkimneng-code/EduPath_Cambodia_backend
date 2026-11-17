import 'dotenv/config';

function parseInteger(name, value, defaultValue, min = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`Invalid environment variable "${name}": expected integer >= ${min}, received "${value}"`);
  }
  return parsed;
}

function parseModelList(name, value, defaultList) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return defaultList;
  }
  const models = value
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  if (models.length === 0) {
    throw new Error(`Invalid environment variable "${name}": must contain at least one valid model identifier`);
  }
  return [...new Set(models)];
}

function parseCorsOrigins(value) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return ['http://localhost:3000', 'http://localhost:5173'];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Validation logic
const apiKey = process.env.GEMINI_API_KEY?.trim();

// When running tests, we may allow mock execution if configured
const isTestEnv = process.env.NODE_ENV === 'test';
if (!apiKey && !isTestEnv) {
  throw new Error('FATAL: Missing required environment variable "GEMINI_API_KEY". Please configure it in .env');
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInteger('PORT', process.env.PORT, 5001, 1),

  // Google Gemini API
  GEMINI_API_KEY: apiKey || '',

  // Model Priority Hierarchy
  GEMINI_MODELS: parseModelList(
    'GEMINI_MODELS',
    process.env.GEMINI_MODELS,
    ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']
  ),

  // Reliability & Failover
  GEMINI_TIMEOUT_MS: parseInteger('GEMINI_TIMEOUT_MS', process.env.GEMINI_TIMEOUT_MS, 30000, 100),
  GEMINI_MAX_RETRIES_PER_MODEL: parseInteger('GEMINI_MAX_RETRIES_PER_MODEL', process.env.GEMINI_MAX_RETRIES_PER_MODEL, 1, 0),
  GEMINI_RETRY_BASE_DELAY_MS: parseInteger('GEMINI_RETRY_BASE_DELAY_MS', process.env.GEMINI_RETRY_BASE_DELAY_MS, 300, 10),
  GEMINI_RETRY_MAX_DELAY_MS: parseInteger('GEMINI_RETRY_MAX_DELAY_MS', process.env.GEMINI_RETRY_MAX_DELAY_MS, 2000, 50),

  // Request & Content Limits
  MAX_PROMPT_LENGTH: parseInteger('MAX_PROMPT_LENGTH', process.env.MAX_PROMPT_LENGTH, 20000, 1),
  MAX_HISTORY_MESSAGES: parseInteger('MAX_HISTORY_MESSAGES', process.env.MAX_HISTORY_MESSAGES, 30, 0),
  MAX_HISTORY_MESSAGE_LENGTH: parseInteger('MAX_HISTORY_MESSAGE_LENGTH', process.env.MAX_HISTORY_MESSAGE_LENGTH, 10000, 1),
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '1mb',

  // Security & CORS
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
});
