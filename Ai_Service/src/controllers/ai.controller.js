import { geminiService } from '../services/ai/gemini.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export class AiController {
  constructor(service = geminiService) {
    this.service = service;
  }

  generate = async (req, res) => {
    const { prompt, systemInstruction, temperature, context } = req.body;

    if (prompt === undefined || prompt === null) {
      throw ApiError.badRequest('Field "prompt" is required');
    }

    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw ApiError.badRequest('Field "prompt" must be a non-empty string');
    }

    if (prompt.length > env.MAX_PROMPT_LENGTH) {
      throw ApiError.badRequest(`Field "prompt" exceeds maximum allowed length of ${env.MAX_PROMPT_LENGTH} characters`);
    }

    if (temperature !== undefined) {
      if (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
        throw ApiError.badRequest('Field "temperature" must be a finite number between 0.0 and 2.0');
      }
    }

    if (systemInstruction !== undefined && typeof systemInstruction !== 'string') {
      throw ApiError.badRequest('Field "systemInstruction" must be a string');
    }

    if (context !== undefined && typeof context !== 'string') {
      throw ApiError.badRequest('Field "context" must be a string');
    }

    const result = await this.service.generateText({
      prompt: prompt.trim(),
      systemInstruction,
      temperature,
      context,
    });

    return res.status(200).json({
      success: true,
      model: result.modelUsed,
      durationMs: result.durationMs,
      content: result.content,
    });
  };

  chat = async (req, res) => {
    const { message, history, studentProfile, systemInstruction, context } = req.body;

    if (message === undefined || message === null) {
      throw ApiError.badRequest('Field "message" is required');
    }

    if (typeof message !== 'string' || !message.trim()) {
      throw ApiError.badRequest('Field "message" must be a non-empty string');
    }

    if (message.length > env.MAX_PROMPT_LENGTH) {
      throw ApiError.badRequest(`Field "message" exceeds maximum allowed length of ${env.MAX_PROMPT_LENGTH} characters`);
    }

    if (history !== undefined) {
      if (!Array.isArray(history)) {
        throw ApiError.badRequest('Field "history" must be an array of messages');
      }

      if (history.length > env.MAX_HISTORY_MESSAGES) {
        throw ApiError.badRequest(`Field "history" cannot exceed ${env.MAX_HISTORY_MESSAGES} messages`);
      }

      for (let i = 0; i < history.length; i++) {
        const item = history[i];
        if (!item || typeof item !== 'object') {
          throw ApiError.badRequest(`History item at index ${i} must be an object`);
        }

        if (item.role !== 'user' && item.role !== 'model') {
          throw ApiError.badRequest(`History item at index ${i} has invalid role "${item.role}". Must be "user" or "model"`);
        }

        if (typeof item.text !== 'string' || !item.text.trim()) {
          throw ApiError.badRequest(`History item at index ${i} must have a non-empty string "text"`);
        }

        if (item.text.length > env.MAX_HISTORY_MESSAGE_LENGTH) {
          throw ApiError.badRequest(`History item at index ${i} exceeds maximum length of ${env.MAX_HISTORY_MESSAGE_LENGTH} characters`);
        }
      }
    }

    if (studentProfile !== undefined && studentProfile !== null && (typeof studentProfile !== 'object' || Array.isArray(studentProfile))) {
      throw ApiError.badRequest('Field "studentProfile" must be an object');
    }

    if (systemInstruction !== undefined && typeof systemInstruction !== 'string') {
      throw ApiError.badRequest('Field "systemInstruction" must be a string');
    }

    if (context !== undefined && typeof context !== 'string') {
      throw ApiError.badRequest('Field "context" must be a string');
    }

    const result = await this.service.chat({
      message: message.trim(),
      history: history || [],
      studentProfile,
      systemInstruction,
      context,
    });

    return res.status(200).json({
      success: true,
      model: result.modelUsed,
      durationMs: result.durationMs,
      reply: result.reply,
      language: result.language,
    });
  };
}

export const aiController = new AiController();
