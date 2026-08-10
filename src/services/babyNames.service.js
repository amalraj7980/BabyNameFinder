/**
 * Baby names — live Firestore catalog for all listing screens.
 * Rules: public read. Writes only if Console allows (signed-in create/update).
 */
import firestore from '@react-native-firebase/firestore';
import {
  babyNamesCollection,
  babyNameDocument,
  metaDocument,
  mapNameDoc,
  serverTimestamp,
} from '../firebase/firestore';
import BOOTSTRAP_NAMES from '../data/seedNames';

let cachedNames = null;
let namesUnsubscribe = null;
const nameListeners = new Set();

const normalizeGenderFilter = gender => {
  const g = (gender || 'all').toString().toLowerCase();
  if (g === 'boy' || g === 'male' || g === 'm') {
    return 'male';
  }
  if (g === 'girl' || g === 'female' || g === 'f') {
    return 'female';
  }
  if (g === 'unisex' || g === 'neutral') {
    return 'unisex';
  }
  return 'all';
};

const normalizeItemGender = gender => {
  const g = (gender || '').toString().toLowerCase();
  if (g === 'boy' || g === 'male' || g === 'm') {
    return 'male';
  }
  if (g === 'girl' || g === 'female' || g === 'f') {
    return 'female';
  }
  if (g === 'unisex' || g === 'neutral') {
    return 'unisex';
  }
  return g;
};

const applyFilters = (names, filters = {}) => {
  const startWith = (filters.startWith || '').toString().toLowerCase();
  const endsWith = (filters.endsWith || '').toString().toLowerCase();
  const contains = (filters.contains || '').toString().toLowerCase();
  const gender = normalizeGenderFilter(filters.gender);
  const compoundName = filters.compoundName;

  return names.filter(item => {
    const name = (item.name || '').toLowerCase();
    if (startWith && !name.startsWith(startWith)) {
      return false;
    }
    if (endsWith && !name.endsWith(endsWith)) {
      return false;
    }
    if (contains && !name.includes(contains)) {
      return false;
    }
    if (gender && gender !== 'all') {
      const g = normalizeItemGender(item.gender);
      if (gender === 'unisex') {
        if (g !== 'unisex') {
          return false;
        }
      } else if (g !== gender && g !== 'unisex') {
        return false;
      }
    }
    // No compound filter (false/undefined) → show all names
    // compoundName true → compound names only (space/hyphen)
    if (compoundName === true || compoundName === 'true') {
      const isCompound = /\s|-/.test(item.name || '');
      if (!isCompound) {
        return false;
      }
    }
    return true;
  });
};

const paginate = (names, page = 0, pageCount = 1000) => {
  const start = Number(page) * Number(pageCount);
  const end = start + Number(pageCount);
  return names.slice(start, end);
};

const notifyListeners = names => {
  nameListeners.forEach(fn => {
    try {
      fn(names);
    } catch (e) {
      // ignore
    }
  });
};

const syncMetaCount = async count => {
  try {
    await metaDocument('global').set(
      {namesCount: count, updatedAt: serverTimestamp()},
      {merge: true},
    );
  } catch (e) {
    // meta may be read-only — ignore
  }
};

