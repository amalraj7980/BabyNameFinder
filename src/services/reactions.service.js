/**
 * Likes / dislikes — memory-first, then local persist, then signed-in cloud sync.
 */
import {resolveOriginMatchSet} from '../constants/countryOriginOptions';
import {
  enqueuePendingLike,
  enqueuePendingDislike,
  enqueuePendingUnlike,
  enqueuePendingUndislike,
  scheduleReactionSync,
  canSyncReactionsToCloud,
  flushPendingReactions,
} from './reactionBatch.service';
import {markPartnerFavorite} from './partner.service';
import {
  resolveReactionUserId,
  mapNameDoc,
  babyNameDocument,
  likedNamesCollection,
  dislikedNamesCollection,
} from '../firebase/firestore';
import {
  applyLike,
  applyDislike,
  applyUnlike,
  applyUndislike,
  hasLike,
  getLikeIds,
  getDislikeIds,
  getLikeRecords,
  getDislikeRecords,
  getReactedIds,
  queryLikes,
  mergeCloudRecords,
  hydrateReactionsStore,
  patchReactionRecord,
  toNameRecord,
} from '../store/reactionsStore';
import {getCurrentUser} from '../firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mapReactionDoc = d => {
  const data = d.data() || {};
  return {
    id: data.nameId || d.id,
    name: data.name || '',
    gender: data.gender || '',
    origin: data.origin || '',
    meaning: data.meaning || '',
    syllables: data.syllables || '',
    syllableCount: data.syllableCount || 1,
  };
};

let cloudHydrateUid = null;
let cloudHydratePromise = null;

const GUEST_CLOUD_PULL_KEY = '@babynames/guest_cloud_pulled_v1';

const enrichRecordInBackground = (id, record) => {
  if (record?.name) {
    return;
  }
  void (async () => {
    try {
      const snap = await babyNameDocument(id).get();
      if (snap.exists && hasLike(id)) {
        patchReactionRecord('like', {...mapNameDoc(snap), id});
      }
    } catch (e) {
      // ignore
    }
  })();
};

const pullAnonymousCloudOnce = async () => {
  if (canSyncReactionsToCloud()) {
    return;
  }
  const uid = getCurrentUser()?.uid;
  if (!uid) {
    return;
  }
  try {
    const done = await AsyncStorage.getItem(GUEST_CLOUD_PULL_KEY);
    if (done) {
      return;
    }
    const [likesSnap, dislikesSnap] = await Promise.all([
      likedNamesCollection(uid).get(),
      dislikedNamesCollection(uid).get(),
    ]);
    mergeCloudRecords(
      'like',
      likesSnap.docs.filter(d => d.id !== '_meta').map(mapReactionDoc),
    );
    mergeCloudRecords('dislike', dislikesSnap.docs.map(mapReactionDoc));
    await AsyncStorage.setItem(GUEST_CLOUD_PULL_KEY, '1');
  } catch (e) {
    // keep local-only if anonymous cloud is unavailable
  }
};

export const startReactionsSystem = async () => {
  await hydrateReactionsStore();
  if (canSyncReactionsToCloud()) {
    void hydrateCloudReactions();
    const {resumeReactionSync} = require('./reactionBatch.service');
    resumeReactionSync();
    return;
  }
  void pullAnonymousCloudOnce();
};

export const resetCloudReactionHydration = () => {
  cloudHydrateUid = null;
  cloudHydratePromise = null;
};

export const clearSignedInLocalUserData = async () => {
  const {clearPendingQueues} = require('./reactionBatch.service');
  const {clearLocalReactions} = require('../store/reactionsStore');
  await clearPendingQueues();
  await clearLocalReactions();
  resetCloudReactionHydration();
  try {
    const {resetGuestLikeMergeGuard} = require('./favorites.service');
    resetGuestLikeMergeGuard();
  } catch (e) {
    // ignore
  }
  try {
    await AsyncStorage.removeItem(GUEST_CLOUD_PULL_KEY);
  } catch (e) {
    // ignore
  }
  try {
    const {clearLocalPartnerState} = require('./partner.service');
    await clearLocalPartnerState();
  } catch (e) {
    // ignore
  }
};

export const hydrateCloudReactions = async userId => {
  const uid = resolveReactionUserId(userId);
  if (!uid || !canSyncReactionsToCloud()) {
    return;
  }
  if (cloudHydrateUid === uid && cloudHydratePromise) {
    return cloudHydratePromise;
  }
  cloudHydrateUid = uid;
  cloudHydratePromise = (async () => {
    try {
      const [likesSnap, dislikesSnap] = await Promise.all([
        likedNamesCollection(uid).get(),
        dislikedNamesCollection(uid).get(),
      ]);
      mergeCloudRecords(
        'like',
        likesSnap.docs.filter(d => d.id !== '_meta').map(mapReactionDoc),
      );
      mergeCloudRecords(
        'dislike',
        dislikesSnap.docs.map(mapReactionDoc),
      );
    } catch (e) {
      console.log('hydrateCloudReactions error:', e?.message || e);
    }
  })();
  return cloudHydratePromise;
};

export const ensureUserReactionBuckets = async () => null;

export const getReactedNameIds = async () => {
  await hydrateReactionsStore();
  const likedIds = getLikeIds();
  const dislikedIds = getDislikeIds();
  return {
    likedIds,
    dislikedIds,
    allIds: getReactedIds(),
  };
};

