/**
 * Local dislike IDs — backed by the in-memory reactions store.
 */
import {
  applyDislike,
  applyUndislike,
  getDislikeIds,
  hydrateReactionsStore,
  subscribeReactions,
} from '../store/reactionsStore';

export const getLocalDislikeIds = async () => {
  await hydrateReactionsStore();
  return getDislikeIds();
};

export const addLocalDislike = async nameId => {
  applyDislike({id: nameId});
  return getDislikeIds();
};

export const removeLocalDislike = async nameId => {
  applyUndislike(nameId);
  return getDislikeIds();
};

export const clearLocalDislikes = async () => {
  getDislikeIds().forEach(id => applyUndislike(id));
};

export const subscribeLocalDislikes = listener =>
  subscribeReactions(snapshot => {
    listener(snapshot.dislikeIds);
  });
