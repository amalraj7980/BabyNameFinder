import {
  userDocument,
  usernameDocument,
  serverTimestamp,
} from '../firebase/firestore';
import {stripUndefined} from '../utils/firestoreHelpers';

/** Matches published rules: ^[a-zA-Z0-9_.]+$ length 3–30 */
export const sanitizeUsername = (raw, uid = '') => {
  let base = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '');

  if (!base || base.length < 3) {
    const suffix = String(uid || 'user')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 12);
    base = `user_${suffix || 'guest'}`;
  }
  if (base.length > 30) {
    base = base.slice(0, 30);
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(base) || base.length < 3) {
    base = `user_${Date.now().toString(36)}`;
  }
  return base;
};

export const createUserProfileOnce = async ({
  uid,
  email = '',
  username = '',
  fullName = '',
  isAnonymous = false,
  emailVerified = false,
}) => {
  if (!uid) {
    return;
  }
  const ref = userDocument(uid);
  const snap = await ref.get();

  const safeUsername = sanitizeUsername(
    username || fullName || (email || '').split('@')[0] || (isAnonymous ? 'guest' : 'user'),
    uid,
  );

  if (!snap.exists) {
    // Rules require keys: email, username, createdAt on create
    const createPayload = {
      email: typeof email === 'string' ? email : '',
      username: safeUsername,
      createdAt: serverTimestamp(),
      fullName: (fullName || safeUsername).trim(),
      isAnonymous: !!isAnonymous,
      emailVerified: !!emailVerified,
      updatedAt: serverTimestamp(),
    };
    await ref.set(createPayload);

    try {
      await usernameDocument(safeUsername.toLowerCase()).set({
        uid,
        username: safeUsername,
      });
    } catch (e) {
      // uniqueness map may already exist — non-fatal for guests
      console.warn('usernames map skipped:', e?.message || e);
    }
    return;
  }

  const existing = snap.data() || {};
  const nextEmail =
    existing.email && String(existing.email).trim()
      ? existing.email
      : typeof email === 'string'
        ? email
        : '';
  const updatePayload = stripUndefined({
    // Allow filling empty guest email when upgrading to a real account
    email: nextEmail,
    username: existing.username || safeUsername,
    fullName: fullName || existing.fullName || existing.username,
    isAnonymous: !!isAnonymous,
    emailVerified: !!emailVerified,
    updatedAt: serverTimestamp(),
  });
  await ref.set(updatePayload, {merge: true});
};

export const syncEmailVerifiedStatus = async (uid, emailVerified) => {
  if (!uid) {
    return;
  }
  try {
    const snap = await userDocument(uid).get();
    if (!snap.exists) {
      return;
    }
    const existing = snap.data() || {};
    await userDocument(uid).set(
      {
        email: existing.email || '',
        username: existing.username || sanitizeUsername('user', uid),
        emailVerified: !!emailVerified,
        updatedAt: serverTimestamp(),
      },
      {merge: true},
    );
  } catch (e) {
    console.warn('syncEmailVerifiedStatus skipped:', e?.message || e);
  }
};

export const getUserProfile = async uid => {
  if (!uid) {
    return null;
  }
  const snap = await userDocument(uid).get();
  return snap.exists ? {uid, ...snap.data()} : null;
};

export const ensureUserProfileFromAuth = async (user, extra = {}) => {
  if (!user?.uid) {
    return;
  }
  const usernameFromEmail = (user.email || '').split('@')[0] || 'guest';
  await createUserProfileOnce({
    uid: user.uid,
    email: user.email || '',
    fullName: extra.fullName || user.displayName || '',
    username:
      (extra.username && String(extra.username).trim()) ||
      (user.isAnonymous ? `guest_${user.uid.slice(0, 8)}` : usernameFromEmail),
    isAnonymous: !!user.isAnonymous,
    emailVerified: !!user.emailVerified,
  });
};
