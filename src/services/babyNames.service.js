/**
 * Baby names — live Firestore catalog for all listing screens.
 * Rules: public read. Writes only if Console allows (signed-in create/update).
 */
import firestore from '@react-native-firebase/firestore';
import {
  documentId,
  endAt,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  startAfter,
  where,
} from '@react-native-firebase/firestore';
import {
  babyNamesCollection,
  babyNameDocument,
  metaDocument,
  mapNameDoc,
  serverTimestamp,
} from '../firebase/firestore';
import BOOTSTRAP_NAMES from '../data/seedNames';
import {
  resolveOriginMatchSet,
  resolveOriginQueryTags,
} from '../constants/countryOriginOptions';

let cachedNames = null;
let namesUnsubscribe = null;
const nameListeners = new Set();
let cachedNamesCount = null;
let namesCountRequest = null;

/** Dashboard page size. The Discover screen never downloads the full catalog. */
export const BABY_NAMES_PAGE_SIZE = 20;
const CLIENT_FILTER_SCAN_SIZE = 100;
const MAX_CLIENT_FILTER_SCAN_WINDOWS = 3;

const mapAndDedupeNames = docs => {
  const mapped = docs.map(mapNameDoc);
  const seen = new Set();
  const unique = [];
  mapped.forEach((item, index) => {
    const base =
      String(item?.id || item?.slug || item?.name || `name-${index}`).trim() ||
      `name-${index}`;
    let key = base;
    let n = 1;
    while (seen.has(key)) {
      key = `${base}__${n++}`;
    }
    seen.add(key);
    unique.push(key === item.id ? item : {...item, id: key, key});
  });
  return unique;
};

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

const normalizeNameStyle = style => {
  const value = String(style || 'all').trim().toLowerCase();
  return ['modern', 'classic', 'biblical', 'international'].includes(value)
    ? value
    : 'all';
};

const normalizeNameLength = nameLength => {
  const value = String(nameLength || 'all').trim().toLowerCase();
  return ['short', 'medium', 'long'].includes(value) ? value : 'all';
};

const visibleNameLength = name =>
  Array.from(String(name || '').replace(/[\s-]/g, '')).length;

const genderQueryValues = gender => {
  if (gender === 'male') {
    return ['Male', 'Unisex', 'male', 'unisex', 'Boy', 'boy', 'M', 'm'];
  }
  if (gender === 'female') {
    return [
      'Female',
      'Unisex',
      'female',
      'unisex',
      'Girl',
      'girl',
      'F',
      'f',
    ];
  }
  if (gender === 'unisex') {
    return ['Unisex', 'unisex', 'Neutral', 'neutral'];
  }
  return null;
};

const applyFilters = (names, filters = {}) => {
  const startWith = (filters.startWith || '').toString().toLowerCase();
  const endsWith = (filters.endsWith || '').toString().toLowerCase();
  const contains = (filters.contains || '').toString().toLowerCase();
  const originQuery = (filters.originQuery || '').toString().toLowerCase().trim();
  const gender = normalizeGenderFilter(filters.gender);
  const compoundName = filters.compoundName;
  const nameLength = normalizeNameLength(filters.nameLength);
  const style = normalizeNameStyle(filters.style);

  let originMatch = null;
  if (Array.isArray(filters.origins) && filters.origins.length) {
    originMatch = resolveOriginMatchSet(filters.origins);
  } else if (filters.origin && filters.origin !== 'all') {
    originMatch = resolveOriginMatchSet([filters.origin]);
  }

  const originMatches = item => {
    const itemOrigin = String(
      typeof item.origin === 'string' ? item.origin : item.origin?.name || '',
    )
      .toLowerCase()
      .trim();
    const tags = Array.isArray(item.tags)
      ? item.tags.map(tag => String(tag || '').toLowerCase().trim())
      : [];
    const searchableOrigins = [itemOrigin, ...tags].filter(Boolean);

    if (
      originQuery &&
      !searchableOrigins.some(value => value.includes(originQuery))
    ) {
      return false;
    }
    if (!originMatch || !originMatch.size) {
      return true;
    }
    for (const value of searchableOrigins) {
      if (originMatch.has(value)) {
        return true;
      }
      const parts = value.split(/[/&,]+/).map(p => p.trim()).filter(Boolean);
      if (parts.some(part => originMatch.has(part))) {
        return true;
      }
      for (const token of originMatch) {
        if (token.length >= 3 && value.includes(token)) {
          return true;
        }
      }
    }
    return false;
  };

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
    if (nameLength !== 'all') {
      const length = visibleNameLength(item.name);
      if (
        (nameLength === 'short' && (length < 1 || length > 4)) ||
        (nameLength === 'medium' && (length < 5 || length > 7)) ||
        (nameLength === 'long' && length < 8)
      ) {
        return false;
      }
    }
    if (
      style !== 'all' &&
      !(Array.isArray(item.tags) &&
        item.tags.some(tag => String(tag).toLowerCase() === style))
    ) {
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
    if (!originMatches(item)) {
      return false;
    }
    return true;
  });
};

