/**
 * API facade — preserves legacy method names for screens.
 * Implementation: CareerMate-style services → firebase wrappers.
 */
import {
  loginWithEmailPassword,
  signupWithEmailPassword,
  resetPasswordWithEmail,
} from '../services/auth.service';
import {
  getBabyNames,
  getBabyNamesExcludingReactions,
  getNamesCount,
  seedBabyNamesIfNeeded,
  forceSeedBabyNames,
  startBabyNamesLiveSync,
  subscribeBabyNames,
  clearNamesCache,
} from '../services/babyNames.service';
import {
  likeName,
  dislikeName,
  getUserReactions,
  getReactionCounts,
  getReactedNameIds,
  ensureUserReactionBuckets,
} from '../services/reactions.service';

export const login = async PAYLOAD => loginWithEmailPassword(PAYLOAD);

export const signup = async PAYLOAD => signupWithEmailPassword(PAYLOAD);

export const forgot = async PAYLOAD => resetPasswordWithEmail(PAYLOAD);

export const likeUser = async PAYLOAD => likeName(PAYLOAD);

export const disLikeUser = async PAYLOAD => dislikeName(PAYLOAD);

export const babynames = async (filters = {}) => getBabyNames(filters);

/** Shared baby_names catalog for all users; exclude personal likes only when uid exists. */
export const getExcludeReactions = async (filters = {}) => {
  const userId = filters.u;
  const hasUser =
    userId !== null &&
    userId !== undefined &&
    userId !== 0 &&
    userId !== '0' &&
    userId !== '';
  const {allIds} = hasUser
    ? await getReactedNameIds(userId)
    : {allIds: []};
  return getBabyNamesExcludingReactions(filters, allIds);
};

export const getAllBabyNames = async (filters = {}) => getBabyNames(filters);

export const getReactions = async (userId, filters = {}) =>
  getUserReactions(userId, filters);

export const getLikeDislikeCount = async userId => getReactionCounts(userId);

export const getTotalNamesCount = async () => getNamesCount();

export const ensureSeedData = async () => {
  startBabyNamesLiveSync();
  try {
    return await forceSeedBabyNames();
  } catch (e) {
    return seedBabyNamesIfNeeded();
  }
};

export {
  subscribeBabyNames,
  clearNamesCache,
  startBabyNamesLiveSync,
  ensureUserReactionBuckets,
};
