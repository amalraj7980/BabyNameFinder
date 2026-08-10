/**
 * Unified favorites — guest local + logged-in cloud (reactions likes + users/favorites).
 */
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  likedNamesCollection,
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
  clearLocalFavorites,
} from './localFavorites.service';

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
 * Merge local guest favorites into the authenticated account (no overwrite).
 * Clears local only after successful sync.
 */
export const migrateLocalFavoritesToAccount = async uid => {
  if (!uid) {
    return {merged: 0};
  }
  const localIds = await getLocalFavoriteIds();
  if (!localIds.length) {
    return {merged: 0};
  }
  const cloudIds = await getCloudFavoriteIds(uid);
  const cloudSet = new Set(cloudIds);
  const toAdd = localIds.filter(id => !cloudSet.has(id));
  const names = await resolveNamesByIds(toAdd);

  // Firestore batch limit 500
  for (let i = 0; i < toAdd.length; i += 400) {
    const slice = toAdd.slice(i, i + 400);
    const batch = firestore().batch();
    slice.forEach(id => {
      const nameData = names.find(n => String(n.id) === id) || {};
      batch.set(
        userFavoriteDocument(uid, id),
        {
          nameId: id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {merge: true},
      );
      batch.set(
        likedNameDocument(uid, id),
        {
          nameId: id,
          name: nameData.name || '',
          gender: nameData.gender || '',
          origin: nameData.origin || '',
          meaning: nameData.meaning || '',
          syllables: nameData.syllables || '',
          syllableCount: nameData.syllableCount || 1,
          createdAt: serverTimestamp(),
        },
        {merge: true},
      );
    });
    await batch.commit();
  }

  await clearLocalFavorites();
  return {merged: toAdd.length, total: localIds.length};
};

/** Copy reactions from previous anonymous uid into new uid, then migrate local. */
export const migrateGuestDataToAccount = async (fromUid, toUid) => {
  if (!toUid) {
    return {merged: 0};
  }
  if (fromUid && fromUid !== toUid) {
    try {
      const likesSnap = await likedNamesCollection(fromUid).get();
      for (let i = 0; i < likesSnap.docs.length; i += 400) {
        const slice = likesSnap.docs.slice(i, i + 400);
        const batch = firestore().batch();
        slice.forEach(docSnap => {
          const data = docSnap.data() || {};
          batch.set(
            likedNameDocument(toUid, docSnap.id),
            {...data, nameId: docSnap.id},
            {merge: true},
          );
          batch.set(
            userFavoriteDocument(toUid, docSnap.id),
            {
              nameId: docSnap.id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            {merge: true},
          );
        });
        await batch.commit();
      }
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
    const {flushPendingReactions} = require('./reactionBatch.service');
    await flushPendingReactions({userId, force: true});
  } catch (e) {
    console.warn('ensureCloudFavorites flush skipped:', e?.message || e);
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

  return {ok: true, merged};
};

export const getFavoriteNameCards = async ({userId, isLoggedIn} = {}) => {
  const uid = userId || auth().currentUser?.uid || null;
  if (isLoggedIn && uid) {
    const ids = await getCloudFavoriteIds(uid);
    return resolveNamesByIds(ids.filter(id => id !== '_meta'));
  }
  // Guest: local first; also merge anon cloud likes if present
  const localIds = await getLocalFavoriteIds();
  let cloudIds = [];
  if (uid) {
    cloudIds = await getCloudFavoriteIds(uid).catch(() => []);
  }
  const merged = [...new Set([...localIds, ...cloudIds])].filter(
    id => id !== '_meta',
  );
  return resolveNamesByIds(merged);
};

export {addLocalFavorite, removeLocalFavorite, getLocalFavoriteIds};
