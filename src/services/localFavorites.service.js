/**
 * Guest local favorites — AsyncStorage name IDs / slugs only.
 * Survives restart; cleared only on explicit migrate-after-login or user remove.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@babynames/favorite_names';

const listeners = new Set();

const notify = ids => {
  listeners.forEach(fn => {
    try {
      fn(ids);
    } catch (e) {
      // ignore
    }
  });
};

const readIds = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return [...new Set(parsed.map(String).filter(Boolean))];
  } catch (e) {
    return [];
  }
};

const writeIds = async ids => {
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  await AsyncStorage.setItem(KEY, JSON.stringify(unique));
  notify(unique);
  return unique;
};

export const getLocalFavoriteIds = async () => readIds();

export const isLocalFavorite = async nameId => {
  const ids = await readIds();
  return ids.includes(String(nameId));
};

export const addLocalFavorite = async nameId => {
  const id = String(nameId || '').trim();
  if (!id) {
    return readIds();
  }
  const ids = await readIds();
  if (ids.includes(id)) {
    return ids;
  }
  return writeIds([...ids, id]);
};

export const removeLocalFavorite = async nameId => {
  const id = String(nameId || '').trim();
  const ids = await readIds();
  return writeIds(ids.filter(x => x !== id));
};

export const toggleLocalFavorite = async nameId => {
  const id = String(nameId || '').trim();
  const ids = await readIds();
  if (ids.includes(id)) {
    const next = await writeIds(ids.filter(x => x !== id));
    return {favorited: false, ids: next};
  }
  const next = await writeIds([...ids, id]);
  return {favorited: true, ids: next};
};

/** Only call after confirmed cloud merge succeeded. */
export const clearLocalFavorites = async () => {
  await AsyncStorage.removeItem(KEY);
  notify([]);
};

export const subscribeLocalFavorites = listener => {
  listeners.add(listener);
  readIds().then(listener).catch(() => listener([]));
  return () => listeners.delete(listener);
};
