/**
 * Baby names — Firestore read-only (Console rules: allow write: if false).
 * Catalog must be uploaded via Firebase Console / Admin SDK — not the app.
 */
import {
  babyNamesCollection,
  metaDocument,
  mapNameDoc,
} from '../firebase/firestore';

let cachedNames = null;
let namesUnsubscribe = null;
const nameListeners = new Set();

const applyFilters = (names, filters = {}) => {
  const startWith = (filters.startWith || '').toString().toLowerCase();
  const endsWith = (filters.endsWith || '').toString().toLowerCase();
  const contains = (filters.contains || '').toString().toLowerCase();
  const gender = (filters.gender || 'all').toString().toLowerCase();
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
      const g = (item.gender || '').toLowerCase();
      if (g !== gender && g !== 'unisex') {
        if (gender === 'unisex') {
          if (g !== 'unisex') {
            return false;
          }
        } else if (g !== gender) {
          return false;
        }
      }
    }
    if (compoundName === false || compoundName === 'false') {
      if (/\s|-/.test(item.name || '')) {
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

/** No-op: client writes to baby_names are denied by published rules. */
export const forceSeedBabyNames = async () => {
  console.log(
    'baby_names is read-only — add/edit names in Firebase Console (baby_names collection).',
  );
  return {seeded: false, count: cachedNames?.length || 0};
};

export const seedBabyNamesIfNeeded = async () => forceSeedBabyNames();

export const startBabyNamesLiveSync = () => {
  if (namesUnsubscribe) {
    return namesUnsubscribe;
  }
  namesUnsubscribe = babyNamesCollection().onSnapshot(
    snapshot => {
      cachedNames = snapshot.docs.map(mapNameDoc);
      notifyListeners(cachedNames);
      if (cachedNames.length === 0) {
        console.warn(
          'baby_names is empty. Upload name documents in Firebase Console.',
        );
      }
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

  if (cachedNames.length === 0) {
    console.warn(
      'baby_names is empty in Firestore. Add documents in Console (client cannot write).',
    );
  }

  notifyListeners(cachedNames);
  return cachedNames;
};

export const clearNamesCache = () => {
  cachedNames = null;
};

export const getBabyNames = async (filters = {}) => {
  const all = await fetchAllBabyNames();
  const filtered = applyFilters(all, filters);
  return paginate(filtered, filters.page ?? 0, filters.pageCount ?? 1000);
};

export const getBabyNamesExcludingReactions = async (
  filters = {},
  reactedIds = [],
) => {
  const reactedSet = new Set((reactedIds || []).map(String));
  const all = await fetchAllBabyNames();
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
