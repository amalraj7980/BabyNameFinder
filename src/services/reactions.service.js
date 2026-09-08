/**
 * Likes / dislikes — local-first with batched Firebase sync (every 10 items).
 * Legacy REST parity via api/index.js (likeUser, disLikeUser, getReactions, …)
 */
import {fetchAllBabyNames} from './babyNames.service';
import {resolveOriginMatchSet} from '../constants/countryOriginOptions';
import {addLocalFavorite, removeLocalFavorite} from './localFavorites.service';
import {
  addLocalDislike,
  removeLocalDislike,
  getLocalDislikeIds,
} from './localDislikes.service';
import {
  enqueuePendingLike,
  enqueuePendingDislike,
  dequeuePendingLike,
  dequeuePendingDislike,
  maybeFlushAfterEnqueue,
  flushPendingReactions,
} from './reactionBatch.service';
import {markPartnerFavorite} from './partner.service';
import firestore from '@react-native-firebase/firestore';
import {
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from '@react-native-firebase/firestore';
import {
  resolveReactionUserId,
  mapNameDoc,
  babyNameDocument,
  likedNamesCollection,
  dislikedNamesCollection,
  likedNameDocument,
  dislikedNameDocument,
  serverTimestamp,
} from '../firebase/firestore';

const userFavoriteDoc = (uid, nameId) =>
  firestore()
    .collection('users')
    .doc(String(uid))
    .collection('favorites')
    .doc(String(nameId));

const getNameSnapshot = async nameId => {
  try {
    const docSnap = await babyNameDocument(nameId).get();
    if (docSnap.exists) {
      return mapNameDoc(docSnap);
    }
  } catch (e) {
    // ignore
  }
  try {
    const all = await fetchAllBabyNames();
    return (
      all.find(n => String(n.id) === String(nameId)) || {
        id: nameId,
        name: '',
        gender: 'Unisex',
      }
    );
  } catch (e) {
    return {id: nameId, name: '', gender: 'Unisex'};
  }
};

export const ensureUserReactionBuckets = async () => null;

const requireUid = userId => {
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    throw 'Please wait — connecting to Firebase…';
  }
  return uid;
};

export const getReactedNameIds = async userId => {
  const uid = resolveReactionUserId(userId);
  let likedIds = [];
  let dislikedIds = [];
  if (uid) {
    try {
      const [likesSnap, dislikesSnap] = await Promise.all([
        likedNamesCollection(uid).get(),
        dislikedNamesCollection(uid).get(),
      ]);
      likedIds = likesSnap.docs.map(d => d.id).filter(id => id !== '_meta');
      dislikedIds = dislikesSnap.docs.map(d => d.id);
    } catch (e) {
      console.log('getReactedNameIds error:', e?.message || e);
    }
  }
  // Merge local / pending so Discover excludes them before cloud flush
  try {
    const {getLocalFavoriteIds} = require('./localFavorites.service');
    const localLikes = await getLocalFavoriteIds();
    const localDislikes = await getLocalDislikeIds();
    likedIds = [...new Set([...likedIds, ...localLikes])];
    dislikedIds = [...new Set([...dislikedIds, ...localDislikes])];
  } catch (e) {
    // ignore
  }
  return {
    likedIds,
    dislikedIds,
    allIds: [...new Set([...likedIds, ...dislikedIds])],
  };
};

/** Always add like — local immediate; Firebase when pending likes ≥ 10. */
export const likeName = async ({userId, nameId, toggle = false}) => {
  const id = String(nameId);
  const nameData = await getNameSnapshot(id);

  try {
    if (toggle) {
      const {toggleLocalFavorite} = require('./localFavorites.service');
      const result = await toggleLocalFavorite(id);
      if (!result.favorited) {
        await removeLocalDislike(id).catch(() => {});
        await dequeuePendingLike(id).catch(() => {});
        try {
          const uid = resolveReactionUserId(userId);
          if (uid) {
            await likedNameDocument(uid, id).delete().catch(() => {});
            await userFavoriteDoc(uid, id).delete().catch(() => {});
          }
          await markPartnerFavorite(id, false).catch(() => {});
        } catch (e) {
          // ignore cloud
        }
        return {liked: false, status: 'success'};
      }
    } else {
      await addLocalFavorite(id);
    }
    await removeLocalDislike(id).catch(() => {});
    await dequeuePendingDislike(id).catch(() => {});
  } catch (e) {
    // continue
  }

  const pendingCount = await enqueuePendingLike(id, nameData);
  await maybeFlushAfterEnqueue({userId, side: 'like'});

  try {
    const {trackSuccessfulLike} = require('./rating/ratingService');
    void trackSuccessfulLike();
  } catch (e) {
    // rating optional
  }

  return {
    liked: true,
    status: 'success',
    pending: pendingCount < 10,
    pendingCount,
  };
};

/** Toggle favorite (TheWholeLIst heart). */
export const toggleLikeName = async payload =>
  likeName({...payload, toggle: true});

/** Always add dislike — local immediate; Firebase when pending dislikes ≥ 10. */
export const dislikeName = async ({userId, nameId}) => {
  const id = String(nameId);
  const nameData = await getNameSnapshot(id);

  await removeLocalFavorite(id).catch(() => {});
  await addLocalDislike(id).catch(() => {});
  await dequeuePendingLike(id).catch(() => {});

  const pendingCount = await enqueuePendingDislike(id, nameData);
  await maybeFlushAfterEnqueue({userId, side: 'dislike'});

  return {
    disliked: true,
    status: 'success',
    pending: pendingCount < 10,
    pendingCount,
  };
};

