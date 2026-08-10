/**
 * Local dislike IDs — mirror of favorites for offline / batched sync.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@babynames/dislike_names';

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

export const getLocalDislikeIds = async () => readIds();

export const addLocalDislike = async nameId => {
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

export const removeLocalDislike = async nameId => {
  const id = String(nameId || '').trim();
  const ids = await readIds();
  return writeIds(ids.filter(x => x !== id));
};

export const clearLocalDislikes = async () => {
  await AsyncStorage.removeItem(KEY);
  notify([]);
};

export const subscribeLocalDislikes = listener => {
  listeners.add(listener);
  readIds().then(listener).catch(() => listener([]));
  return () => listeners.delete(listener);
};
