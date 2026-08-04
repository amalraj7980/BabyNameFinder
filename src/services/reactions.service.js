/**
 * Likes / dislikes — Firestore reactions/{uid}/likes|dislikes
 * Legacy REST parity via api/index.js (likeUser, disLikeUser, getReactions, …)
 */
import firestore from '@react-native-firebase/firestore';
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
import {fetchAllBabyNames} from './babyNames.service';

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

const reactionPayload = (id, nameData) => ({
  nameId: String(id),
  name: nameData.name || '',
  gender: nameData.gender || '',
  origin: nameData.origin || '',
  meaning: nameData.meaning || '',
  syllables: nameData.syllables || '',
  syllableCount: nameData.syllableCount || 1,
  createdAt: serverTimestamp(),
});

export const getReactedNameIds = async userId => {
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    return {likedIds: [], dislikedIds: [], allIds: []};
  }
  try {
    const [likesSnap, dislikesSnap] = await Promise.all([
      likedNamesCollection(uid).get(),
      dislikedNamesCollection(uid).get(),
    ]);
    const likedIds = likesSnap.docs.map(d => d.id);
    const dislikedIds = dislikesSnap.docs.map(d => d.id);
    return {
      likedIds,
      dislikedIds,
      allIds: [...likedIds, ...dislikedIds],
    };
  } catch (e) {
    console.log('getReactedNameIds error:', e?.message || e);
    return {likedIds: [], dislikedIds: [], allIds: []};
  }
};

/** Always add like (swipe / move from dislike). Removes dislike if present. */
export const likeName = async ({userId, nameId, toggle = false}) => {
  const uid = requireUid(userId);
  const id = String(nameId);
  try {
    const likeDoc = likedNameDocument(uid, id);
    if (toggle) {
      const existing = await likeDoc.get();
      if (existing.exists) {
        await likeDoc.delete();
        return {liked: false, status: 'success'};
      }
    }
    const nameData = await getNameSnapshot(id);
    const batch = firestore().batch();
    batch.set(likeDoc, reactionPayload(id, nameData));
    batch.delete(dislikedNameDocument(uid, id));
    await batch.commit();
    try {
      const {trackSuccessfulLike} = require('./rating/ratingService');
      void trackSuccessfulLike();
    } catch (e) {
      // rating optional
    }
    return {liked: true, status: 'success'};
  } catch (e) {
    console.log('likeName error:', e?.message || e);
    if (typeof e === 'string') {
      throw e;
    }
    throw 'Unable to save like. Please try again.';
  }
};

/** Toggle favorite (TheWholeLIst heart). */
export const toggleLikeName = async payload =>
  likeName({...payload, toggle: true});

/** Always add dislike. Removes like if present. */
export const dislikeName = async ({userId, nameId}) => {
  const uid = requireUid(userId);
  const id = String(nameId);
  try {
    const nameData = await getNameSnapshot(id);
    const batch = firestore().batch();
    batch.set(dislikedNameDocument(uid, id), reactionPayload(id, nameData));
    batch.delete(likedNameDocument(uid, id));
    await batch.commit();
    return {disliked: true, status: 'success'};
  } catch (e) {
    console.log('dislikeName error:', e?.message || e);
    if (typeof e === 'string') {
      throw e;
    }
    throw 'Unable to save dislike. Please try again.';
  }
};

/** Undo like — delete like doc only. */
export const removeLike = async ({userId, nameId}) => {
  const uid = requireUid(userId);
  const id = String(nameId);
  try {
    await likedNameDocument(uid, id).delete();
    return {liked: false, status: 'success'};
  } catch (e) {
    console.log('removeLike error:', e?.message || e);
    throw 'Unable to undo like.';
  }
};

/** Undo dislike — delete dislike doc only. */
export const removeDislike = async ({userId, nameId}) => {
  const uid = requireUid(userId);
  const id = String(nameId);
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
    if (compoundName === false || compoundName === 'false') {
      if (/\s|-/.test(item.name || '')) {
        return false;
      }
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

/** Legacy shape: { likes, disLikes } */
export const getUserReactions = async (userId, filters = {}) => {
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    return {likes: [], disLikes: []};
  }
  try {
    const [likesSnap, dislikesSnap] = await Promise.all([
      likedNamesCollection(uid).get(),
      dislikedNamesCollection(uid).get(),
    ]);
    let likes = likesSnap.docs.map(mapReactionDoc);
    let disLikes = dislikesSnap.docs.map(mapReactionDoc);
    likes = applyListFilters(likes, filters);
    disLikes = applyListFilters(disLikes, filters);
    const page = Number(filters.page ?? 0);
    const pageCount = Number(filters.pageCount ?? 1000);
    const slice = list =>
      list.slice(page * pageCount, page * pageCount + pageCount);
    return {likes: slice(likes), disLikes: slice(disLikes)};
  } catch (e) {
    console.log('getUserReactions error:', e?.message || e);
    return {likes: [], disLikes: []};
  }
};

/** Legacy shape: { likes, disLikes } */
export const getReactionCounts = async userId => {
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    return {likes: 0, disLikes: 0};
  }
  try {
    const [likesSnap, dislikesSnap] = await Promise.all([
      likedNamesCollection(uid).get(),
      dislikedNamesCollection(uid).get(),
    ]);
    return {
      likes: likesSnap.size,
      disLikes: dislikesSnap.size,
    };
  } catch (e) {
    console.log('getReactionCounts error:', e?.message || e);
    return {likes: 0, disLikes: 0};
  }
};
