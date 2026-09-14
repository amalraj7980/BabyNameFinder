/**
 * Guest / device favorite IDs — backed by the in-memory reactions store.
 * Writes are synchronous in memory; disk persist is scheduled by the store.
 */
import {
  applyLike,
  applyUnlike,
  getLikeIds,
  hasLike,
  hydrateReactionsStore,
  subscribeReactions,
} from '../store/reactionsStore';

export const getLocalFavoriteIds = async () => {
  await hydrateReactionsStore();
  return getLikeIds();
};

export const isLocalFavorite = async nameId => {
  await hydrateReactionsStore();
  return hasLike(nameId);
};

export const addLocalFavorite = async nameId => {
  applyLike({id: nameId});
  return getLikeIds();
};

export const removeLocalFavorite = async nameId => {
  applyUnlike(nameId);
  return getLikeIds();
};

export const toggleLocalFavorite = async nameId => {
  const id = String(nameId || '').trim();
  if (hasLike(id)) {
    applyUnlike(id);
    return {favorited: false, ids: getLikeIds()};
  }
  applyLike({id});
  return {favorited: true, ids: getLikeIds()};
};

export const clearLocalFavorites = async () => {
  getLikeIds().forEach(id => applyUnlike(id));
};

export const subscribeLocalFavorites = listener =>
  subscribeReactions(snapshot => {
    listener(snapshot.likeIds);
  });
