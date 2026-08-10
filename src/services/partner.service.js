/**
 * Partner sessions — create/join by code, shared favorites, both-like.
 * Works for logged-in users AND anonymous guests (same Firebase UID).
 * Collection: partnerSessions/{sessionId}
 * Subcollection: partnerSessions/{sessionId}/favorites/{nameId}
 */
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {serverTimestamp} from '../firebase/firestore';
import {FIRESTORE_COLLECTIONS} from '../firebase/config';
import {
  setInviteSent,
  setPartnerLinked,
  setPartnerCode,
} from './onboardingStorage';

const SESSION_KEY = '@babynames/partner_session_id';
const COLLECTION = FIRESTORE_COLLECTIONS.partnerSessions || 'partnerSessions';

const sessions = () => firestore().collection(COLLECTION);
const sessionDoc = id => sessions().doc(String(id));
const sessionFavorites = id => sessionDoc(id).collection('favorites');

/** Guests use anonymous Firebase Auth — ensure a UID before any partner call. */
const ensureAuthUid = async () => {
  const {ensureFirebaseSession} = require('./auth.service');
  await ensureFirebaseSession();
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new Error('Please wait — connecting…');
  }
  return uid;
};

const generateJoinCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

const normalizeJoinCode = raw =>
  String(raw || '')
    .replace(/\s/g, '')
    .trim();

/** Mirror Firestore session into local flags used by Discover / Preferences UI. */
export const syncPartnerLocalState = async session => {
  if (!session?.id) {
    await setPartnerLinked(false);
    return {linked: false, joinCode: '', waiting: false, session: null};
  }
  const joinCode = session.joinCode ? String(session.joinCode) : '';
  if (joinCode) {
    await setPartnerCode(joinCode);
  }
  const linked = !!session.partnerUid;
  const waiting = !linked && !!joinCode;
  await setPartnerLinked(linked);
  if (linked || waiting) {
    await setInviteSent(true);
  }
  return {linked, joinCode, waiting, session};
};

export const refreshPartnerConnection = async () => {
  try {
    await ensureAuthUid();
  } catch (e) {
    return {linked: false, joinCode: '', waiting: false, session: null};
  }
  const session = await getActivePartnerSession();
  return syncPartnerLocalState(session);
};

export const getCachedPartnerSessionId = async () => {
  try {
    return (await AsyncStorage.getItem(SESSION_KEY)) || null;
  } catch (e) {
    return null;
  }
};