const paginate = (names, page = 0, pageCount = 1000) => {
  const start = Number(page) * Number(pageCount);
  const end = start + Number(pageCount);
  return names.slice(start, end);
};

const hasActiveFilters = filters =>
  Boolean(
    (filters.startWith || '').toString().trim() ||
      (filters.endsWith || '').toString().trim() ||
      (filters.contains || '').toString().trim() ||
      (filters.originQuery || '').toString().trim() ||
      filters.compoundName === true ||
      filters.compoundName === 'true' ||
      (filters.gender && normalizeGenderFilter(filters.gender) !== 'all') ||
      normalizeNameLength(filters.nameLength) !== 'all' ||
      normalizeNameStyle(filters.style) !== 'all' ||
      (Array.isArray(filters.origins) && filters.origins.length) ||
      (filters.origin && filters.origin !== 'all'),
  );

const requiresClientSideScan = filters => {
  const selectedOrigins = Array.isArray(filters.origins)
    ? filters.origins.filter(value => value && value !== 'all')
    : [];
  const gender = normalizeGenderFilter(filters.gender);
  const style = normalizeNameStyle(filters.style);
  const originQueryTags = resolveOriginQueryTags(selectedOrigins);
  const startWith = (filters.startWith || '').toString().trim();
  const hasTagFilter = style !== 'all' || Boolean(originQueryTags);
  const canUsePrefixQuery =
    Boolean(startWith) && gender === 'all' && !hasTagFilter;
  return Boolean(
    (filters.endsWith || '').toString().trim() ||
      (filters.contains || '').toString().trim() ||
      (filters.originQuery || '').toString().trim() ||
      filters.compoundName === true ||
      filters.compoundName === 'true' ||
      normalizeNameLength(filters.nameLength) !== 'all' ||
      (selectedOrigins.length && !originQueryTags) ||
      (style !== 'all' && originQueryTags) ||
      // Avoid depending on an undeployed Firestore composite index. The first
      // server-supported predicate narrows the query; the other is filtered
      // from a bounded 100-document scan.
      (gender !== 'all' && hasTagFilter) ||
      (startWith && !canUsePrefixQuery) ||
      (filters.origin && filters.origin !== 'all'),
  );
};

const toPageCursor = (docSnap, useNamePrefix) =>
  useNamePrefix
    ? {name: String(docSnap.data()?.name || ''), id: docSnap.id}
    : docSnap.id;

/**
 * Returns an exact aggregate count when every selected predicate is supported
 * by Firestore. Free-text, suffix, length, and compound filters are evaluated
 * locally, so the UI intentionally treats their count as unresolved instead
 * of incorrectly claiming that the visible 20-card page is the total.
 */
export const getBabyNamesFilteredCount = async (filters = {}) => {
  if (requiresClientSideScan(filters)) {
    return {namesCount: null, exact: false};
  }

  const constraints = [];
  const gender = normalizeGenderFilter(filters.gender);
  const style = normalizeNameStyle(filters.style);
  const originQueryTags = resolveOriginQueryTags(filters.origins);
  const startWith = (filters.startWith || '').toString().trim();

  if (style !== 'all') {
    constraints.push(where('tags', 'array-contains', style));
  } else if (originQueryTags) {
    constraints.push(where('tags', 'array-contains-any', originQueryTags));
  }
  if (gender !== 'all') {
    constraints.push(where('gender', 'in', genderQueryValues(gender)));
  }
  if (startWith) {
    const prefix = startWith.toLocaleUpperCase();
    constraints.push(orderBy('name'), startAt(prefix), endAt(`${prefix}\uf8ff`));
  }

  try {
    const countSnapshot = await getCountFromServer(
      constraints.length
        ? query(babyNamesCollection(), ...constraints)
        : babyNamesCollection(),
    );
    const namesCount = countSnapshot.data().count;
    return {
      namesCount: typeof namesCount === 'number' ? namesCount : null,
      exact: typeof namesCount === 'number',
    };
  } catch (error) {
    // A missing composite index is not a reason to show an incorrect count.
    return {namesCount: null, exact: false};
  }
};

/**
 * Reads a small, cursor-based catalog page. The cursor is a Firestore document
 * id so it is safe to keep in screen state/ref and does not require caching the
 * full catalog locally. We order by document id because every catalog document
 * has one, including the original imported records. Client-only filters search
 * at most three 100-document windows per request, rather than scanning the
 * entire catalog before the screen can respond.
 */
