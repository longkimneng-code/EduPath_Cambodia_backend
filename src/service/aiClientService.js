import { ApiError } from '../utils/ApiError.js';

function getBaseUrl() {
  return (process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/$/, '');
}

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'edupath-internal-secret-key';
const TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 30000;

/**
 * Dispatch HTTP requests to the dedicated Ai_Service microservice
 */
async function callAiService(path, body = null, method = 'POST') {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
      },
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || `AI service returned HTTP ${response.status}`;
      const err = new ApiError(response.status, msg, data?.details);
      throw err;
    }

    return data?.data || data;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (err.name === 'AbortError') {
      throw ApiError.serviceUnavailable(`AI service request timed out after ${TIMEOUT_MS}ms`);
    }

    if (err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
      throw ApiError.serviceUnavailable(
        `AI microservice is unreachable at ${baseUrl}. Ensure Ai_Service is running.`
      );
    }

    throw ApiError.internal(err.message || 'Failed to communicate with AI microservice');
  } finally {
    clearTimeout(timer);
  }
}

function detectLanguage(text = '') {
  return /[\u1780-\u17FF]/.test(text) ? 'km' : 'en';
}

/**
 * AI Client Service
 * Acts as the bridge between Edu_backend and the Ai_Service microservice.
 */
export const aiClientService = {
  /**
   * Educational guidance chat
   */
  async chat({ message, history = [], studentProfile = null }) {
    const res = await callAiService('/api/ai/chat', { message, history, studentProfile });
    return {
      reply: res.reply || res.content,
      modelUsed: res.model,
      durationMs: res.durationMs,
      language: detectLanguage(message),
    };
  },

  /**
   * Structured university major recommendation (delegates to generateWithPrompt)
   */
  async recommendMajor({ interests = '', strengths = '', favoriteSubjects = '', careerGoals = '' }) {
    const prompt = `Based on student profile:\n- Interests: ${interests || 'General'}\n- Strengths: ${strengths || 'Motivated learner'}\n- Favorite Subjects: ${favoriteSubjects || 'Technology'}\n- Career Goals: ${careerGoals || 'Professional in Cambodia'}\n\nPlease recommend the top 3 best matching university majors in Cambodia.`;
    const res = await this.generateWithPrompt({
      prompt,
      systemInstruction: 'You are an educational counselor specializing in Cambodian higher education (CADT, RUPP, ITC).',
    });
    return {
      recommendedMajors: res.text,
      summary: res.text,
      modelUsed: res.modelUsed,
    };
  },

  /**
   * Generic prompt generation
   */
  async generateWithPrompt({ prompt, systemInstruction, temperature }) {
    const res = await callAiService('/api/ai/generate', {
      prompt,
      systemInstruction,
      temperature,
    });
    return {
      text: res.content,
      modelUsed: res.model,
      durationMs: res.durationMs,
    };
  },

  /**
   * Health check for AI microservice
   */
  async healthCheck() {
    try {
      const data = await callAiService('/health', null, 'GET');
      return {
        status: data.status === 'ok' ? 'online' : 'degraded',
        mode: 'microservice',
        service: data.service,
        uptime: data.uptime,
        chatModel: 'gemini-3.5-flash-lite',
      };
    } catch (err) {
      return {
        status: 'offline',
        mode: 'microservice',
        isConfigured: false,
        chatModel: 'unavailable',
        error: err.message,
      };
    }
  },
};
