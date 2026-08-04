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
  const id = String(data.id ?? docSnap.id);
  return {
    ...data,
    id,
    key: id,
    name: data.name ?? '',
    gender: data.gender ?? 'Unisex',
    origin: data.origin ?? '',
    meaning: data.meaning ?? '',
    syllables: data.syllables ?? data.name ?? '',
    syllableCount: data.syllableCount ?? 1,
  };
};
