/**
 * Unified favorites — guest local + logged-in cloud (reactions likes + users/favorites).
 */
import {getCurrentUser} from '../firebase/auth';
import {
  likedNamesCollection,
  likedNameDocument,
  babyNameDocument,
  mapNameDoc,
  serverTimestamp,
  userFavoritesCollection,
  userFavoriteDocument,
  userDocument,
  createWriteBatch,
  setDocument,
} from '../firebase/firestore';
import {fetchAllBabyNames} from './babyNames.service';
import {
  getLocalFavoriteIds,
  addLocalFavorite,
  removeLocalFavorite,
} from './localFavorites.service';
import {
  hydrateReactionsStore,
  getLikeRecords,
  replaceLikeRecords,
} from '../store/reactionsStore';
import {getDocs} from '@react-native-firebase/firestore';

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
      getDocs(likedNamesCollection(uid)).catch(() => null),
      getDocs(userFavoritesCollection(uid)).catch(() => null),
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
  const batch = createWriteBatch();
  batch.set(userFavoriteDocument(uid, id), payload, {merge: true});
  batch.set(likedNameDocument(uid, id), likePayload, {merge: true});
  await batch.commit();
};

let guestLikeMergeUid = null;
let guestLikeMergeInFlight = null;

export const resetGuestLikeMergeGuard = () => {
  guestLikeMergeUid = null;
  guestLikeMergeInFlight = null;
};

const mapLikeDoc = docSnap => {
  const data = docSnap.data() || {};
  return {
    id: String(data.nameId || docSnap.id),
    name: data.name || '',
    gender: data.gender || '',
    origin: data.origin || '',
    meaning: data.meaning || '',
    syllables: data.syllables || '',
    syllableCount: data.syllableCount || 1,
  };
};

/**
 * After guest → Google/email login: fetch account likes, upload only local
 * guest likes that are missing, then replace the temporary guest list.
 */
export const migrateLocalFavoritesToAccount = async uid => {
  const userId = String(uid || '');
  if (!userId) {
    return {merged: 0};
  }
  if (guestLikeMergeUid === userId) {
    return {merged: 0, skipped: true};
  }
  if (guestLikeMergeInFlight) {
    return guestLikeMergeInFlight;
  }

  guestLikeMergeInFlight = (async () => {
    await hydrateReactionsStore();
    const guestLikes = getLikeRecords();

    let likesSnap = null;
    let favSnap = null;
    try {
      [likesSnap, favSnap] = await Promise.all([
        getDocs(likedNamesCollection(userId)),
        getDocs(userFavoritesCollection(userId)).catch(() => null),
      ]);
    } catch (e) {
      console.warn('Fetch account likes failed:', e?.message || e);
      throw e;
    }

    const cloudRecords = [];
    const cloudIds = new Set();
    likesSnap?.docs?.forEach(docSnap => {
      if (docSnap.id === '_meta') {
        return;
      }
      cloudIds.add(String(docSnap.id));
      cloudRecords.push(mapLikeDoc(docSnap));
    });
    favSnap?.docs?.forEach(docSnap => {
      if (docSnap.id !== '_meta') {
        cloudIds.add(String(docSnap.id));
      }
    });

    const toAdd = guestLikes.filter(
      record => record?.id && !cloudIds.has(String(record.id)),
    );

    for (let i = 0; i < toAdd.length; i += 400) {
      const slice = toAdd.slice(i, i + 400);
      const batch = createWriteBatch();
      slice.forEach(record => {
        const id = String(record.id);
        batch.set(
          userFavoriteDocument(userId, id),
          {
            nameId: id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          {merge: true},
        );
        batch.set(
          likedNameDocument(userId, id),
          {
            nameId: id,
            name: record.name || '',
            gender: record.gender || '',
            origin: record.origin || '',
            meaning: record.meaning || '',
            syllables: record.syllables || '',
            syllableCount: record.syllableCount || 1,
            createdAt: serverTimestamp(),
          },
          {merge: true},
        );
      });
      await batch.commit();
    }

    const mergedById = new Map();
    cloudRecords.forEach(record => {
      mergedById.set(String(record.id), record);
    });
    toAdd.forEach(record => {
      mergedById.set(String(record.id), record);
    });
    await replaceLikeRecords([...mergedById.values()]);

    try {
      const {clearPendingQueues} = require('./reactionBatch.service');
      await clearPendingQueues();
    } catch (e) {
      // ignore
    }

    guestLikeMergeUid = userId;
    return {merged: toAdd.length, existing: cloudIds.size};
  })().finally(() => {
    guestLikeMergeInFlight = null;
  });

  return guestLikeMergeInFlight;
};

/** Copy reactions from previous anonymous uid into new uid, then migrate local. */
export const migrateGuestDataToAccount = async (fromUid, toUid) => {
  if (!toUid) {
    return {merged: 0};
  }
  return migrateLocalFavoritesToAccount(toUid);
};

/**
 * Ensure logged-in user has a Firebase profile + favorites synced from local.
 * Creates `users/{uid}/favorites/_meta` so the favorites collection is visible
 * in Console even before the first like.
 */
export const ensureCloudFavoritesForUser = async uid => {
  const current = getCurrentUser();
  const userId = String(uid || current?.uid || '');
  if (!userId) {
    return {ok: false, merged: 0};
  }
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
    await setDocument(
      userFavoriteDocument(userId, '_meta'),
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
    await setDocument(
      userDocument(userId),
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
