/**
 * Batch cloud sync for likes / dislikes.
 * Local lists update immediately; Firebase writes only when a pending
 * queue reaches SYNC_BATCH_SIZE (default 10), or on forced flush
 * (app background, login migrate, logout).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  likedNameDocument,
  dislikedNameDocument,
  serverTimestamp,
  resolveReactionUserId,
} from '../firebase/firestore';
import {markPartnerFavorite} from './partner.service';

export const SYNC_BATCH_SIZE = 10;

const PENDING_LIKES_KEY = '@babynames/pending_likes_v1';
const PENDING_DISLIKES_KEY = '@babynames/pending_dislikes_v1';

const userFavoriteDoc = (uid, nameId) =>
  firestore()
    .collection('users')
    .doc(String(uid))
    .collection('favorites')
    .doc(String(nameId));

const readQueue = async key => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
};

const writeQueue = async (key, map) => {
  await AsyncStorage.setItem(key, JSON.stringify(map || {}));
};

const reactionPayload = (id, nameData = {}) => ({
  nameId: String(id),
  name: nameData.name || '',
  gender: nameData.gender || '',
  origin: nameData.origin || '',
  meaning: nameData.meaning || '',
  syllables: nameData.syllables || '',
  syllableCount: nameData.syllableCount || 1,
  createdAt: serverTimestamp(),
});

const favPayload = id => ({
  nameId: String(id),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

export const getPendingLikeIds = async () => Object.keys(await readQueue(PENDING_LIKES_KEY));

export const getPendingDislikeIds = async () =>
  Object.keys(await readQueue(PENDING_DISLIKES_KEY));

export const enqueuePendingLike = async (nameId, nameData = {}) => {
  const id = String(nameId);
  const likes = await readQueue(PENDING_LIKES_KEY);
  const dislikes = await readQueue(PENDING_DISLIKES_KEY);
  delete dislikes[id];
  likes[id] = {
    nameId: id,
    name: nameData.name || '',
    gender: nameData.gender || '',
    origin: nameData.origin || '',
    meaning: nameData.meaning || '',
    syllables: nameData.syllables || '',
    syllableCount: nameData.syllableCount || 1,
  };
  await writeQueue(PENDING_DISLIKES_KEY, dislikes);
  await writeQueue(PENDING_LIKES_KEY, likes);
  return Object.keys(likes).length;
};

export const enqueuePendingDislike = async (nameId, nameData = {}) => {
  const id = String(nameId);
  const likes = await readQueue(PENDING_LIKES_KEY);
  const dislikes = await readQueue(PENDING_DISLIKES_KEY);
  delete likes[id];
  dislikes[id] = {
    nameId: id,
    name: nameData.name || '',
    gender: nameData.gender || '',
    origin: nameData.origin || '',
    meaning: nameData.meaning || '',
    syllables: nameData.syllables || '',
    syllableCount: nameData.syllableCount || 1,
  };
  await writeQueue(PENDING_LIKES_KEY, likes);
  await writeQueue(PENDING_DISLIKES_KEY, dislikes);
  return Object.keys(dislikes).length;
};

export const dequeuePendingLike = async nameId => {
  const id = String(nameId);
  const likes = await readQueue(PENDING_LIKES_KEY);
  if (likes[id]) {
    delete likes[id];
    await writeQueue(PENDING_LIKES_KEY, likes);
  }
};

export const dequeuePendingDislike = async nameId => {
  const id = String(nameId);
  const dislikes = await readQueue(PENDING_DISLIKES_KEY);
  if (dislikes[id]) {
    delete dislikes[id];
    await writeQueue(PENDING_DISLIKES_KEY, dislikes);
  }
};

let flushing = false;

const flushMapInChunks = async (uid, entries, writer) => {
  for (let i = 0; i < entries.length; i += 400) {
    const slice = entries.slice(i, i + 400);
    const batch = firestore().batch();
    slice.forEach(([id, data]) => writer(batch, id, data));
    await batch.commit();
  }
};

export const flushPendingReactions = async ({
  userId,
  force = false,
  likesOnly = false,
  dislikesOnly = false,
} = {}) => {
  if (flushing) {
    return {flushedLikes: 0, flushedDislikes: 0, skipped: true};
  }
  const uid = resolveReactionUserId(userId) || auth().currentUser?.uid;
  if (!uid) {
    return {flushedLikes: 0, flushedDislikes: 0, offline: true};
  }

  const likes = await readQueue(PENDING_LIKES_KEY);
  const dislikes = await readQueue(PENDING_DISLIKES_KEY);
  const likeEntries = Object.entries(likes);
  const dislikeEntries = Object.entries(dislikes);

  const shouldFlushLikes =
    !dislikesOnly && (force || likeEntries.length >= SYNC_BATCH_SIZE);
  const shouldFlushDislikes =
    !likesOnly && (force || dislikeEntries.length >= SYNC_BATCH_SIZE);

  if (!shouldFlushLikes && !shouldFlushDislikes) {
    return {
      flushedLikes: 0,
      flushedDislikes: 0,
      pendingLikes: likeEntries.length,
      pendingDislikes: dislikeEntries.length,
    };
  }

  flushing = true;
  let flushedLikes = 0;
  let flushedDislikes = 0;

  try {
    if (shouldFlushLikes && likeEntries.length) {
      await flushMapInChunks(uid, likeEntries, (batch, id, data) => {
        batch.set(likedNameDocument(uid, id), reactionPayload(id, data), {
          merge: true,
        });
        batch.delete(dislikedNameDocument(uid, id));
        batch.set(userFavoriteDoc(uid, id), favPayload(id), {merge: true});
      });
      for (const [id] of likeEntries) {
        await markPartnerFavorite(id, true).catch(() => {});
      }
      await writeQueue(PENDING_LIKES_KEY, {});
      flushedLikes = likeEntries.length;
    }

    if (shouldFlushDislikes && dislikeEntries.length) {
      await flushMapInChunks(uid, dislikeEntries, (batch, id, data) => {
        batch.set(dislikedNameDocument(uid, id), reactionPayload(id, data), {
          merge: true,
        });
        batch.delete(likedNameDocument(uid, id));
        batch.delete(userFavoriteDoc(uid, id));
      });
      for (const [id] of dislikeEntries) {
        await markPartnerFavorite(id, false).catch(() => {});
      }
      await writeQueue(PENDING_DISLIKES_KEY, {});
      flushedDislikes = dislikeEntries.length;
    }
  } catch (e) {
    console.warn('flushPendingReactions failed:', e?.message || e);
  } finally {
    flushing = false;
  }

  return {flushedLikes, flushedDislikes};
};

/** After local like/dislike — flush that side if queue hit batch size. */
export const maybeFlushAfterEnqueue = async ({userId, side}) => {
  if (side === 'like') {
    return flushPendingReactions({userId, likesOnly: true});
  }
  if (side === 'dislike') {
    return flushPendingReactions({userId, dislikesOnly: true});
  }
  return flushPendingReactions({userId});
};

export const clearPendingQueues = async () => {
  await writeQueue(PENDING_LIKES_KEY, {});
  await writeQueue(PENDING_DISLIKES_KEY, {});
};
