/**
 * In-memory reactive likes/dislikes store.
 * UI reads and writes are synchronous (0 ms). Persistence and cloud sync
 * run in the background and never block the tap/swipe path.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FAVORITE_IDS_KEY = '@babynames/favorite_names';
export const DISLIKE_IDS_KEY = '@babynames/dislike_names';
const RECORDS_KEY = '@babynames/reaction_records_v1';

const listeners = new Set();
const likes = new Map();
const dislikes = new Map();
let likeOrder = [];
let dislikeOrder = [];

let hydrated = false;
let hydratePromise = null;
let persistTimer = null;
let persistRunning = false;
let persistQueued = false;
let revision = 0;

const normalizeGender = value => {
  const g = String(value || '')
    .toLowerCase()
    .trim();
  if (g === 'boy' || g === 'male' || g === 'm') {
    return 'male';
  }
  if (g === 'girl' || g === 'female' || g === 'f') {
    return 'female';
  }
  if (g === 'unisex' || g === 'neutral') {
    return 'unisex';
  }
  return '';
};

const originString = value => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value.name || '');
};

export const toNameRecord = (nameId, source = {}) => {
  const id = String(nameId || source.id || source.nameId || '').trim();
  const existing = likes.get(id) || dislikes.get(id) || {};
  return {
    id,
    name: source.name || existing.name || '',
    gender: source.gender || existing.gender || '',
    origin: originString(source.origin) || existing.origin || '',
    meaning: source.meaning || existing.meaning || '',
    syllables: source.syllables || existing.syllables || '',
    syllableCount: source.syllableCount || existing.syllableCount || 1,
    updatedAt: Date.now(),
  };
};

const cloneRecord = record => ({...record});

const parseIdList = raw => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return [...new Set(parsed.map(String).filter(Boolean))];
  } catch (e) {
    return [];
  }
};

const parseRecordMap = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
};

const removeFromOrder = (order, id) => {
  const index = order.indexOf(id);
  if (index === -1) {
    return order;
  }
  const next = order.slice();
  next.splice(index, 1);
  return next;
};

const prependOrder = (order, id) => {
  const next = removeFromOrder(order, id);
  next.unshift(id);
  return next;
};

const emit = () => {
  revision += 1;
  const snapshot = getReactionsSnapshot();
  listeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch (e) {
      // ignore subscriber errors
    }
  });
};

const runWhenIdle = task => {
  if (typeof global.requestIdleCallback === 'function') {
    global.requestIdleCallback(() => {
      task();
    });
    return;
  }
  setTimeout(task, 32);
};

const schedulePersist = () => {
  persistQueued = true;
  if (persistTimer || persistRunning) {
    return;
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    runWhenIdle(() => {
      void persistNow();
    });
  }, 24);
};

const persistNow = async () => {
  if (persistRunning) {
    persistQueued = true;
    return;
  }
  persistRunning = true;
  persistQueued = false;
  const likeIds = likeOrder.slice();
  const dislikeIds = dislikeOrder.slice();
  const likeRecords = {};
  const dislikeRecords = {};
  likes.forEach((record, id) => {
    likeRecords[id] = record;
  });
  dislikes.forEach((record, id) => {
    dislikeRecords[id] = record;
  });
  try {
    await AsyncStorage.multiSet([
      [FAVORITE_IDS_KEY, JSON.stringify(likeIds)],
      [DISLIKE_IDS_KEY, JSON.stringify(dislikeIds)],
      [
        RECORDS_KEY,
        JSON.stringify({
          likes: likeRecords,
          dislikes: dislikeRecords,
          likeOrder,
          dislikeOrder,
        }),
      ],
    ]);
  } catch (e) {
    persistQueued = true;
  } finally {
    persistRunning = false;
    if (persistQueued) {
      schedulePersist();
    }
  }
};

const mergeRecordInto = (map, orderKey, id, record) => {
  const previous = map.get(id);
  if (!previous) {
    map.set(id, record);
    if (orderKey === 'like') {
      likeOrder = prependOrder(likeOrder, id);
    } else {
      dislikeOrder = prependOrder(dislikeOrder, id);
    }
    return;
  }
  map.set(id, {
    ...record,
    name: record.name || previous.name,
    gender: record.gender || previous.gender,
    origin: record.origin || previous.origin,
    meaning: record.meaning || previous.meaning,
    syllables: record.syllables || previous.syllables,
    syllableCount: record.syllableCount || previous.syllableCount,
  });
};

const loadHydratePayload = async () => {
  const pairs = await AsyncStorage.multiGet([
    RECORDS_KEY,
    FAVORITE_IDS_KEY,
    DISLIKE_IDS_KEY,
  ]);
  const bag = Object.fromEntries(pairs);
  let records = {};
  try {
    records = bag[RECORDS_KEY] ? JSON.parse(bag[RECORDS_KEY]) : {};
  } catch (e) {
    records = {};
  }
  const storedLikes = parseRecordMap(records.likes);
  const storedDislikes = parseRecordMap(records.dislikes);
  const storedLikeOrder = Array.isArray(records.likeOrder)
    ? records.likeOrder.map(String)
    : [];
  const storedDislikeOrder = Array.isArray(records.dislikeOrder)
    ? records.dislikeOrder.map(String)
    : [];
  const favoriteIds = parseIdList(bag[FAVORITE_IDS_KEY]);
  const dislikeIds = parseIdList(bag[DISLIKE_IDS_KEY]);
  return {
    storedLikes,
    storedDislikes,
    storedLikeOrder,
    storedDislikeOrder,
    favoriteIds,
    dislikeIds,
  };
};

const applyHydratePayload = payload => {
  const memoryLikeIds = new Set(likeOrder);
  const memoryDislikeIds = new Set(dislikeOrder);

  const likeIds = payload.storedLikeOrder.length
    ? payload.storedLikeOrder
    : payload.favoriteIds;
  const dislikeIds = payload.storedDislikeOrder.length
    ? payload.storedDislikeOrder
    : payload.dislikeIds;

  likeIds.forEach(id => {
    if (memoryLikeIds.has(id) || memoryDislikeIds.has(id)) {
      return;
    }
    const record = toNameRecord(id, payload.storedLikes[id] || {id});
    likes.set(id, record);
  });
  if (!likeOrder.length) {
    likeOrder = likeIds.filter(id => likes.has(id));
  } else {
    likeIds.forEach(id => {
      if (likes.has(id) && !likeOrder.includes(id) && !memoryDislikeIds.has(id)) {
        likeOrder.push(id);
      }
    });
  }

  dislikeIds.forEach(id => {
    if (memoryLikeIds.has(id) || memoryDislikeIds.has(id) || likes.has(id)) {
      return;
    }
    const record = toNameRecord(id, payload.storedDislikes[id] || {id});
    dislikes.set(id, record);
  });
  if (!dislikeOrder.length) {
    dislikeOrder = dislikeIds.filter(id => dislikes.has(id));
  } else {
    dislikeIds.forEach(id => {
      if (dislikes.has(id) && !dislikeOrder.includes(id) && !likes.has(id)) {
        dislikeOrder.push(id);
      }
    });
  }
};

export const getReactionsSnapshot = () => ({
  revision,
  likeIds: likeOrder.slice(),
  dislikeIds: dislikeOrder.slice(),
  likeCount: likeOrder.length,
  dislikeCount: dislikeOrder.length,
});

export const getLikeIds = () => likeOrder.slice();
export const getDislikeIds = () => dislikeOrder.slice();
export const getReactedIds = () => [...new Set([...likeOrder, ...dislikeOrder])];
export const hasLike = nameId => likes.has(String(nameId));
export const hasDislike = nameId => dislikes.has(String(nameId));

export const getLikeRecord = nameId => {
  const record = likes.get(String(nameId));
  return record ? cloneRecord(record) : null;
};

export const getLikeRecords = () => likeOrder.map(id => cloneRecord(likes.get(id)));
export const getDislikeRecords = () =>
  dislikeOrder.map(id => cloneRecord(dislikes.get(id)));

export const queryLikes = ({
  search = '',
  gender = 'all',
  cursor = null,
  pageSize = 20,
} = {}) => {
  const needle = String(search || '')
    .trim()
    .toLowerCase();
  const genderFilter = normalizeGender(gender) || 'all';
  const size = Math.max(1, Math.min(Number(pageSize) || 20, 80));

  const matched = [];
  likeOrder.forEach(id => {
    const record = likes.get(id);
    if (!record) {
      return;
    }
    if (needle && !String(record.name || '').toLowerCase().includes(needle)) {
      return;
    }
    if (genderFilter !== 'all') {
      const itemGender = normalizeGender(record.gender);
      if (itemGender !== genderFilter) {
        return;
      }
    }
    matched.push(record);
  });

  let start = 0;
  if (cursor) {
    const index = matched.findIndex(item => String(item.id) === String(cursor));
    start = index >= 0 ? index + 1 : 0;
  }
  const page = matched.slice(start, start + size).map(cloneRecord);
  const last = page[page.length - 1];
  const hasMore = start + page.length < matched.length;
  return {
    likes: page,
    nextCursor: hasMore && last ? String(last.id) : null,
    hasMore,
    total: matched.length,
  };
};

export const applyLike = source => {
  const record = toNameRecord(source?.id || source?.nameId, source);
  if (!record.id) {
    return {liked: false};
  }
  dislikes.delete(record.id);
  dislikeOrder = removeFromOrder(dislikeOrder, record.id);
  mergeRecordInto(likes, 'like', record.id, record);
  likeOrder = prependOrder(likeOrder, record.id);
  emit();
  schedulePersist();
  return {liked: true, record: cloneRecord(likes.get(record.id))};
};

export const applyDislike = source => {
  const record = toNameRecord(source?.id || source?.nameId, source);
  if (!record.id) {
    return {disliked: false};
  }
  likes.delete(record.id);
  likeOrder = removeFromOrder(likeOrder, record.id);
  mergeRecordInto(dislikes, 'dislike', record.id, record);
  dislikeOrder = prependOrder(dislikeOrder, record.id);
  emit();
  schedulePersist();
  return {disliked: true, record: cloneRecord(dislikes.get(record.id))};
};

export const applyUnlike = nameId => {
  const id = String(nameId || '').trim();
  if (!id || !likes.has(id)) {
    return {liked: false};
  }
  likes.delete(id);
  likeOrder = removeFromOrder(likeOrder, id);
  emit();
  schedulePersist();
  return {liked: false};
};

export const applyUndislike = nameId => {
  const id = String(nameId || '').trim();
  if (!id || !dislikes.has(id)) {
    return {disliked: false};
  }
  dislikes.delete(id);
  dislikeOrder = removeFromOrder(dislikeOrder, id);
  emit();
  schedulePersist();
  return {disliked: false};
};

export const patchReactionRecord = (side, source) => {
  const id = String(source?.id || source?.nameId || '').trim();
  if (!id) {
    return;
  }
  const map = side === 'dislike' ? dislikes : likes;
  const current = map.get(id);
  if (!current) {
    return;
  }
  const next = toNameRecord(id, {...current, ...source, id});
  map.set(id, {
    ...next,
    updatedAt: current.updatedAt || next.updatedAt,
  });
  emit();
  schedulePersist();
};

export const mergeCloudRecords = (side, records = []) => {
  if (!Array.isArray(records) || !records.length) {
    return;
  }
  let changed = false;
  records.forEach(item => {
    const record = toNameRecord(item?.id || item?.nameId, item);
    if (!record.id) {
      return;
    }
    if (side === 'like') {
      if (dislikes.has(record.id) || likes.has(record.id)) {
        if (likes.has(record.id)) {
          const current = likes.get(record.id);
          likes.set(record.id, {
            ...current,
            name: current.name || record.name,
            gender: current.gender || record.gender,
            origin: current.origin || record.origin,
            meaning: current.meaning || record.meaning,
            syllables: current.syllables || record.syllables,
            syllableCount: current.syllableCount || record.syllableCount,
          });
          changed = true;
        }
        return;
      }
      likes.set(record.id, record);
      likeOrder = [...likeOrder, record.id];
      changed = true;
      return;
    }
    if (likes.has(record.id) || dislikes.has(record.id)) {
      return;
    }
    dislikes.set(record.id, record);
    dislikeOrder = [...dislikeOrder, record.id];
    changed = true;
  });
  if (changed) {
    emit();
    schedulePersist();
  }
};

export const subscribeReactions = listener => {
  listeners.add(listener);
  try {
    listener(getReactionsSnapshot());
  } catch (e) {
    // ignore
  }
  return () => listeners.delete(listener);
};

export const hydrateReactionsStore = () => {
  if (hydrated) {
    return Promise.resolve();
  }
  if (!hydratePromise) {
    hydratePromise = loadHydratePayload()
      .then(payload => {
        applyHydratePayload(payload);
        hydrated = true;
        emit();
      })
      .catch(() => {
        hydrated = true;
      });
  }
  return hydratePromise;
};

export const flushReactionsPersist = () => persistNow();

export const clearLocalReactions = async () => {
  if (hydratePromise) {
    await hydratePromise.catch(() => {});
  }
  likes.clear();
  dislikes.clear();
  likeOrder = [];
  dislikeOrder = [];
  emit();
  await persistNow();
};

export const replaceLikeRecords = async (records = []) => {
  if (hydratePromise) {
    await hydratePromise.catch(() => {});
  }
  likes.clear();
  likeOrder = [];
  (records || []).forEach(item => {
    const record = toNameRecord(item?.id || item?.nameId, item);
    if (!record.id) {
      return;
    }
    likes.set(record.id, record);
    likeOrder.push(record.id);
  });
  emit();
  await persistNow();
};

export {normalizeGender as normalizeReactionGender};
