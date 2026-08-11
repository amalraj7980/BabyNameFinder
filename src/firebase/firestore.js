/**
 * Thin Firestore path helpers — paths match published Console rules.
 * Uses RN Firebase modular API (v22+) to avoid namespaced deprecation noise.
 */
import {getApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore as getFirestoreModular,
  collection,
  doc,
  serverTimestamp as firestoreServerTimestamp,
} from '@react-native-firebase/firestore';
import {
  FIRESTORE_COLLECTIONS,
  REACTION_SUBCOLLECTIONS,
} from './config';

export const getFirestore = () => getFirestoreModular(getApp());

export const serverTimestamp = () => firestoreServerTimestamp();

export const userDocument = uid =>
  doc(collection(getFirestore(), FIRESTORE_COLLECTIONS.users), uid);

export const usernameDocument = usernameLower =>
  doc(
    collection(getFirestore(), FIRESTORE_COLLECTIONS.usernames),
    String(usernameLower).toLowerCase(),
  );

export const babyNamesCollection = () =>
  collection(getFirestore(), FIRESTORE_COLLECTIONS.babyNames);

export const babyNameDocument = nameId =>
  doc(babyNamesCollection(), String(nameId));

export const metaDocument = (docId = 'global') =>
  doc(collection(getFirestore(), FIRESTORE_COLLECTIONS.meta), docId);

/** Remote version gate: collection `app_config`, document `version`. */
export const appVersionConfigDocument = () =>
  doc(collection(getFirestore(), FIRESTORE_COLLECTIONS.appConfig), 'version');

/** @deprecated use metaDocument — kept for call-site compatibility */
export const statisticsDocument = (docId = 'global') => metaDocument(docId);

export const reactionsUserDocument = uid =>
  doc(collection(getFirestore(), FIRESTORE_COLLECTIONS.reactions), uid);

export const likedNamesCollection = uid =>
  collection(reactionsUserDocument(uid), REACTION_SUBCOLLECTIONS.likes);

export const dislikedNamesCollection = uid =>
  collection(reactionsUserDocument(uid), REACTION_SUBCOLLECTIONS.dislikes);

export const likedNameDocument = (uid, nameId) =>
  doc(likedNamesCollection(uid), String(nameId));

export const dislikedNameDocument = (uid, nameId) =>
  doc(dislikedNamesCollection(uid), String(nameId));

/** Prefer live Auth uid so reactions always persist dynamically */
export const resolveReactionUserId = userId => {
  const liveUid = getAuth(getApp()).currentUser?.uid;
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