export const forceSeedBabyNames = async () => {
  try {
    const existing = await babyNamesCollection().get();
    const existingIds = new Set(existing.docs.map(d => d.id));
    const missing = BOOTSTRAP_NAMES.filter(
      item => !existingIds.has(String(item.id)),
    );

    if (missing.length === 0 && !existing.empty) {
      console.log(
        `baby_names ready (${existing.size} docs) — listing uses Firestore`,
      );
      clearNamesCache();
      await fetchAllBabyNames({forceRefresh: true});
      return {seeded: false, count: existing.size};
    }

    if (missing.length === 0 && existing.empty) {
      // full bootstrap
    }

    const toWrite = existing.empty ? BOOTSTRAP_NAMES : missing;
    console.log(
      `Upserting ${toWrite.length} baby_names into Firestore...`,
    );
    const batchSize = 400;
    for (let i = 0; i < toWrite.length; i += batchSize) {
      const batch = firestore().batch();
      toWrite.slice(i, i + batchSize).forEach(item => {
        const id = String(item.id);
        batch.set(
          babyNameDocument(id),
          {
            id,
            name: item.name || '',
            gender: item.gender || 'Unisex',
            origin: item.origin || '',
            meaning: item.meaning || '',
            syllables: item.syllables || '',
            syllableCount: item.syllableCount || 1,
            updatedAt: serverTimestamp(),
          },
          {merge: true},
        );
      });
      await batch.commit();
    }
    const after = await babyNamesCollection().get();
    await syncMetaCount(after.size);
    clearNamesCache();
    await fetchAllBabyNames({forceRefresh: true});
    console.log(`baby_names listing catalog: ${after.size} docs`);
    return {seeded: true, count: after.size};
  } catch (e) {
    console.warn(
      'baby_names upsert skipped (publish rules allowing signed-in write, or add docs in Console):',
      e?.message || e,
    );
    // Still try to load whatever is already in Console (e.g. Ava)
    try {
      clearNamesCache();
      await fetchAllBabyNames({forceRefresh: true});
    } catch (readErr) {
      // ignore
    }
    return {seeded: false, count: cachedNames?.length || 0, error: e?.message};
  }
};

export const seedBabyNamesIfNeeded = async () => forceSeedBabyNames();

export const startBabyNamesLiveSync = () => {
  if (namesUnsubscribe) {
    return namesUnsubscribe;
  }
  namesUnsubscribe = babyNamesCollection().onSnapshot(
    snapshot => {
      cachedNames = snapshot.docs.map(mapNameDoc);
      console.log(`baby_names live: ${cachedNames.length} names`);
      notifyListeners(cachedNames);
    },
    error => {
      console.log('baby_names live sync error:', error?.message || error);
    },
  );
  return namesUnsubscribe;
};

export const subscribeBabyNames = listener => {
  startBabyNamesLiveSync();
  nameListeners.add(listener);
  if (cachedNames) {
    listener(cachedNames);
  }
  return () => nameListeners.delete(listener);
};

export const fetchAllBabyNames = async ({forceRefresh = false} = {}) => {
  startBabyNamesLiveSync();

  if (!forceRefresh && cachedNames && cachedNames.length > 0) {
    return cachedNames;
  }

  const snap = await babyNamesCollection().get();
  cachedNames = snap.docs.map(mapNameDoc);
  console.log(`baby_names fetched: ${cachedNames.length}`);

  if (cachedNames.length === 0) {
    console.warn(
      'baby_names is empty. Add docs in Console (like Ava) or allow signed-in write to bootstrap.',
    );
  }

  notifyListeners(cachedNames);
  return cachedNames;
};

export const clearNamesCache = () => {
  cachedNames = null;
};

export const getBabyNames = async (filters = {}) => {
  const all = await fetchAllBabyNames({forceRefresh: !!filters.forceRefresh});
  const filtered = applyFilters(all, filters);
  return paginate(filtered, filters.page ?? 0, filters.pageCount ?? 1000);
};

export const getBabyNamesExcludingReactions = async (
  filters = {},
  reactedIds = [],
) => {
  const reactedSet = new Set((reactedIds || []).map(String));
  const all = await fetchAllBabyNames({forceRefresh: !!filters.forceRefresh});
  const filtered = applyFilters(all, filters).filter(
    item => !reactedSet.has(String(item.id)),
  );
  const count = filtered.length;
  const babyNames = paginate(
    filtered,
    filters.page ?? 0,
    filters.pageCount ?? 1000,
  );
  return {babyNames, count};
};

export const getNamesCount = async () => {
  try {
    const stats = await metaDocument('global').get();
    if (stats.exists && typeof stats.data()?.namesCount === 'number') {
      return {namesCount: stats.data().namesCount};
    }
  } catch (e) {
    // fall through
  }
  const all = await fetchAllBabyNames();
  return {namesCount: all.length};
};
