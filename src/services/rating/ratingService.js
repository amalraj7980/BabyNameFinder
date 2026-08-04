import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {Linking, Platform} from 'react-native';

import {APP_VERSION} from '../../constants/appInfo';
import {ANDROID_PACKAGE_NAME} from '../../firebase/config';

const STORAGE_KEY = '@babynames/in-app-rating';
const MIN_APP_OPENS = 5;
const MIN_ACTIVE_DAYS = 3;
const MIN_LIKES = 3;
const COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
const PROMPT_DELAY_MS = 1800;

export const ANDROID_PACKAGE_ID = ANDROID_PACKAGE_NAME;
export const PLAY_STORE_LISTING_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`;

const DEFAULT_STATE = {
  firstInstallAt: 0,
  appOpenCount: 0,
  activeDays: [],
  likeCount: 0,
  lastReviewRequestAt: null,
  lastReviewRequestVersion: null,
  reviewRequestCount: 0,
};

let cachedState = null;
let promptInFlight = false;
let pendingPromptTimer = null;

function dayKey(ms = Date.now()) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function loadState() {
  if (cachedState) {
    return cachedState;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cachedState = {
        ...DEFAULT_STATE,
        ...parsed,
        activeDays: Array.isArray(parsed.activeDays)
          ? parsed.activeDays.filter(d => typeof d === 'string')
          : [],
      };
      return cachedState;
    }
  } catch {
    // fall through
  }
  cachedState = {
    ...DEFAULT_STATE,
    firstInstallAt: Date.now(),
  };
  await persistState(cachedState);
  return cachedState;
}

async function persistState(state) {
  cachedState = state;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
}

async function updateState(mutator) {
  const prev = await loadState();
  const next = mutator(prev);
  await persistState(next);
  return next;
}

function isEligible(state) {
  if (state.appOpenCount < MIN_APP_OPENS) {
    return false;
  }
  if (state.activeDays.length < MIN_ACTIVE_DAYS) {
    return false;
  }
  if (state.likeCount < MIN_LIKES) {
    return false;
  }
  if (state.lastReviewRequestVersion === APP_VERSION) {
    return false;
  }
  if (
    state.lastReviewRequestAt != null &&
    Date.now() - state.lastReviewRequestAt < COOLDOWN_MS
  ) {
    return false;
  }
  return true;
}

async function isOnline() {
  try {
    const net = await NetInfo.fetch();
    return Boolean(net.isConnected && net.isInternetReachable !== false);
  } catch {
    return false;
  }
}

async function loadInAppReview() {
  return require('react-native-in-app-review').default;
}

export async function openPlayStoreListing() {
  const marketUrl = `market://details?id=${ANDROID_PACKAGE_ID}`;
  try {
    if (Platform.OS === 'android') {
      const canMarket = await Linking.canOpenURL(marketUrl);
      if (canMarket) {
        await Linking.openURL(marketUrl);
        return;
      }
    }
    await Linking.openURL(PLAY_STORE_LISTING_URL);
  } catch (error) {
    console.warn('[rating] open Play Store failed', error);
  }
}

async function markReviewRequested() {
  await updateState(prev => ({
    ...prev,
    lastReviewRequestAt: Date.now(),
    lastReviewRequestVersion: APP_VERSION,
    reviewRequestCount: prev.reviewRequestCount + 1,
  }));
}

export async function requestReviewOrOpenStore(options = {}) {
  if (Platform.OS !== 'android') {
    await openPlayStoreListing();
    return;
  }

  try {
    if (!options.forceStoreFallback) {
      const InAppReview = await loadInAppReview();
      if (InAppReview?.isAvailable?.()) {
        await InAppReview.RequestInAppReview();
        await markReviewRequested();
        return;
      }
    }
  } catch (error) {
    console.warn('[rating] In-App Review unavailable', error);
  }

  await markReviewRequested();
  await openPlayStoreListing();
}

export async function rateAppFromSettings() {
  if (promptInFlight) {
    return;
  }
  promptInFlight = true;
  try {
    if (!(await isOnline())) {
      await openPlayStoreListing();
      return;
    }
    await requestReviewOrOpenStore();
  } finally {
    promptInFlight = false;
  }
}

async function maybePromptAfterPositiveMoment() {
  if (promptInFlight || Platform.OS !== 'android') {
    return;
  }
  if (!(await isOnline())) {
    return;
  }
  const state = await loadState();
  if (!isEligible(state)) {
    return;
  }

  promptInFlight = true;
  try {
    await requestReviewOrOpenStore();
  } finally {
    promptInFlight = false;
  }
}

function scheduleMaybePrompt() {
  if (pendingPromptTimer) {
    clearTimeout(pendingPromptTimer);
  }
  pendingPromptTimer = setTimeout(() => {
    pendingPromptTimer = null;
    void maybePromptAfterPositiveMoment();
  }, PROMPT_DELAY_MS);
}

export async function trackAppOpen() {
  try {
    await updateState(prev => {
      const today = dayKey();
      const activeDays = prev.activeDays.includes(today)
        ? prev.activeDays
        : [...prev.activeDays, today].slice(-60);
      return {
        ...prev,
        firstInstallAt: prev.firstInstallAt || Date.now(),
        appOpenCount: prev.appOpenCount + 1,
        activeDays,
      };
    });
  } catch (error) {
    console.warn('[rating] trackAppOpen failed', error);
  }
}

/** Positive moment for Baby Names — after a successful like. */
export async function trackSuccessfulLike() {
  try {
    await updateState(prev => ({
      ...prev,
      likeCount: (prev.likeCount || 0) + 1,
    }));
    scheduleMaybePrompt();
  } catch (error) {
    console.warn('[rating] trackSuccessfulLike failed', error);
  }
}
