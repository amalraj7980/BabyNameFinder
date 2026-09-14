/**
 * Unified favorites — guest local + logged-in cloud (reactions likes + users/favorites).
 */
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  likedNamesCollection,
  dislikedNamesCollection,
  likedNameDocument,
  babyNameDocument,
  mapNameDoc,
  serverTimestamp,
} from '../firebase/firestore';
import {FIRESTORE_COLLECTIONS as COLLECTIONS} from '../firebase/config';
import {fetchAllBabyNames} from './babyNames.service';
import {
  getLocalFavoriteIds,
  addLocalFavorite,
  removeLocalFavorite,
} from './localFavorites.service';
import {
  hydrateReactionsStore,
  mergeCloudRecords,
  getLikeRecords,
} from '../store/reactionsStore';

const userFavoritesCollection = uid =>
  firestore()
    .collection(COLLECTIONS.users)
    .doc(String(uid))
    .collection('favorites');

const userFavoriteDocument = (uid, nameId) =>
  userFavoritesCollection(uid).doc(String(nameId));

const resolveNamesByIds = async ids => {
  const unique = [...new Set((ids || []).map(String))];
  if (!unique.length) {
    return [];
  }
  const all = await fetchAllBabyNames().catch(() => []);
  const byId = new Map(all.map(n => [String(n.id), n]));
  const missing = [];
  for (const id of unique) {
    if (!byId.has(id)) {
      missing.push(id);
    }
  }
  await Promise.all(
    missing.map(async id => {
      try {
        const snap = await babyNameDocument(id).get();
        if (snap.exists) {
          byId.set(id, mapNameDoc(snap));
        }
      } catch (e) {
        // ignore
      }
    }),
  );
  return unique
    .map(id => byId.get(id) || {id, name: id, gender: 'Unisex'})
    .filter(Boolean);
};

export const getCloudFavoriteIds = async uid => {
  if (!uid) {
    return [];
  }
  try {
    const [likesSnap, favSnap] = await Promise.all([
      likedNamesCollection(uid).get().catch(() => null),
      userFavoritesCollection(uid).get().catch(() => null),
    ]);
    const ids = new Set();
    likesSnap?.docs?.forEach(d => {
      if (d.id !== '_meta') {
        ids.add(d.id);
      }
    });
    favSnap?.docs?.forEach(d => {
      if (d.id !== '_meta') {
        ids.add(d.id);
      }
    });
    return [...ids];
  } catch (e) {
    return [];
  }
};

export const addCloudFavorite = async (uid, nameId, nameData = {}) => {
  const id = String(nameId);
  const payload = {
    nameId: id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const likePayload = {
    nameId: id,
    name: nameData.name || '',
    gender: nameData.gender || '',
    origin: nameData.origin || '',
    meaning: nameData.meaning || '',
    syllables: nameData.syllables || '',
    syllableCount: nameData.syllableCount || 1,
    createdAt: serverTimestamp(),
  };
  const batch = firestore().batch();
  batch.set(userFavoriteDocument(uid, id), payload, {merge: true});
  batch.set(likedNameDocument(uid, id), likePayload, {merge: true});
  await batch.commit();
};

/**
 * Merge local guest likes/dislikes into the authenticated account.
 * Local store stays as the cache; cloud write is a single background batch.
 */
export const migrateLocalFavoritesToAccount = async uid => {
  if (!uid) {
    return {merged: 0};
  }
  await hydrateReactionsStore();
  const {
    enqueueLocalStoreForAccountMerge,
    flushPendingReactions,
    resumeReactionSync,
  } = require('./reactionBatch.service');
  const merged = await enqueueLocalStoreForAccountMerge();
  resumeReactionSync();
  void flushPendingReactions({userId: uid, force: true});
  return {merged, total: merged};
};

/** Copy reactions from previous anonymous uid into new uid, then migrate local. */
export const migrateGuestDataToAccount = async (fromUid, toUid) => {
  if (!toUid) {
    return {merged: 0};
  }
  if (fromUid && fromUid !== toUid) {
    try {
      const [likesSnap, dislikesSnap] = await Promise.all([
        likedNamesCollection(fromUid).get(),
        dislikedNamesCollection(fromUid).get().catch(() => ({docs: []})),
      ]);
      mergeCloudRecords(
        'like',
        likesSnap.docs
          .filter(d => d.id !== '_meta')
          .map(d => {
            const data = d.data() || {};
            return {id: d.id, ...data};
          }),
      );
      mergeCloudRecords(
        'dislike',
        (dislikesSnap.docs || []).map(d => {
          const data = d.data() || {};
          return {id: d.id, ...data};
        }),
      );
    } catch (e) {
      console.warn('Anon reaction migrate skipped:', e?.message || e);
    }
  }
  return migrateLocalFavoritesToAccount(toUid);
};

/**
 * Ensure logged-in user has a Firebase profile + favorites synced from local.
 * Creates `users/{uid}/favorites/_meta` so the favorites collection is visible
 * in Console even before the first like.
 */
export const ensureCloudFavoritesForUser = async uid => {
  const userId = String(uid || auth().currentUser?.uid || '');
  if (!userId) {
    return {ok: false, merged: 0};
  }
  const current = auth().currentUser;
  if (!current || current.isAnonymous) {
    return {ok: false, merged: 0, guest: true};
  }

  try {
    const {resumeReactionSync} = require('./reactionBatch.service');
    resumeReactionSync();
  } catch (e) {
    // ignore
  }

  try {
    const {ensureUserProfileFromAuth} = require('./user.service');
    await ensureUserProfileFromAuth(current);
  } catch (e) {
    console.warn('ensureCloudFavorites profile skipped:', e?.message || e);
  }

  let merged = 0;
  try {
    const result = await migrateLocalFavoritesToAccount(userId);
    merged = result?.merged || 0;
  } catch (e) {
    console.warn('ensureCloudFavorites migrate failed:', e?.message || e);
  }

  try {
    await userFavoriteDocument(userId, '_meta').set(
      {
        nameId: '_meta',
        initialized: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      {merge: true},
    );
  } catch (e) {
    console.warn('ensureCloudFavorites meta failed:', e?.message || e);
  }

  try {
    await firestore()
      .collection(COLLECTIONS.users)
      .doc(userId)
      .set(
        {
          favoritesSyncedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {merge: true},
      );
  } catch (e) {
    console.warn('ensureCloudFavorites user stamp failed:', e?.message || e);
  }

  try {
    const {hydrateCloudReactions} = require('./reactions.service');
    void hydrateCloudReactions(userId);
  } catch (e) {
    // ignore
  }

  return {ok: true, merged};
};

export const getFavoriteNameCards = async () => {
  await hydrateReactionsStore();
  const local = getLikeRecords();
  if (local.length) {
    return local;
  }
  return resolveNamesByIds(await getLocalFavoriteIds());
};

export {addLocalFavorite, removeLocalFavorite, getLocalFavoriteIds};
