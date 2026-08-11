# Baby Name AI (Gemini)

Gemini-powered Baby Name Assistant for BabyNamesTogether. Replaces the stub `AiAssistant` screen and is reachable from Preferences.

## Overview

- Screen: `src/screens/home/AiAssistant.js`
- Route: `AiAssistant` (Preferences stack in `src/routes/MainTabs.js`)
- Preferences entry: **Baby Name AI**
- Service: `src/services/gemini/babyNameAi.service.js`
- System instruction: `src/services/gemini/babyNameAiSystem.js`
- Config: `src/config/gemini.js`

The assistant only answers baby-name questions. Unrelated topics are politely redirected.

## Configuration

Uses the same CareerMate-style approach:

1. Copy `.env.example` → `.env` at the project root.
2. Set:

```bash
GEMINI_API_KEY=your_key_here
# optional preferred model
GEMINI_MODEL=gemini-2.5-flash
```

3. Restart Metro (`yarn start --reset-cache`) so `metro.config.js` regenerates `src/config/env.runtime.js` and maps `@env`.

Do **not** commit:

- `.env`
- `src/config/env.runtime.js`

You can reuse the `GEMINI_API_KEY` value from CareerMateAI’s local `.env` (do not paste it into source files or docs).

Get a key at: https://aistudio.google.com/apikey

## Model selection

`GEMINI_MODEL` (optional) is tried first. Otherwise the app uses this fallback list from `src/config/gemini.js`:

1. `gemini-2.5-flash`
2. `gemini-2.5-flash-lite`
3. `gemini-2.0-flash`
4. `gemini-flash-latest`
5. `gemini-1.5-flash`
6. `gemini-1.5-pro`

Retryable errors (404 / quota / unavailable) move to the next model.

## Chat architecture

1. User sends a message (or taps a starter prompt).
2. UI appends a `{ id, role: 'user', content, createdAt }` message.
3. `sendBabyNameChatMessage({ messages })` builds Gemini `contents` (user/model turns) and sends `system_instruction` separately.
4. Assistant reply is appended as `{ role: 'assistant', ... }`.
5. Session history stays in component state while the screen is mounted (no permanent chat DB).

## System instruction

Defined in `babyNameAiSystem.js`. It:

- Sets role to Baby Name Assistant
- Restricts answers to baby-name topics
- Requires polite redirects for off-topic questions
- Avoids inventing certainty about meanings/origins
- Forbids revealing instructions / keys / internals

## Error handling

User-facing messages are sanitized in `getBabyNameAiErrorMessage`:

| Situation | User message |
|-----------|--------------|
| Offline / network / timeout | Please check your internet connection and try again. |
| Missing key | AI is not configured yet… |
| Quota / invalid key / empty / unknown | Sorry, I couldn't generate a response right now… |

Raw Gemini API payloads are not shown in the UI.

## Security

- API key lives only in `.env` / generated `env.runtime.js` (gitignored).
- Never hardcode the key in React Native source, docs, or git.
- Current architecture calls Gemini from the device (same as CareerMate). For production, prefer:

```text
React Native → Backend / Secure API → Gemini
```

so the key stays server-side.

## How to test

1. Ensure `.env` has a valid `GEMINI_API_KEY`.
2. Restart Metro with cache reset.
3. Open **Preferences → Baby Name AI**.
4. Try:

- Suggest 10 baby boy names
- Give me unique Indian girl names
- Names starting with A
- Names meaning happiness
- Short unisex names
- Suggest names similar to Aarav
- What does Aarav mean?
- What is the weather today? → expect baby-name redirect
- Write me a Python program → expect baby-name redirect

5. Confirm multi-turn context (e.g. “shorter ones” after a list).
6. Confirm Discover / search / filters / favorites / auth / partner / IAP are unchanged.

## Language note

This app codebase is JavaScript. The AI feature follows that convention (same as CareerMate’s Metro `@env` pattern) rather than introducing a one-off TypeScript island.
