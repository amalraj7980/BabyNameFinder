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
import {
  getLikeRecords,
  getDislikeRecords,
} from '../store/reactionsStore';

let cachedNames = null;
let namesUnsubscribe = null;
const nameListeners = new Set();
let cachedNamesCount = null;
let namesCountRequest = null;

/** Dashboard page size. The Discover screen never downloads the full catalog. */
export const BABY_NAMES_PAGE_SIZE = 20;
/** One window while filling a Discover page (same idea as commit 5c29282). */
const CLIENT_FILTER_SCAN_SIZE = 100;
/** Stop page-fill after this many windows so Apply never walks the whole 33k catalog. */
const MAX_CLIENT_FILTER_SCAN_WINDOWS = 8;

let filteredDiscoverCache = {
  signature: null,
  names: [],
  complete: false,
  promise: null,
};

const resetFilteredDiscoverCache = () => {
  filteredDiscoverCache = {
    signature: null,
    names: [],
    complete: false,
    promise: null,
  };
};

const makeFilterSignature = filters =>
  JSON.stringify({
    startWith: (filters.startWith || filters.firstLetter || '')
      .toString()
      .trim()
      .toLowerCase(),
    endsWith: (filters.endsWith || filters.lastLetter || '')
      .toString()
      .trim()
      .toLowerCase(),
    contains: (filters.contains || '').toString().trim().toLowerCase(),
    originQuery: (filters.originQuery || '').toString().trim().toLowerCase(),
    compoundName:
      filters.compoundName === true ||
      filters.compoundName === 'true' ||
      filters.compoundLetter === true ||
      filters.compoundLetter === 'true',
    gender: normalizeGenderFilter(filters.gender),
    nameLength: normalizeNameLength(filters.nameLength),
    style: normalizeNameStyle(filters.style),
    origins: Array.isArray(filters.origins)
      ? [...filters.origins].map(String).filter(Boolean).sort()
      : [],
    origin: filters.origin && filters.origin !== 'all' ? String(filters.origin) : '',
  });

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
  // Keep `in` lists short — large lists can fail/crash on some Firestore builds.
  if (gender === 'male') {
    return ['Male', 'male', 'Boy', 'boy', 'Unisex', 'unisex'];
  }
  if (gender === 'female') {
    return ['Female', 'female', 'Girl', 'girl', 'Unisex', 'unisex'];
  }
  if (gender === 'unisex') {
    return ['Unisex', 'unisex'];
  }
  return null;
};