/** Undo like — delete like doc only. */
export const removeLike = async ({userId, nameId}) => {
  const id = String(nameId);
  await removeLocalFavorite(id).catch(() => {});
  await dequeuePendingLike(id).catch(() => {});
  await markPartnerFavorite(id, false).catch(() => {});
  try {
    const uid = requireUid(userId);
    await likedNameDocument(uid, id).delete();
    await userFavoriteDoc(uid, id).delete().catch(() => {});
    return {liked: false, status: 'success'};
  } catch (e) {
    console.log('removeLike error:', e?.message || e);
    return {liked: false, status: 'success', offline: true};
  }
};

/** Undo dislike — delete dislike doc only. */
export const removeDislike = async ({userId, nameId}) => {
  const id = String(nameId);
  await removeLocalDislike(id).catch(() => {});
  await dequeuePendingDislike(id).catch(() => {});
  const uid = requireUid(userId);
  try {
    await dislikedNameDocument(uid, id).delete();
    return {disliked: false, status: 'success'};
  } catch (e) {
    console.log('removeDislike error:', e?.message || e);
    throw 'Unable to undo dislike.';
  }
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

/**
 * Reads one small cursor page from the signed-in user's likes collection.
 * Unlike the legacy reaction function, this never downloads every like just
 * to render the first screen.
 */
export const getLikedNamesPage = async (userId, options = {}) => {
  const requestedSize = Number(options.pageSize);
  const pageSize = Math.max(
    1,
    Math.min(Number.isFinite(requestedSize) ? requestedSize : 20, 50),
  );
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    return {likes: [], nextCursor: null, hasMore: false};
  }

  let cursor = typeof options.cursor === 'string' ? options.cursor : null;
  let hasMore = true;
  const likes = [];

  // Some legacy accounts have a `_meta` document. Skip it and make at most
  // one extra small query so users still see a complete 20-name page.
  while (hasMore && likes.length < pageSize) {
    const remaining = pageSize - likes.length;
    const constraints = [orderBy(documentId())];
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    constraints.push(limit(remaining));

    const snapshot = await getDocs(
      query(likedNamesCollection(uid), ...constraints),
    );
    const docs = snapshot.docs || [];
    if (!docs.length) {
      hasMore = false;
      break;
    }

    cursor = docs[docs.length - 1].id;
    hasMore = docs.length === remaining;
    docs.forEach(docSnap => {
      if (docSnap.id !== '_meta') {
        likes.push(mapReactionDoc(docSnap));
      }
    });
  }

  return {
    likes,
    nextCursor: hasMore ? cursor : null,
    hasMore,
  };
};

/** Legacy shape: { likes, disLikes } — merges guest local favorites. */
export const getUserReactions = async (userId, filters = {}) => {
  const uid = resolveReactionUserId(userId);
  let likes = [];
  let disLikes = [];
  if (uid) {
    try {
      const [likesSnap, dislikesSnap] = await Promise.all([
        likedNamesCollection(uid).get(),
        dislikedNamesCollection(uid).get(),
      ]);
      likes = likesSnap.docs
        .filter(d => d.id !== '_meta')
        .map(mapReactionDoc);
      disLikes = dislikesSnap.docs.map(mapReactionDoc);
    } catch (e) {
      console.log('getUserReactions error:', e?.message || e);
    }
  }
  try {
    const {getFavoriteNameCards} = require('./favorites.service');
    const localCards = await getFavoriteNameCards({
      userId: uid,
      isLoggedIn: false,
    });
    const existing = new Set(likes.map(l => String(l.id)));
    localCards.forEach(card => {
      if (!existing.has(String(card.id))) {
        likes.push({
          id: card.id,
          name: card.name || '',
          gender: card.gender || '',
          origin: card.origin || '',
          meaning: card.meaning || '',
          syllables: card.syllables || '',
          syllableCount: card.syllableCount || 1,
        });
      }
    });
  } catch (e) {
    // ignore
  }
  likes = applyListFilters(likes, filters);
  disLikes = applyListFilters(disLikes, filters);
  const page = Number(filters.page ?? 0);
  const pageCount = Number(filters.pageCount ?? 1000);
  const slice = list =>
    list.slice(page * pageCount, page * pageCount + pageCount);
  return {likes: slice(likes), disLikes: slice(disLikes)};
};

/** Legacy shape: { likes, disLikes } */
export const getReactionCounts = async userId => {
  const uid = resolveReactionUserId(userId);
  try {
    const {getLocalFavoriteIds} = require('./localFavorites.service');
    const localLikes = await getLocalFavoriteIds();
    const localDislikes = await getLocalDislikeIds();
    if (!uid) {
      return {likes: localLikes.length, disLikes: localDislikes.length};
    }
    const [likesSnap, dislikesSnap] = await Promise.all([
      likedNamesCollection(uid).get(),
      dislikedNamesCollection(uid).get(),
    ]);
    const cloudLikes = likesSnap.docs.filter(d => d.id !== '_meta').length;
    return {
      likes: Math.max(cloudLikes, localLikes.length),
      disLikes: Math.max(dislikesSnap.size, localDislikes.length),
    };
  } catch (e) {
    console.log('getReactionCounts error:', e?.message || e);
    return {likes: 0, disLikes: 0};
  }
};

export {flushPendingReactions};
