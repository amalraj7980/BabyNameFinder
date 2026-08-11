/**
 * Thin Firestore path helpers — paths match published Console rules.
 */
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  FIRESTORE_COLLECTIONS,
  REACTION_SUBCOLLECTIONS,
} from './config';

export const getFirestore = () => firestore();

export const serverTimestamp = () => firestore.FieldValue.serverTimestamp();

export const userDocument = uid =>
  firestore().collection(FIRESTORE_COLLECTIONS.users).doc(uid);

export const usernameDocument = usernameLower =>
  firestore()
    .collection(FIRESTORE_COLLECTIONS.usernames)
    .doc(String(usernameLower).toLowerCase());

export const babyNamesCollection = () =>
  firestore().collection(FIRESTORE_COLLECTIONS.babyNames);

export const babyNameDocument = nameId =>
  babyNamesCollection().doc(String(nameId));

export const metaDocument = (docId = 'global') =>
  firestore().collection(FIRESTORE_COLLECTIONS.meta).doc(docId);

/** Remote version gate: collection `app_config`, document `version`. */
export const appVersionConfigDocument = () =>
  firestore().collection(FIRESTORE_COLLECTIONS.appConfig).doc('version');

/** @deprecated use metaDocument — kept for call-site compatibility */
export const statisticsDocument = (docId = 'global') => metaDocument(docId);

export const reactionsUserDocument = uid =>
  firestore().collection(FIRESTORE_COLLECTIONS.reactions).doc(uid);

export const likedNamesCollection = uid =>
  reactionsUserDocument(uid).collection(REACTION_SUBCOLLECTIONS.likes);

export const dislikedNamesCollection = uid =>
  reactionsUserDocument(uid).collection(REACTION_SUBCOLLECTIONS.dislikes);

export const likedNameDocument = (uid, nameId) =>
  likedNamesCollection(uid).doc(String(nameId));

export const dislikedNameDocument = (uid, nameId) =>
  dislikedNamesCollection(uid).doc(String(nameId));

/** Prefer live Auth uid so reactions always persist dynamically */
export const resolveReactionUserId = userId => {
  const liveUid = auth().currentUser?.uid;
  if (liveUid) {
    return String(liveUid);
  }
  if (
    userId === null ||
    userId === undefined ||
    userId === 0 ||
    userId === '0'
  ) {
    return null;
  }
  return String(userId);
};

export const mapNameDoc = docSnap => {
  const data = docSnap.data() || {};
  // Prefer non-empty business id; empty string in Firestore must not win over doc id
  const id = String(
    data.id || data.slug || docSnap.id || data.name || '',
  ).trim();
  const syllableCountRaw = data.syllableCount;
  const syllableCount =
    typeof syllableCountRaw === 'number' && syllableCountRaw > 0
      ? syllableCountRaw
      : Number(syllableCountRaw) > 0
        ? Number(syllableCountRaw)
        : 1;

  let gender = data.gender ?? 'Unisex';
  const g = String(gender).toLowerCase();
  if (g === 'male' || g === 'boy' || g === 'm') {
    gender = 'Male';
  } else if (g === 'female' || g === 'girl' || g === 'f') {
    gender = 'Female';
  } else if (g === 'unisex' || g === 'neutral') {
    gender = 'Unisex';
  }

  const origin =
    typeof data.origin === 'string'
      ? data.origin
      : data.origin?.name || '';
  const meaning =
    data.meaning ||
    (typeof data.origin === 'object' ? data.origin?.description : '') ||
    '';
  const syllables =
    (typeof data.syllables === 'string' && data.syllables) ||
    (typeof data.pronunciation === 'string' && data.pronunciation) ||
    data.pronunciation?.text ||
    data.name ||
    '';

  return {
    ...data,
    id,
    key: id,
    name: data.name ?? '',
    gender,
    origin,
    meaning,
    syllables,
    syllableCount,
    pronunciation:
      typeof data.pronunciation === 'string'
        ? data.pronunciation
        : data.pronunciation?.text || syllables,
    funFacts: Array.isArray(data.funFacts) ? data.funFacts : [],
    famousPeople: Array.isArray(data.famousPeople) ? data.famousPeople : [],
    variations: Array.isArray(data.variations) ? data.variations : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    popularity:
      data.popularity && typeof data.popularity === 'object'
        ? data.popularity
        : {},
    status: data.status || 'published',
  };
};
