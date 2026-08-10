import Tts from 'react-native-tts';

let initialized = false;

async function ensureTtsReady() {
  if (initialized) {
    return;
  }
  try {
    await Tts.setDefaultLanguage('en-US');
  } catch (e) {
    // device may not have en-US; continue with default
  }
  try {
    await Tts.setDefaultRate(0.42, true);
  } catch (e) {
    // ignore
  }
  try {
    await Tts.setDefaultPitch(1.0);
  } catch (e) {
    // ignore
  }
  initialized = true;
}

/**
 * Speak a baby name (and optional phonetic hint) using device TTS.
 */
export async function speakNamePronunciation(name, phonetic) {
  const spoken = String(name || '').trim();
  if (!spoken) {
    return;
  }
  try {
    await ensureTtsReady();
    await Tts.stop();
    // Prefer the display name for natural speech; phonetic is often hyphenated.
    await Tts.speak(spoken);
  } catch (e) {
    console.warn('TTS speak failed', e);
  }
}

export async function stopSpeaking() {
  try {
    await Tts.stop();
  } catch (e) {
    // ignore
  }
}

export default {speakNamePronunciation, stopSpeaking};
