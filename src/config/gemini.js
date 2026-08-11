/**
 * Google Gemini configuration for Baby Name AI.
 *
 * API key is loaded from project-root `.env` via Metro (`@env` → env.runtime.js).
 * Copy `.env.example` → `.env` and set GEMINI_API_KEY (same approach as CareerMateAI).
 *
 * NOTE: a client-side key is embedded in the app bundle. Prefer a backend proxy
 * for production.
 */
import {GEMINI_API_KEY as ENV_GEMINI_API_KEY, GEMINI_MODEL as ENV_GEMINI_MODEL} from '@env';

export const GEMINI_API_KEY = String(ENV_GEMINI_API_KEY || '').trim();

export const GEMINI_PREFERRED_MODEL = String(ENV_GEMINI_MODEL || '').trim();

/** Tried in order when preferred model is empty or unavailable. */
export const GEMINI_MODEL_FALLBACKS = [
  ...(GEMINI_PREFERRED_MODEL ? [GEMINI_PREFERRED_MODEL] : []),
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
].filter((name, index, arr) => name && arr.indexOf(name) === index);

export const isGeminiConfigured = () => GEMINI_API_KEY.length > 0;