export const getBabyNamesPage = async (filters = {}, reactedIds = []) => {
  const requestedSize = Number(filters.pageSize ?? filters.pageCount);
  const pageSize = Math.max(
    1,
    Math.min(
      Number.isFinite(requestedSize) ? requestedSize : BABY_NAMES_PAGE_SIZE,
      100,
    ),
  );
  const reactedSet = new Set((reactedIds || []).map(String));
  const filtering = hasActiveFilters(filters);
  const clientSideScan = requiresClientSideScan(filters);
  const babyNames = [];
  let cursor = filters.cursor || null;
  let hasMore = true;
  let clientScanWindows = 0;
  const gender = normalizeGenderFilter(filters.gender);
  const style = normalizeNameStyle(filters.style);
  const originQueryTags = resolveOriginQueryTags(filters.origins);
  const startWith = (filters.startWith || '').toString().trim();
  const canUsePrefixQuery =
    style === 'all' &&
    !originQueryTags &&
    gender === 'all' &&
    Boolean(startWith);

  // A new guest with no filters reads exactly 20 documents once. If a filter
  // or prior reactions remove candidates, read further 20-document chunks
  // only until the screen has a full visible page or the catalog is exhausted.
  while (
    hasMore &&
    babyNames.length < pageSize &&
    (!clientSideScan || clientScanWindows < MAX_CLIENT_FILTER_SCAN_WINDOWS)
  ) {
    const constraints = [];
    if (style !== 'all') {
      constraints.push(where('tags', 'array-contains', style));
    } else if (originQueryTags) {
      constraints.push(
        where('tags', 'array-contains-any', originQueryTags),
      );
    } else if (gender !== 'all') {
      constraints.push(where('gender', 'in', genderQueryValues(gender)));
    }

    if (canUsePrefixQuery) {
      const prefix = startWith.toLocaleUpperCase();
      constraints.push(orderBy('name'), orderBy(documentId()));
      if (cursor && typeof cursor === 'object' && cursor.name && cursor.id) {
        constraints.push(startAfter(cursor.name, cursor.id));
      } else {
        constraints.push(startAt(prefix), endAt(`${prefix}\uf8ff`));
      }
    } else {
      constraints.push(orderBy(documentId()));
      if (typeof cursor === 'string' && cursor.trim()) {
        constraints.push(startAfter(cursor));
      }
    }
    const readSize = clientSideScan
      ? Math.max(pageSize, CLIENT_FILTER_SCAN_SIZE)
      : pageSize;
    constraints.push(limit(readSize));

    const snapshot = await getDocs(
      query(babyNamesCollection(), ...constraints),
    );
    if (clientSideScan) {
      clientScanWindows += 1;
    }
    const docs = snapshot.docs || [];
    if (!docs.length) {
      hasMore = false;
      break;
    }

    const matches = docs
      .map(docSnap => ({docSnap, item: mapNameDoc(docSnap)}))
      .filter(({item}) => !reactedSet.has(String(item.id)))
      .filter(({item}) => !filtering || applyFilters([item], filters).length)
      .map(({docSnap, item}) => ({docSnap, item}));
    const remaining = pageSize - babyNames.length;

    if (matches.length >= remaining) {
      const selected = matches.slice(0, remaining);
      babyNames.push(...selected.map(({item}) => item));
      // Do not skip matching names found later in a 100-document client scan.
      // The next page resumes after the last item actually displayed.
      cursor = toPageCursor(
        selected[selected.length - 1].docSnap,
        canUsePrefixQuery,
      );
      hasMore =
        selected[selected.length - 1].docSnap.id !== docs[docs.length - 1].id ||
        docs.length === readSize;
      break;
    }

    babyNames.push(...matches.map(({item}) => item));
    cursor = toPageCursor(docs[docs.length - 1], canUsePrefixQuery);
    hasMore = docs.length === readSize;
  }

  return {
    babyNames: babyNames.slice(0, pageSize),
    nextCursor: hasMore ? cursor : null,
    hasMore,
  };
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
      cachedNames = mapAndDedupeNames(snapshot.docs);
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
  cachedNames = mapAndDedupeNames(snap.docs);
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

export const getNamesCount = async (options = {}) => {
  const forceRefresh = options?.forceRefresh === true;
  if (!forceRefresh && typeof cachedNamesCount === 'number') {
    return {namesCount: cachedNamesCount};
  }

  // A tab-focus refresh and the initial page load can happen together. Share
  // one aggregate request so the dashboard does not issue duplicate reads.
  if (namesCountRequest) {
    return namesCountRequest;
  }

  namesCountRequest = (async () => {
    try {
      const countSnapshot = await getCountFromServer(babyNamesCollection());
      const namesCount = countSnapshot.data().count;
      if (typeof namesCount === 'number') {
        cachedNamesCount = namesCount;
        return {namesCount};
      }
    } catch (e) {
      // Firestore aggregation is unavailable only on older/emulated backends.
    }
    try {
      const stats = await metaDocument('global').get();
      if (stats.exists && typeof stats.data()?.namesCount === 'number') {
        return {namesCount: stats.data().namesCount};
      }
    } catch (e) {
      // No full-catalog fallback: opening Discover must stay a bounded read.
    }
    return {namesCount: 0};
  })();

  try {
    return await namesCountRequest;
  } finally {
    namesCountRequest = null;
  }
};