const queueSignedInLike = record => {
  if (!canSyncReactionsToCloud()) {
    return;
  }
  enqueuePendingLike(record.id, record);
  scheduleReactionSync();
};

const queueSignedInDislike = record => {
  if (!canSyncReactionsToCloud()) {
    return;
  }
  enqueuePendingDislike(record.id, record);
  scheduleReactionSync();
};

/** Always add like — memory first, then local persist, then signed-in sync. */
export const likeName = async ({userId, nameId, toggle = false, ...nameFields}) => {
  const record = toNameRecord(nameId, {id: nameId, ...nameFields});
  if (!record.id) {
    return {liked: false, status: 'error'};
  }

  if (toggle && hasLike(record.id)) {
    applyUnlike(record.id);
    if (canSyncReactionsToCloud()) {
      enqueuePendingUnlike(record.id);
      scheduleReactionSync({userId});
    }
    void markPartnerFavorite(record.id, false).catch(() => {});
    return {liked: false, status: 'success'};
  }

  applyLike(record);
  queueSignedInLike(record);
  void markPartnerFavorite(record.id, true).catch(() => {});
  enrichRecordInBackground(record.id, record);

  try {
    const {trackSuccessfulLike} = require('./rating/ratingService');
    void trackSuccessfulLike();
  } catch (e) {
    // rating optional
  }

  return {liked: true, status: 'success'};
};

export const toggleLikeName = async payload =>
  likeName({...payload, toggle: true});

export const dislikeName = async ({userId, nameId, ...nameFields}) => {
  const record = toNameRecord(nameId, {id: nameId, ...nameFields});
  if (!record.id) {
    return {disliked: false, status: 'error'};
  }
  applyDislike(record);
  queueSignedInDislike(record);
  void markPartnerFavorite(record.id, false).catch(() => {});
  return {disliked: true, status: 'success'};
};

export const removeLike = async ({userId, nameId}) => {
  const id = String(nameId);
  applyUnlike(id);
  if (canSyncReactionsToCloud()) {
    enqueuePendingUnlike(id);
    scheduleReactionSync({userId});
  }
  void markPartnerFavorite(id, false).catch(() => {});
  return {liked: false, status: 'success'};
};

export const removeDislike = async ({userId, nameId}) => {
  const id = String(nameId);
  applyUndislike(id);
  if (canSyncReactionsToCloud()) {
    enqueuePendingUndislike(id);
    scheduleReactionSync({userId});
  }
  return {disliked: false, status: 'success'};
};

const normalizeGender = gender => {
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

const applyListFilters = (names, filters = {}) => {
  const startWith = (filters.startWith || '').toString().toLowerCase();
  const endsWith = (filters.endsWith || '').toString().toLowerCase();
  const contains = (filters.contains || '').toString().toLowerCase();
  const gender = normalizeGender(filters.gender);
  const compoundName = filters.compoundName;

  let originMatch = null;
  if (Array.isArray(filters.origins) && filters.origins.length) {
    originMatch = resolveOriginMatchSet(filters.origins);
  } else if (filters.origin && filters.origin !== 'all') {
    originMatch = resolveOriginMatchSet([filters.origin]);
  }

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
      const g = normalizeGender(item.gender);
      if (gender === 'unisex') {
        if (g !== 'unisex') {
          return false;
        }
      } else if (g !== gender && g !== 'unisex') {
        return false;
      }
    }
    if (compoundName === true || compoundName === 'true') {
      const isCompound = /\s|-/.test(item.name || '');
      if (!isCompound) {
        return false;
      }
    }
    if (originMatch && originMatch.size) {
      const raw = item.origin;
      const itemOrigin = String(
        typeof raw === 'string' ? raw : raw?.name || '',
      )
        .toLowerCase()
        .trim();
      if (!itemOrigin) {
        return false;
      }
      if (originMatch.has(itemOrigin)) {
        return true;
      }
      const parts = itemOrigin
        .split(/[/&,]+/)
        .map(p => p.trim())
        .filter(Boolean);
      if (parts.some(p => originMatch.has(p))) {
        return true;
      }
      for (const token of originMatch) {
        if (token.length >= 3 && itemOrigin.includes(token)) {
          return true;
        }
      }
      return false;
    }
    return true;
  });
};

export const getLikedNamesPage = async (userId, options = {}) => {
  await hydrateReactionsStore();
  if (canSyncReactionsToCloud()) {
    void hydrateCloudReactions(userId);
  }
  return queryLikes({
    pageSize: options.pageSize,
    cursor: options.cursor,
    search: options.search,
    gender: options.gender,
  });
};

export const getUserReactions = async (userId, filters = {}) => {
  await hydrateReactionsStore();
  if (canSyncReactionsToCloud()) {
    void hydrateCloudReactions(userId);
  }
  let likes = getLikeRecords();
  let disLikes = getDislikeRecords();
  likes = applyListFilters(likes, filters);
  disLikes = applyListFilters(disLikes, filters);
  const page = Number(filters.page ?? 0);
  const pageCount = Number(filters.pageCount ?? 1000);
  const slice = list =>
    list.slice(page * pageCount, page * pageCount + pageCount);
  return {likes: slice(likes), disLikes: slice(disLikes)};
};

export const getReactionCounts = async () => {
  await hydrateReactionsStore();
  return {
    likes: getLikeIds().length,
    disLikes: getDislikeIds().length,
  };
};

export {flushPendingReactions};
