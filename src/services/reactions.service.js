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

/** Rules have no parent reaction doc — subcollections stand alone. */
export const ensureUserReactionBuckets = async () => null;

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

const reactionPayload = (id, nameData) => ({
  nameId: id,
  name: nameData.name || '',
  gender: nameData.gender || '',
  origin: nameData.origin || '',
  meaning: nameData.meaning || '',
  syllables: nameData.syllables || '',
  syllableCount: nameData.syllableCount || 1,
  createdAt: serverTimestamp(),
});

export const likeName = async ({userId, nameId}) => {
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    throw 'Please wait — connecting to Firebase…';
  }
  const id = String(nameId);
  try {
    const likeDoc = likedNameDocument(uid, id);
    const existing = await likeDoc.get();
    if (existing.exists) {
      await likeDoc.delete();
      return {liked: false};
    }
    const nameData = await getNameSnapshot(id);
    const batch = firestore().batch();
    // Rules require request.resource.data.nameId == nameId
    batch.set(likeDoc, reactionPayload(id, nameData));
    batch.delete(dislikedNameDocument(uid, id));
    await batch.commit();
    return {liked: true};
  } catch (e) {
    console.log('likeName error:', e?.message || e);
    throw 'Unable to save like. Please try again.';
  }
};

export const dislikeName = async ({userId, nameId}) => {
  const uid = resolveReactionUserId(userId);
  if (!uid) {
    throw 'Please wait — connecting to Firebase…';
  }
  const id = String(nameId);
  try {
    const nameData = await getNameSnapshot(id);
    const batch = firestore().batch();
    batch.set(dislikedNameDocument(uid, id), reactionPayload(id, nameData));
    batch.delete(likedNameDocument(uid, id));
    await batch.commit();
    return {disliked: true};
  } catch (e) {
    console.log('dislikeName error:', e?.message || e);
    throw 'Unable to save dislike. Please try again.';
  }
};

const applyListFilters = (names, filters = {}) => {
  const startWith = (filters.startWith || '').toString().toLowerCase();
  const endsWith = (filters.endsWith || '').toString().toLowerCase();
  const contains = (filters.contains || '').toString().toLowerCase();
  const gender = (filters.gender || 'all').toString().toLowerCase();

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
      if (gender === 'unisex') {
        if (g !== 'unisex') {
          return false;
        }
      } else if (g !== gender) {
        return false;
      }
    }
    return true;
  });
};

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
    let likes = likesSnap.docs.map(d => {
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
    });
    let disLikes = dislikesSnap.docs.map(d => {
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
    });
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
