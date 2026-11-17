import { generateContentResilient } from '../../config/gemini.js';
import {
  SYSTEM_INSTRUCTION_BASE,
  buildChatContents,
  detectLanguage,
} from '../../prompts/geminiPrompt.js';

/**
 * Helper to construct contents incorporating Phase 2 RAG context
 */
function buildPromptWithContext(prompt, context) {
  if (!context || typeof context !== 'string' || !context.trim()) {
    return prompt;
  }
  return `[Context for RAG Retrieval]:\n${context.trim()}\n\n[User Query]:\n${prompt}`;
}

export class GeminiService {
  constructor(resilientGenerator = generateContentResilient) {
    this.generator = resilientGenerator;
  }

  /**
   * Generates single-turn text with optional Phase 2 RAG context
   */
  async generateText({ prompt, systemInstruction, temperature, context, client }) {
    const startTime = Date.now();
    const finalPrompt = buildPromptWithContext(prompt, context);

    const contents = [{ role: 'user', parts: [{ text: finalPrompt }] }];

    const result = await this.generator({
      contents,
      systemInstruction: systemInstruction || SYSTEM_INSTRUCTION_BASE,
      temperature,
      client,
    });

    const durationMs = Date.now() - startTime;
    const text = result.text || '';

    return {
      content: text,
      modelUsed: result.model,
      durationMs,
      inputTokenCount: result.usageMetadata?.promptTokenCount ?? null,
      outputTokenCount: result.usageMetadata?.candidatesTokenCount ?? null,
      characterCount: text.length,
    };
  }

  /**
   * Handles multi-turn chat with history, student profile, and bilingual counselor persona
   */
  async chat({ message, history = [], studentProfile = null, systemInstruction, context, client }) {
    const startTime = Date.now();
    const finalMessage = buildPromptWithContext(message, context);

    const contents = buildChatContents({
      message: finalMessage,
      history,
      studentProfile,
    });

    const lang = detectLanguage(message);
    const defaultInstruction = systemInstruction || `${SYSTEM_INSTRUCTION_BASE}\n\n${
      lang === 'km'
        ? 'The student is asking in Khmer. Reply entirely in clear, supportive, and natural Khmer (ភាសាខ្មែរ).'
        : 'The student is asking in English. Reply in clear, supportive English.'
    }`;

    const result = await this.generator({
      contents,
      systemInstruction: defaultInstruction,
      client,
    });

    const durationMs = Date.now() - startTime;
    const reply = result.text || '';

    return {
      reply,
      modelUsed: result.model,
      durationMs,
      language: lang,
      inputTokenCount: result.usageMetadata?.promptTokenCount ?? null,
      outputTokenCount: result.usageMetadata?.candidatesTokenCount ?? null,
      characterCount: reply.length,
    };
  }
}

export const geminiService = new GeminiService();

