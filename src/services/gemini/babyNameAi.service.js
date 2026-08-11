/**
 * Baby Name AI — Gemini chat service (CareerMate-style client call).
 * UI must call this layer; do not fetch Gemini from components.
 */
import NetInfo from '@react-native-community/netinfo';
import {
  GEMINI_API_KEY,
  GEMINI_MODEL_FALLBACKS,
  isGeminiConfigured,
} from '../../config/gemini';
import {BABY_NAME_AI_SYSTEM_INSTRUCTION} from './babyNameAiSystem';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_HISTORY_TURNS = 16;
const REQUEST_TIMEOUT_MS = 45000;

const isRetryable = message => {
  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('503')
  );
};

const createMessageId = () =>
  `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Clean Gemini markdown so chat shows plain, readable text.
 */
export const sanitizeAssistantText = raw => {
  let text = String(raw || '');

  // Remove fenced code blocks wrappers if any
  text = text.replace(/```[\s\S]*?```/g, block =>
    block.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, ''),
  );

  // Headings / bold / italic / strikethrough
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/~~(.*?)~~/g, '$1');
  text = text.replace(/(^|[^\w])\*(.*?)\*(?=[^\w]|$)/g, '$1$2');
  text = text.replace(/(^|[^\w])_(.*?)_(?=[^\w]|$)/g, '$1$2');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Markdown bullets → numbered/plain lines
  text = text.replace(/^\s*[-*•]\s+/gm, '');
  text = text.replace(/^\s*\d+[.)]\s*\*+\s*/gm, match =>
    match.replace(/\*+/g, ''),
  );

  // Leftover decorative asterisks / underscore runs
  text = text.replace(/\*{1,}/g, '');
  text = text.replace(/_{3,}/g, '');

  // Tidy whitespace
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

/**
 * Map UI chat messages → Gemini contents (roles: user | model).
 */
export const toGeminiContents = (messages = []) => {
  const trimmed = messages
    .filter(
      m =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        String(m.content || '').trim(),
    )
    .slice(-MAX_HISTORY_TURNS);

  return trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{text: String(m.content).trim()}],
  }));
};

export const getBabyNameAiErrorMessage = error => {
  const msg = error instanceof Error ? error.message : String(error || '');
  const lower = msg.toLowerCase();

  if (
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('internet') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout')
  ) {
    return 'Please check your internet connection and try again.';
  }
  if (lower.includes('not configured') || lower.includes('missing')) {
    return 'AI is not configured yet. Add GEMINI_API_KEY to your .env file and restart Metro.';
  }
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied')
  ) {
    return 'Sorry, I couldn\'t generate a response right now. Please try again.';
  }
  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted')
  ) {
    return 'Sorry, I couldn\'t generate a response right now. Please try again in a moment.';
  }
  if (lower.includes('safety') || lower.includes('blocked')) {
    return 'Sorry, I couldn\'t generate a response for that request. Try asking about baby names another way.';
  }
  if (lower.includes('empty response')) {
    return 'Sorry, I couldn\'t generate a response right now. Please try again.';
  }
  return 'Sorry, I couldn\'t generate a response right now. Please try again.';
};

const fetchWithTimeout = async (url, options, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      controller?.abort();
    } catch (_) {
      // ignore
    }
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller?.signal,
    });
    return response;
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

async function callModel(modelName, contents) {
  const response = await fetchWithTimeout(
    `${API_BASE}/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        system_instruction: {
          parts: [{text: BABY_NAME_AI_SYSTEM_INSTRUCTION}],
        },
        contents,
        generationConfig: {
          temperature: 0.55,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1200,
        },
      }),
    },
  );

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error(`${response.status} Invalid response`);
  }

  if (!response.ok || data?.error) {
    throw new Error(
      data?.error?.message ||
        `${response.status} ${data?.error?.status || ''}`.trim(),
    );
  }

  const candidate = data?.candidates?.[0];
  const finishReason = String(candidate?.finishReason || '').toUpperCase();
  if (finishReason.includes('SAFETY') || finishReason.includes('BLOCK')) {
    throw new Error('Response blocked by safety filters');
  }

  const text =
    candidate?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!String(text).trim()) {
    throw new Error('Empty response from Gemini');
  }
  return sanitizeAssistantText(text);
}

/**
 * Send multi-turn chat history and return an assistant message object.
 * @param {{messages: Array<{role:string, content:string}>}} params
 */
export async function sendBabyNameChatMessage({messages} = {}) {
  const net = await NetInfo.fetch();
  if (net && net.isConnected === false) {
    throw new Error('No internet connection');
  }

  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured');
  }

  const contents = toGeminiContents(messages);
  if (!contents.length) {
    throw new Error('Cannot generate content from an empty prompt.');
  }

  let lastError;
  for (const modelName of GEMINI_MODEL_FALLBACKS) {
    try {
      const content = await callModel(modelName, contents);
      return {
        id: createMessageId(),
        role: 'assistant',
        content,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes('API_KEY_INVALID') ||
        msg.includes('API key not valid') ||
        msg.includes('not configured')
      ) {
        throw error;
      }
      if (!isRetryable(msg)) {
        throw error;
      }
      if (__DEV__) {
        console.log('[BabyNameAI] model fallback after error on', modelName);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('AI generation failed.');
}

export const createChatMessage = (role, content) => ({
  id: createMessageId(),
  role,
  content: String(content || '').trim(),
  createdAt: new Date().toISOString(),
});

export default {
  sendBabyNameChatMessage,
  getBabyNameAiErrorMessage,
  createChatMessage,
  toGeminiContents,
  sanitizeAssistantText,
};
