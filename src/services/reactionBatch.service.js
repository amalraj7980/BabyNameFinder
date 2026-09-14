/**
 * Debounced, batched cloud sync for signed-in users.
 * Guest reactions stay local-only. Failed flushes retry with backoff
 * and never block the UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import {
  likedNameDocument,
  dislikedNameDocument,
  serverTimestamp,
  resolveReactionUserId,
} from '../firebase/firestore';
import {markPartnerFavorite} from './partner.service';
import {
  applyLike,
  applyUnlike,
  applyDislike,
  applyUndislike,
  getLikeRecords,
  getDislikeRecords,
} from '../store/reactionsStore';

export const SYNC_BATCH_SIZE = 10;
export const SYNC_DEBOUNCE_MS = 700;
const MAX_BACKOFF_MS = 32000;
const MIN_BACKOFF_MS = 1000;

const PENDING_LIKES_KEY = '@babynames/pending_likes_v1';
const PENDING_DISLIKES_KEY = '@babynames/pending_dislikes_v1';
const PENDING_UNLIKES_KEY = '@babynames/pending_unlikes_v1';
const PENDING_UNDISLIKES_KEY = '@babynames/pending_undislikes_v1';

const userFavoriteDoc = (uid, nameId) =>
  firestore()
    .collection('users')
    .doc(String(uid))
    .collection('favorites')
    .doc(String(nameId));

let likesQueue = {};
let dislikesQueue = {};
let unlikesQueue = {};
let undislikesQueue = {};
let queuesHydrated = false;
let queuesHydratePromise = null;
let flushing = false;
let debounceTimer = null;
let retryTimer = null;
let backoffMs = MIN_BACKOFF_MS;
let syncPausedForAuth = false;
let netInfoBound = false;

const isPermanentAuthError = error => {
  const code = String(error?.code || error?.message || '').toLowerCase();
  return (
    code.includes('permission-denied') ||
    code.includes('unauthenticated') ||
    code.includes('auth/user-disabled') ||
    code.includes('auth/invalid-user-token')
  );
};

export const canSyncReactionsToCloud = () => {
  const user = auth().currentUser;
  return Boolean(user && !user.isAnonymous);
};

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

const persistQueues = async () => {
  try {
    await AsyncStorage.multiSet([
      [PENDING_LIKES_KEY, JSON.stringify(likesQueue)],
      [PENDING_DISLIKES_KEY, JSON.stringify(dislikesQueue)],
      [PENDING_UNLIKES_KEY, JSON.stringify(unlikesQueue)],
      [PENDING_UNDISLIKES_KEY, JSON.stringify(undislikesQueue)],
    ]);
  } catch (e) {
    // keep memory queues
  }
};

const hydrateQueues = () => {
  if (queuesHydrated) {
    return Promise.resolve();
  }
  if (!queuesHydratePromise) {
    queuesHydratePromise = Promise.all([
      readQueue(PENDING_LIKES_KEY),
      readQueue(PENDING_DISLIKES_KEY),
      readQueue(PENDING_UNLIKES_KEY),
      readQueue(PENDING_UNDISLIKES_KEY),
    ]).then(([likes, dislikes, unlikes, undislikes]) => {
      likesQueue = {...likes, ...likesQueue};
      dislikesQueue = {...dislikes, ...dislikesQueue};
      unlikesQueue = {...unlikes, ...unlikesQueue};
      undislikesQueue = {...undislikes, ...undislikesQueue};
      queuesHydrated = true;
    });
  }
  return queuesHydratePromise;
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

const queueRecord = (id, nameData = {}) => ({
  nameId: String(id),
  name: nameData.name || '',
  gender: nameData.gender || '',
  origin: nameData.origin || '',
  meaning: nameData.meaning || '',
  syllables: nameData.syllables || '',
  syllableCount: nameData.syllableCount || 1,
});

const pendingCount = () =>
  Object.keys(likesQueue).length +
  Object.keys(dislikesQueue).length +
  Object.keys(unlikesQueue).length +
  Object.keys(undislikesQueue).length;

const persistQueuesSoon = () => {
  void hydrateQueues().then(persistQueues);
};

export const getPendingLikeIds = async () => {
  await hydrateQueues();
  return Object.keys(likesQueue);
};

export const getPendingDislikeIds = async () => {
  await hydrateQueues();
  return Object.keys(dislikesQueue);
};

export const enqueuePendingLike = (nameId, nameData = {}) => {
  const id = String(nameId);
  delete dislikesQueue[id];
  delete unlikesQueue[id];
  likesQueue[id] = queueRecord(id, nameData);
  persistQueuesSoon();
  return Object.keys(likesQueue).length;
};

export const enqueuePendingDislike = (nameId, nameData = {}) => {
  const id = String(nameId);
  delete likesQueue[id];
  delete undislikesQueue[id];
  dislikesQueue[id] = queueRecord(id, nameData);
  persistQueuesSoon();
  return Object.keys(dislikesQueue).length;
};

export const dequeuePendingLike = nameId => {
  const id = String(nameId);
  if (likesQueue[id]) {
    delete likesQueue[id];
    persistQueuesSoon();
  }
};

export const dequeuePendingDislike = nameId => {
  const id = String(nameId);
  if (dislikesQueue[id]) {
    delete dislikesQueue[id];
    persistQueuesSoon();
  }
};

export const enqueuePendingUnlike = nameId => {
  const id = String(nameId);
  delete likesQueue[id];
  unlikesQueue[id] = true;
  persistQueuesSoon();
};

export const enqueuePendingUndislike = nameId => {
  const id = String(nameId);
  delete dislikesQueue[id];
  undislikesQueue[id] = true;
  persistQueuesSoon();
};

const flushMapInChunks = async (entries, writer) => {
  for (let i = 0; i < entries.length; i += 400) {
    const slice = entries.slice(i, i + 400);
    const batch = firestore().batch();
    slice.forEach(([id, data]) => writer(batch, id, data));
    await batch.commit();
  }
};

const rollbackPermanentFailures = ({
  likeEntries,
  dislikeEntries,
  unlikeIds,
  undislikeIds,
}) => {
  likeEntries.forEach(([id]) => applyUnlike(id));
  dislikeEntries.forEach(([id]) => applyUndislike(id));
  unlikeIds.forEach(id => applyLike({id}));
  undislikeIds.forEach(id => applyDislike({id}));
};

export const flushPendingReactions = async ({
  userId,
  force = false,
  likesOnly = false,
  dislikesOnly = false,
} = {}) => {
  await hydrateQueues();
  if (flushing) {
    return {flushedLikes: 0, flushedDislikes: 0, skipped: true};
  }
  if (!canSyncReactionsToCloud()) {
    return {flushedLikes: 0, flushedDislikes: 0, guest: true};
  }
  if (syncPausedForAuth) {
    return {flushedLikes: 0, flushedDislikes: 0, paused: true};
  }

  const net = await NetInfo.fetch().catch(() => null);
  if (net && net.isConnected === false) {
    scheduleRetry(userId);
    return {flushedLikes: 0, flushedDislikes: 0, offline: true};
  }

  const uid = resolveReactionUserId(userId) || auth().currentUser?.uid;
  if (!uid) {
    return {flushedLikes: 0, flushedDislikes: 0, offline: true};
  }

  const likeEntries = dislikesOnly ? [] : Object.entries(likesQueue);
  const dislikeEntries = likesOnly ? [] : Object.entries(dislikesQueue);
  const unlikeIds = dislikesOnly ? [] : Object.keys(unlikesQueue);
  const undislikeIds = likesOnly ? [] : Object.keys(undislikesQueue);
  const readyCount =
    likeEntries.length +
    dislikeEntries.length +
    unlikeIds.length +
    undislikeIds.length;

  if (!readyCount) {
    return {flushedLikes: 0, flushedDislikes: 0};
  }
  if (!force && readyCount < SYNC_BATCH_SIZE) {
    return {
      flushedLikes: 0,
      flushedDislikes: 0,
      pending: readyCount,
    };
  }

  flushing = true;
  let flushedLikes = 0;
  let flushedDislikes = 0;

  try {
    if (likeEntries.length) {
      await flushMapInChunks(likeEntries, (batch, id, data) => {
        batch.set(likedNameDocument(uid, id), reactionPayload(id, data), {
          merge: true,
        });
        batch.delete(dislikedNameDocument(uid, id));
        batch.set(userFavoriteDoc(uid, id), favPayload(id), {merge: true});
      });
      for (const [id] of likeEntries) {
        await markPartnerFavorite(id, true).catch(() => {});
        delete likesQueue[id];
      }
      flushedLikes = likeEntries.length;
    }

    if (dislikeEntries.length) {
      await flushMapInChunks(dislikeEntries, (batch, id, data) => {
        batch.set(dislikedNameDocument(uid, id), reactionPayload(id, data), {
          merge: true,
        });
        batch.delete(likedNameDocument(uid, id));
        batch.delete(userFavoriteDoc(uid, id));
      });
      for (const [id] of dislikeEntries) {
        await markPartnerFavorite(id, false).catch(() => {});
        delete dislikesQueue[id];
      }
      flushedDislikes = dislikeEntries.length;
    }

    if (unlikeIds.length) {
      await flushMapInChunks(
        unlikeIds.map(id => [id, true]),
        (batch, id) => {
          batch.delete(likedNameDocument(uid, id));
          batch.delete(userFavoriteDoc(uid, id));
        },
      );
      for (const id of unlikeIds) {
        await markPartnerFavorite(id, false).catch(() => {});
        delete unlikesQueue[id];
      }
    }

    if (undislikeIds.length) {
      await flushMapInChunks(
        undislikeIds.map(id => [id, true]),
        (batch, id) => {
          batch.delete(dislikedNameDocument(uid, id));
        },
      );
      undislikeIds.forEach(id => {
        delete undislikesQueue[id];
      });
    }

    await persistQueues();
    backoffMs = MIN_BACKOFF_MS;
    syncPausedForAuth = false;
  } catch (e) {
    console.warn('flushPendingReactions failed:', e?.message || e);
    if (isPermanentAuthError(e)) {
      syncPausedForAuth = true;
      rollbackPermanentFailures({
        likeEntries,
        dislikeEntries,
        unlikeIds,
        undislikeIds,
      });
    } else {
      scheduleRetry(userId);
    }
  } finally {
    flushing = false;
  }

  return {flushedLikes, flushedDislikes};
};

const scheduleRetry = userId => {
  if (retryTimer || syncPausedForAuth || !canSyncReactionsToCloud()) {
    return;
  }
  const wait = backoffMs;
  backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flushPendingReactions({userId, force: true});
  }, wait);
};

const bindNetInfo = () => {
  if (netInfoBound) {
    return;
  }
  netInfoBound = true;
  NetInfo.addEventListener(state => {
    if (state?.isConnected && canSyncReactionsToCloud() && pendingCount()) {
      backoffMs = MIN_BACKOFF_MS;
      void flushPendingReactions({force: true});
    }
  });
};

export const scheduleReactionSync = ({userId, force = false} = {}) => {
  if (!canSyncReactionsToCloud()) {
    return;
  }
  bindNetInfo();
  if (syncPausedForAuth) {
    return;
  }
  const count = pendingCount();
  if (!count) {
    return;
  }
  if (force || count >= SYNC_BATCH_SIZE) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    void flushPendingReactions({userId, force: true});
    return;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flushPendingReactions({userId, force: true});
  }, SYNC_DEBOUNCE_MS);
};

export const maybeFlushAfterEnqueue = async ({userId} = {}) => {
  scheduleReactionSync({userId, force: false});
  return {scheduled: true};
};

export const resumeReactionSync = () => {
  syncPausedForAuth = false;
  backoffMs = MIN_BACKOFF_MS;
  scheduleReactionSync({force: pendingCount() > 0});
};

export const enqueueLocalStoreForAccountMerge = async () => {
  await hydrateQueues();
  getLikeRecords().forEach(record => {
    likesQueue[record.id] = queueRecord(record.id, record);
    delete dislikesQueue[record.id];
    delete unlikesQueue[record.id];
  });
  getDislikeRecords().forEach(record => {
    dislikesQueue[record.id] = queueRecord(record.id, record);
    delete likesQueue[record.id];
    delete undislikesQueue[record.id];
  });
  await persistQueues();
  return pendingCount();
};

export const clearPendingQueues = async () => {
  likesQueue = {};
  dislikesQueue = {};
  unlikesQueue = {};
  undislikesQueue = {};
  await persistQueues();
};

void hydrateQueues();