const cacheSessionId = async id => {
  if (id) {
    await AsyncStorage.setItem(SESSION_KEY, String(id));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
};

export const getActivePartnerSession = async () => {
  let uid = auth().currentUser?.uid;
  if (!uid) {
    try {
      uid = await ensureAuthUid();
    } catch (e) {
      return null;
    }
  }
  const cached = await getCachedPartnerSessionId();
  if (cached) {
    const snap = await sessionDoc(cached).get();
    if (snap.exists) {
      const data = snap.data() || {};
      if (
        data.status === 'active' &&
        (data.ownerUid === uid || data.partnerUid === uid)
      ) {
        return {id: snap.id, ...data};
      }
    }
    await cacheSessionId(null);
  }
  const [asOwner, asPartner] = await Promise.all([
    sessions()
      .where('ownerUid', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get(),
    sessions()
      .where('partnerUid', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get(),
  ]);
  const docSnap = asOwner.docs[0] || asPartner.docs[0];
  if (!docSnap) {
    return null;
  }
  await cacheSessionId(docSnap.id);
  return {id: docSnap.id, ...docSnap.data()};
};

export const createPartnerSession = async () => {
  const uid = await ensureAuthUid();
  const existing = await getActivePartnerSession();
  if (existing) {
    await syncPartnerLocalState(existing);
    return existing;
  }
  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const clash = await sessions()
      .where('joinCode', '==', joinCode)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (clash.empty) {
      break;
    }
    joinCode = generateJoinCode();
  }
  const ref = sessions().doc();
  const payload = {
    ownerUid: uid,
    partnerUid: null,
    joinCode,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await ref.set(payload);
  await cacheSessionId(ref.id);
  const session = {id: ref.id, ...payload};
  await syncPartnerLocalState(session);
  return session;
};

export const joinPartnerSession = async rawCode => {
  const uid = await ensureAuthUid();
  const joinCode = normalizeJoinCode(rawCode);
  if (!/^\d{6}$/.test(joinCode)) {
    throw new Error('Enter a valid 6-digit partner code.');
  }

  const existing = await getActivePartnerSession();
  if (existing?.partnerUid) {
    throw new Error('You are already connected to a partner session.');
  }
  // Owner waiting with unused invite can leave and join another code
  if (existing && existing.ownerUid === uid && !existing.partnerUid) {
    await leavePartnerSession();
  } else if (existing) {
    throw new Error('You are already connected to a partner session.');
  }

  const snap = await sessions()
    .where('joinCode', '==', joinCode)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error('Invalid code. Check the code and try again.');
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data() || {};
  if (data.ownerUid === uid) {
    throw new Error('You cannot join your own partner code.');
  }
  if (data.partnerUid && data.partnerUid !== uid) {
    throw new Error('This session already has two users.');
  }

  await docSnap.ref.update({
    partnerUid: uid,
    updatedAt: serverTimestamp(),
  });
  await cacheSessionId(docSnap.id);
  const session = {id: docSnap.id, ...data, partnerUid: uid};
  await syncPartnerLocalState(session);
  return session;
};

export const leavePartnerSession = async () => {
  const uid = await ensureAuthUid();
  const session = await getActivePartnerSession();
  if (!session) {
    await cacheSessionId(null);
    await setPartnerLinked(false);
    return;
  }
  const ref = sessionDoc(session.id);
  if (session.ownerUid === uid) {
    await ref.update({
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  } else if (session.partnerUid === uid) {
    await ref.update({
      partnerUid: null,
      updatedAt: serverTimestamp(),
    });
  }
  await cacheSessionId(null);
  await setPartnerLinked(false);
};

export const markPartnerFavorite = async (nameId, liked = true) => {
  let uid;
  try {
    uid = await ensureAuthUid();
  } catch (e) {
    return null;
  }
  const session = await getActivePartnerSession();
  if (!session?.id) {
    return null;
  }
  const id = String(nameId);
  const favRef = sessionFavorites(session.id).doc(id);
  const snap = await favRef.get();
  const users = {...((snap.exists && snap.data()?.users) || {})};
  if (liked) {
    users[uid] = true;
  } else {
    delete users[uid];
  }
  if (!Object.keys(users).length) {
    if (snap.exists) {
      await favRef.delete();
    }
    return {nameId: id, users: {}};
  }
  await favRef.set(
    {
      nameId: id,
      users,
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
  return {nameId: id, users};
};

export const subscribePartnerFavorites = (sessionId, onData, onError) => {
  if (!sessionId) {
    return () => {};
  }
  return sessionFavorites(sessionId).onSnapshot(
    snap => {
      const items = snap.docs.map(d => ({id: d.id, ...(d.data() || {})}));
      onData(items);
    },
    err => {
      if (onError) {
        onError(err);
      }
    },
  );
};

export const categorizePartnerFavorites = (favDocs, myUid, partnerUid) => {
  const both = [];
  const mine = [];
  const theirs = [];
  (favDocs || []).forEach(doc => {
    const users = doc.users || {};
    const me = !!users[myUid];
    const them = partnerUid ? !!users[partnerUid] : false;
    if (me && them) {
      both.push(doc);
    } else if (me) {
      mine.push(doc);
    } else if (them) {
      theirs.push(doc);
    }
  });
  return {both, mine, theirs};
};
