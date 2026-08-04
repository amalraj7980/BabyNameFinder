import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@babynames/optional_update_snooze_until';
const OPTIONAL_UPDATE_SNOOZE_MS = 48 * 60 * 60 * 1000;

export async function markOptionalUpdateSnoozedToday() {
  try {
    const until = Date.now() + OPTIONAL_UPDATE_SNOOZE_MS;
    await AsyncStorage.setItem(STORAGE_KEY, String(until));
  } catch {
    // best-effort
  }
}

export async function isOptionalUpdateSnoozedToday() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return false;
    }
    const until = Number(stored);
    if (!Number.isFinite(until)) {
      return false;
    }
    return Date.now() < until;
  } catch {
    return false;
  }
}