const applyFilters = (names, filters = {}) => {
  const startWith = (filters.startWith || filters.firstLetter || '')
    .toString()
    .trim()
    .toLowerCase();
  const endsWith = (filters.endsWith || filters.lastLetter || '')
    .toString()
    .trim()
    .toLowerCase();
  const contains = (filters.contains || '').toString().trim().toLowerCase();
  const originQuery = (filters.originQuery || '').toString().toLowerCase().trim();
  const gender = normalizeGenderFilter(filters.gender);
  const compoundName =
    filters.compoundName === true ||
    filters.compoundName === 'true' ||
    filters.compoundLetter === true ||
    filters.compoundLetter === 'true';
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

const shuffleArray = items => {
  const next = Array.isArray(items) ? items.slice() : [];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const RANDOM_CURSOR_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const randomDocumentCursor = () => {
  const length = 1 + Math.floor(Math.random() * 2);
  let cursor = '';
  for (let i = 0; i < length; i += 1) {
    cursor += RANDOM_CURSOR_CHARS.charAt(
      Math.floor(Math.random() * RANDOM_CURSOR_CHARS.length),
    );
  }
  return cursor;
};

const hasActiveFilters = filters =>
  Boolean(
    (filters.startWith || filters.firstLetter || '').toString().trim() ||
      (filters.endsWith || filters.lastLetter || '').toString().trim() ||
      (filters.contains || '').toString().trim() ||
      (filters.originQuery || '').toString().trim() ||
      filters.compoundName === true ||
      filters.compoundName === 'true' ||
      filters.compoundLetter === true ||
      filters.compoundLetter === 'true' ||
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

const cursorId = cursor => {
  if (!cursor) {
    return '';
  }
  if (typeof cursor === 'object') {
    return String(cursor.id || '');
  }
  return String(cursor);
};

const titleCasePrefix = value => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
};

const collectFilteredBabyNames = async filters => {
  // Commit 5c29282: in-memory filter is instant when a catalog snapshot exists.
  if (cachedNames && cachedNames.length > 0) {
    const seen = new Set();
    const filtered = applyFilters(cachedNames, filters).filter(item => {
      const id = String(item?.id || '');
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
    return {
      names: filtered,
      complete: isCacheCompleteEnough(cachedNamesCount),
    };
  }

  // No local catalog — do not walk 33k docs. Count/page use server queries instead.
  return {names: [], complete: false};
};

/** Instant page + count from the live in-memory catalog. */
const paginateFromCachedFiltered = (filters, reactedIds = []) => {
  const filtering = hasActiveFilters(filters);
  const requestedSize = Number(filters.pageSize ?? filters.pageCount);
  const pageSize = Math.max(
    1,
    Math.min(
      Number.isFinite(requestedSize) ? requestedSize : BABY_NAMES_PAGE_SIZE,
      100,
    ),
  );
  const reactedSet = new Set((reactedIds || []).map(String).filter(Boolean));
  const sessionExclude = new Set(
    (Array.isArray(filters.excludeIds) ? filters.excludeIds : [])
      .map(String)
      .filter(Boolean),
  );
  let allMatching = applyFilters(cachedNames || [], filters);
  const startId = cursorId(filters.cursor);
  // Fresh unfiltered deck: shuffle so reset feels like a new browse session.
  if (!filtering && !startId) {
    allMatching = shuffleArray(allMatching);
  }
  const available = allMatching.filter(
    item => !reactedSet.has(String(item.id)),
  );
  let startIndex = 0;
  if (startId) {
    const cursorIndex = allMatching.findIndex(
      item => String(item.id) === startId,
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const babyNames = [];
  let index = startIndex;
  while (index < allMatching.length && babyNames.length < pageSize) {
    const item = allMatching[index];
    index += 1;
    const id = String(item.id);
    if (reactedSet.has(id) || sessionExclude.has(id)) {
      continue;
    }
    babyNames.push(item);
  }

  const hasMore = allMatching.slice(index).some(item => {
    const id = String(item.id);
    return !reactedSet.has(id) && !sessionExclude.has(id);
  });
  const lastExamined = index > 0 ? allMatching[index - 1] : null;
  const cacheComplete = isCacheCompleteEnough(cachedNamesCount);
  return {
    babyNames,
    nextCursor: hasMore && lastExamined ? lastExamined.id : null,
    hasMore,
    // Never treat a truncated in-memory snapshot (~25k of 33k+) as exact.
    namesCount: filtering ? available.length : undefined,
    exact: filtering && cacheComplete,
  };
};

const getFilteredDiscoverNames = async filters => {
  const signature = makeFilterSignature(filters);
  if (
    filteredDiscoverCache.signature === signature &&
    Array.isArray(filteredDiscoverCache.names) &&
    !filteredDiscoverCache.promise
  ) {
    return {names: filteredDiscoverCache.names, complete: filteredDiscoverCache.complete};
  }
  if (
    filteredDiscoverCache.signature === signature &&
    filteredDiscoverCache.promise
  ) {
    return filteredDiscoverCache.promise;
  }

  const promise = collectFilteredBabyNames(filters)
    .then(result => {
      if (filteredDiscoverCache.promise === promise) {
        filteredDiscoverCache = {
          signature,
          names: result.names,
          complete: result.complete,
          promise: null,
        };
      }
      return result;
    })
    .catch(error => {
      if (filteredDiscoverCache.promise === promise) {
        resetFilteredDiscoverCache();
      }
      throw error;
    });

  filteredDiscoverCache = {
    signature,
    names: [],
    complete: false,
    promise,
  };
  return promise;
};

const paginateFilteredDiscoverNames = async (filters, reactedIds = []) => {
  const requestedSize = Number(filters.pageSize ?? filters.pageCount);
  const pageSize = Math.max(
    1,
    Math.min(
      Number.isFinite(requestedSize) ? requestedSize : BABY_NAMES_PAGE_SIZE,
      100,
    ),
  );
  const reactedSet = new Set((reactedIds || []).map(String).filter(Boolean));
  const sessionExclude = new Set(
    (Array.isArray(filters.excludeIds) ? filters.excludeIds : [])
      .map(String)
      .filter(Boolean),
  );
  const {names: allMatching, complete: scanComplete} = await getFilteredDiscoverNames(filters);
  const available = allMatching.filter(item => !reactedSet.has(String(item.id)));
  const startId = cursorId(filters.cursor);
  let startIndex = 0;
  if (startId) {
    const cursorIndex = allMatching.findIndex(
      item => String(item.id) === startId,
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const babyNames = [];
  let index = startIndex;
  while (index < allMatching.length && babyNames.length < pageSize) {
    const item = allMatching[index];
    index += 1;
    const id = String(item.id);
    if (reactedSet.has(id) || sessionExclude.has(id)) {
      continue;
    }
    babyNames.push(item);
  }

  const hasMore = allMatching
    .slice(index)
    .some(item => {
      const id = String(item.id);
      return !reactedSet.has(id) && !sessionExclude.has(id);
    });
  const lastExamined = index > 0 ? allMatching[index - 1] : null;
  return {
    babyNames,
    nextCursor: hasMore && lastExamined ? lastExamined.id : null,
    hasMore,
    namesCount: available.length,
    exact: scanComplete,
  };
};

const isCacheCompleteEnough = catalogTotal => {
  if (!cachedNames || cachedNames.length === 0) {
    return false;
  }
  const total =
    typeof catalogTotal === 'number' && catalogTotal > 0
      ? catalogTotal
      : typeof cachedNamesCount === 'number' && cachedNamesCount > 0
        ? cachedNamesCount
        : null;
  if (total == null) {
    return false;
  }
  return cachedNames.length >= total * 0.97;
};

/**
 * Fast remaining count: Firestore aggregates when the filter is expressible,
 * otherwise an in-memory pass like commit 5c29282. Never scans the full
 * catalog document-by-document (that took 5+ minutes).
 */
export const getBabyNamesFilteredCount = async (filters = {}, reactedIds = []) => {
  if (!hasActiveFilters(filters)) {
    return {namesCount: null, exact: false};
  }

  const reactedSet = new Set((reactedIds || []).map(String).filter(Boolean));
  const subtractReacted = (matchTotal, exact) => {
    let exclude = 0;
    if (reactedSet.size) {
      const records = [...getLikeRecords(), ...getDislikeRecords()].filter(
        item => item && reactedSet.has(String(item.id)),
      );
      if (records.length) {
        exclude = applyFilters(records, filters).length;
      } else if (cachedNames?.length) {
        exclude = applyFilters(cachedNames, filters).filter(item =>
          reactedSet.has(String(item.id)),
        ).length;
      }
    }
    return {
      namesCount: Math.max(0, Number(matchTotal) - exclude),
      exact,
      matchTotal: Number(matchTotal),
    };
  };

  if (cachedNames && cachedNames.length > 0) {
    const {names, complete} = await getFilteredDiscoverNames(filters);
    const namesCount = names.filter(item => !reactedSet.has(String(item.id)))
      .length;
    return {namesCount, exact: complete, matchTotal: names.length};
  }

  const gender = normalizeGenderFilter(filters.gender);
  const style = normalizeNameStyle(filters.style);
  const originQueryTags = resolveOriginQueryTags(filters.origins);
  const startWith = (filters.startWith || filters.firstLetter || '')
    .toString()
    .trim();
  const needsClient = requiresClientSideScan(filters);

  const countWith = async constraints => {
    const snap = await getCountFromServer(
      query(babyNamesCollection(), ...constraints),
    );
    return Number(snap.data()?.count);
  };

  try {
    if (!needsClient && style !== 'all') {
      const n = await countWith([where('tags', 'array-contains', style)]);
      if (Number.isFinite(n)) {
        return subtractReacted(n, true);
      }
    } else if (!needsClient && originQueryTags) {
      const n = await countWith([
        where('tags', 'array-contains-any', originQueryTags),
      ]);
      if (Number.isFinite(n)) {
        return subtractReacted(n, true);
      }
    } else if (!needsClient && gender !== 'all') {
      const values = [...new Set(genderQueryValues(gender) || [])];
      const parts = await Promise.all(
        values.map(async value => {
          try {
            return await countWith([where('gender', '==', value)]);
          } catch (e) {
            return 0;
          }
        }),
      );
      const n = parts.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
      if (Number.isFinite(n)) {
        return subtractReacted(n, true);
      }
    } else if (startWith && !needsClient) {
      const title = titleCasePrefix(startWith);
      const lower = startWith.toLowerCase();
      const variants = [...new Set([title, lower].filter(Boolean))];
      const parts = await Promise.all(
        variants.map(async prefix => {
          try {
            return await countWith([
              orderBy('name'),
              startAt(prefix),
              endAt(`${prefix}\uf8ff`),
            ]);
          } catch (e) {
            return 0;
          }
        }),
      );
      const n = parts.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
      if (n > 0) {
        return subtractReacted(n, true);
      }
    }
  } catch (e) {
    console.warn('filtered count aggregate failed:', e?.message || e);
  }

  if (startWith) {
    try {
      const title = titleCasePrefix(startWith);
      const n = await countWith([
        orderBy('name'),
        startAt(title),
        endAt(`${title}\uf8ff`),
      ]);
      if (Number.isFinite(n) && n >= 0) {
        return subtractReacted(n, !needsClient);
      }
    } catch (e) {
      // ignore — fall through
    }
  }

  // Client-only filters (contains/endsWith/…) without a local catalog: do not
  // block Apply for minutes. The deck still uses a bounded page query.
  return {namesCount: null, exact: false};
};

/** Unfiltered remaining = full DB total - all liked/disliked ids. */
export const getBabyNamesRemainingCount = async (reactedIds = []) => {
  const reactedSet = new Set((reactedIds || []).map(String).filter(Boolean));
  const {namesCount: catalogTotal} = await getNamesCount({
    forceRefresh: typeof cachedNamesCount !== 'number' || cachedNamesCount <= 0,
  });
  const total = Number(catalogTotal);
  if (!Number.isFinite(total)) {
    return {namesCount: null, exact: false, catalogTotal: null};
  }
  return {
    namesCount: Math.max(0, total - reactedSet.size),
    exact: true,
    catalogTotal: total,
  };
};

/**
 * Reads a small, cursor-based catalog page. Explicit filters collect every
 * matching name for an exact count, then page through those names. Unfiltered
 * Discover pages use a bounded cursor read (cache when available).
 */
export const getBabyNamesPage = async (filters = {}, reactedIds = []) => {
  const filtering = hasActiveFilters(filters);

  // Instant in-memory pages when a local catalog snapshot exists (commit 5c29282).
  if (cachedNames && cachedNames.length > 0) {
    const page = paginateFromCachedFiltered(filters, reactedIds);
    if (!filtering && !cursorId(filters.cursor)) {
      return {
        ...page,
        babyNames: shuffleArray(page.babyNames),
      };
    }
    return page;
  }

  if (!filters.cursor) {
    resetFilteredDiscoverCache();
  }

  const requestedSize = Number(filters.pageSize ?? filters.pageCount);
  const pageSize = Math.max(
    1,
    Math.min(
      Number.isFinite(requestedSize) ? requestedSize : BABY_NAMES_PAGE_SIZE,
      100,
    ),
  );
  const extraExclude = Array.isArray(filters.excludeIds)
    ? filters.excludeIds
    : [];
  const reactedSet = new Set(
    [...(reactedIds || []), ...extraExclude].map(String).filter(Boolean),
  );
  const unfiltered = !filtering;
  const clientSideScan = filtering || requiresClientSideScan(filters);
  const babyNames = [];
  let cursor = filters.cursor || null;
  let hasMore = true;
  let clientScanWindows = 0;
  let wrappedToStart = false;
  const gender = normalizeGenderFilter(filters.gender);
  const style = normalizeNameStyle(filters.style);
  const originQueryTags = resolveOriginQueryTags(filters.origins);
  const startWith = (filters.startWith || filters.firstLetter || '')
    .toString()
    .trim();
  const canUsePrefixQuery =
    style === 'all' &&
    !originQueryTags &&
    gender === 'all' &&
    Boolean(startWith);
  let usePrefixQuery = canUsePrefixQuery;
  const maxScanWindows = filtering
    ? MAX_CLIENT_FILTER_SCAN_WINDOWS
    : MAX_CLIENT_FILTER_SCAN_WINDOWS;

  if (unfiltered && (cursor === null || cursor === undefined || cursor === '')) {
    cursor =
      String(filters.randomStart || '').trim() || randomDocumentCursor();
  }

  const takeUnseenMatches = matches =>
    matches.filter(({item}) => {
      const id = String(item?.id || '');
      return Boolean(id) && !reactedSet.has(id);
    });

  const commitMatches = matches => {
    matches.forEach(({item}) => {
      const id = String(item?.id || '');
      if (id) {
        reactedSet.add(id);
      }
    });
    babyNames.push(...matches.map(({item}) => item));
  };

  // Bounded reads only — fill one Discover page, never scan the whole catalog.
  while (
    hasMore &&
    babyNames.length < pageSize &&
    (!clientSideScan || clientScanWindows < maxScanWindows)
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

    if (usePrefixQuery) {
      const prefix = titleCasePrefix(startWith);
      constraints.push(orderBy('name'));
      if (cursor && typeof cursor === 'object' && cursor.name) {
        constraints.push(
          startAfter(cursor.name),
          endAt(`${prefix}\uf8ff`),
        );
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

    let snapshot;
    try {
      snapshot = await getDocs(query(babyNamesCollection(), ...constraints));
    } catch (e) {
      if (usePrefixQuery) {
        usePrefixQuery = false;
        cursor = null;
        continue;
      }
      throw e;
    }
    if (clientSideScan) {
      clientScanWindows += 1;
    }
    const docs = snapshot.docs || [];
    if (!docs.length) {
      if (unfiltered && !wrappedToStart) {
        wrappedToStart = true;
        cursor = null;
        continue;
      }
      hasMore = false;
      break;
    }

    const matches = takeUnseenMatches(
      docs
        .map(docSnap => ({docSnap, item: mapNameDoc(docSnap)}))
        .filter(({item}) => !filtering || applyFilters([item], filters).length)
        .map(({docSnap, item}) => ({docSnap, item})),
    );
    const remaining = pageSize - babyNames.length;

    if (matches.length >= remaining) {
      const selected = matches.slice(0, remaining);
      commitMatches(selected);
      cursor = toPageCursor(
        selected[selected.length - 1].docSnap,
        usePrefixQuery,
      );
      hasMore =
        selected[selected.length - 1].docSnap.id !== docs[docs.length - 1].id ||
        docs.length === readSize ||
        (unfiltered && !wrappedToStart);
      break;
    }

    commitMatches(matches);
    cursor = toPageCursor(docs[docs.length - 1], usePrefixQuery);
    if (docs.length === readSize) {
      hasMore = true;
    } else if (unfiltered && !wrappedToStart) {
      wrappedToStart = true;
      cursor = null;
      hasMore = true;
    } else {
      hasMore = false;
    }
  }

  return {
    babyNames: unfiltered
      ? shuffleArray(babyNames.slice(0, pageSize))
      : babyNames.slice(0, pageSize),
    nextCursor: hasMore ? cursor : null,
    hasMore,
    namesCount: filtering ? babyNames.length : undefined,
    exact: false,
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

/**
 * Do NOT attach an onSnapshot to the full baby_names collection.
 * With 30k+ docs that freezes/crashes the app and still only partially fills
 * memory (~25k), which then poisons banner counts.
 * Counts use getCountFromServer; pages use bounded queries.
 */
export const startBabyNamesLiveSync = () => {
  return namesUnsubscribe;
};

/** Resolve once a local catalog snapshot exists (or after timeout). */
const waitForCachedNames = (timeoutMs = 6000) =>
  new Promise(resolve => {
    if (cachedNames && cachedNames.length > 0) {
      resolve(cachedNames);
      return;
    }
    let settled = false;
    const finish = value => {
      if (settled) {
        return;
      }
      settled = true;
      nameListeners.delete(onUpdate);
      clearTimeout(timer);
      resolve(value);
    };
    const onUpdate = names => {
      if (Array.isArray(names) && names.length > 0) {
        finish(names);
      }
    };
    nameListeners.add(onUpdate);
    const timer = setTimeout(() => finish(cachedNames), timeoutMs);
  });

export const subscribeBabyNames = listener => {
  nameListeners.add(listener);
  if (cachedNames) {
    listener(cachedNames);
  }
  return () => nameListeners.delete(listener);
};

export const fetchAllBabyNames = async ({forceRefresh = false} = {}) => {
  if (!forceRefresh && cachedNames && cachedNames.length > 0) {
    return cachedNames;
  }

  try {
    const snap = await babyNamesCollection().get();
    cachedNames = mapAndDedupeNames(snap.docs);
    console.log(`baby_names fetched: ${cachedNames.length}`);
    if (cachedNames.length === 0) {
      console.warn(
        'baby_names is empty. Add docs in Console or allow signed-in write to bootstrap.',
      );
    }
    notifyListeners(cachedNames);
    return cachedNames;
  } catch (e) {
    console.warn('baby_names fetch failed:', e?.message || e);
    return cachedNames || [];
  }
};

export const clearNamesCache = () => {
  cachedNames = null;
  cachedNamesCount = null;
  resetFilteredDiscoverCache();
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
  if (!forceRefresh && typeof cachedNamesCount === 'number' && cachedNamesCount > 0) {
    return {namesCount: cachedNamesCount};
  }

  // Share one in-flight aggregate so Discover focus + fetch don't double-hit.
  if (namesCountRequest) {
    return namesCountRequest;
  }

  namesCountRequest = (async () => {
    let serverCount = null;
    try {
      const countSnapshot = await getCountFromServer(babyNamesCollection());
      const namesCount = Number(countSnapshot.data()?.count);
      if (Number.isFinite(namesCount) && namesCount >= 0) {
        serverCount = namesCount;
        cachedNamesCount = namesCount;
        void syncMetaCount(namesCount);
        return {namesCount};
      }
    } catch (e) {
      console.warn('getCountFromServer failed:', e?.message || e);
    }
    try {
      const stats = await metaDocument('global').get();
      if (stats.exists && typeof stats.data()?.namesCount === 'number') {
        const metaCount = Number(stats.data().namesCount);
        // Prefer the higher of meta vs any prior cache — never stick on a
        // stale ~25k after the DB grew to 33k+.
        const best = Math.max(
          metaCount,
          typeof cachedNamesCount === 'number' ? cachedNamesCount : 0,
          serverCount || 0,
        );
        if (best > 0) {
          cachedNamesCount = best;
          return {namesCount: best};
        }
      }
    } catch (e) {
      // ignore
    }
    if (typeof cachedNamesCount === 'number' && cachedNamesCount > 0) {
      return {namesCount: cachedNamesCount};
    }
    return {namesCount: 0};
  })();

  try {
    return await namesCountRequest;
  } finally {
    namesCountRequest = null;
  }
};
