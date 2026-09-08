/**
 * Auth business logic (CareerMate-style: email login/signup/verify/reset).
 * Guest browsing still uses anonymous Firebase sessions.
 */
import {
  getCurrentUser,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as sendPasswordResetEmailNative,
  confirmPasswordReset as confirmPasswordResetNative,
  sendEmailVerification,
  reloadUser,
  updateProfile,
  signOut,
  getEmailAuthCredential,
  linkWithCredential,
  signInWithCredential,
  getFirebaseAuth,
} from '../firebase/auth';
import {
  getEmailVerificationActionCodeSettings,
  getPasswordResetActionCodeSettings,
} from '../firebase/deepLink';
import {
  ensureUserProfileFromAuth,
  createUserProfileOnce,
  syncEmailVerifiedStatus,
} from './user.service';
import {
  getGoogleAuthCredential,
  credentialFromIdToken,
  signOutFromGoogle,
} from './googleSignIn.service';
import {mapAuthError} from '../utils/authErrors';
import {
  getDisplayName as getLocalDisplayName,
  setDisplayName as setLocalDisplayName,
  markAppEntered,
} from './onboardingStorage';

const toSessionPayload = async user => {
  if (!user) {
    return null;
  }
  const token = await user.getIdToken();
  return {
    token,
    userId: user.uid,
    email: user.email || '',
    emailVerified: !!user.emailVerified,
    displayName: user.displayName || '',
    isAnonymous: !!user.isAnonymous,
    isUserLoggedin: !user.isAnonymous,
  };
};

/** Keep Preferences / Discover name in sync with Firebase account. */
const syncLocalProfileFromUser = async user => {
  if (!user || user.isAnonymous) {
    return;
  }
  const authName = String(user.displayName || '').trim();
  if (authName) {
    await setLocalDisplayName(authName);
    return;
  }
  const local = String((await getLocalDisplayName()) || '').trim();
  if (!local && user.email) {
    await setLocalDisplayName(user.email.split('@')[0] || '');
  }
};

/** Call after successful login / signup / guest entry into MainTabs. */
export const completeAuthenticatedEntry = async user => {
  await markAppEntered();
  if (user) {
    await syncLocalProfileFromUser(user);
  }
  if (user && !user.isAnonymous) {
    try {
      const {ensureCloudFavoritesForUser} = require('./favorites.service');
      await ensureCloudFavoritesForUser(user.uid);
    } catch (e) {
      console.warn('Favorites ensure on login skipped:', e?.message || e);
    }
  }
};

export const updateUserDisplayName = async name => {
  const next = String(name || '').trim();
  await setLocalDisplayName(next);
  const user = getCurrentUser();
  if (user && !user.isAnonymous) {
    try {
      await updateProfile(user, {displayName: next});
      await reloadUser(user);
    } catch (e) {
      console.warn('updateUserDisplayName Firebase skipped:', e?.message || e);
    }
  }
  return toSessionPayload(getCurrentUser() || user);
};

export {toSessionPayload};

const softCatalog = async () => {
  // The Discover dashboard loads its own 20-item cursor page on demand.
  // Do not start a collection-wide listener during sign-in.
};

const softProfile = async (user, extra) => {
  try {
    await ensureUserProfileFromAuth(user, extra);
  } catch (e) {
    console.warn('User profile sync skipped:', e?.message || e);
  }
};

/**
 * Firebase may be configured to prevent client-side account creation. In that
 * case, public catalog browsing still works, but guest-only cloud features
 * (reactions and new-account sign-up) are unavailable.
 */
const isGuestAccountCreationRestricted = error =>
  ['auth/operation-not-allowed', 'auth/admin-restricted-operation'].includes(
    error?.code,
  );

/** Ensure a Firebase user when guest account creation is permitted. */
export const ensureFirebaseSession = async () => {
  let user = getCurrentUser();
  if (!user) {
    try {
      const cred = await signInAnonymously();
      user = cred.user;
    } catch (e) {
      if (isGuestAccountCreationRestricted(e)) {
        return null;
      } else {
        console.warn('Anonymous sign-in failed:', e?.message || e);
      }
      throw e;
    }
  }
  await softProfile(user);
  await softCatalog();
  return toSessionPayload(user);
};

export const loginWithEmailPassword = async ({email, password}) => {
  try {
    const previous = getCurrentUser();
    const previousUid = previous?.isAnonymous ? previous.uid : null;

    // Prefer linking anonymous → email to keep the same UID when possible
    if (previous?.isAnonymous) {
      try {
        const emailCred = getEmailAuthCredential(
          email.trim().toLowerCase(),
          password,
        );
        const linked = await linkWithCredential(previous, emailCred);
        let user = linked.user;
        await reloadUser(user);
        user = getCurrentUser() || user;
        await softProfile(user);
        await syncEmailVerifiedStatus(user.uid, user.emailVerified);
        await softCatalog();
        try {
          const {migrateLocalFavoritesToAccount} = require('./favorites.service');
          await migrateLocalFavoritesToAccount(user.uid);
        } catch (e) {
          console.warn('Local favorites migrate skipped:', e?.message || e);
        }
        await completeAuthenticatedEntry(user);
        return toSessionPayload(user);
      } catch (linkError) {
        // Fall through to normal sign-in (e.g. email already registered)
        console.log('Link on login skipped:', linkError?.code || linkError);
      }
    }

    const credential = await signInWithEmailAndPassword(
      email.trim().toLowerCase(),
      password,
    );
    let user = credential.user;
    await reloadUser(user);
    user = getCurrentUser() || user;

    await softProfile(user);
    await syncEmailVerifiedStatus(user.uid, user.emailVerified);
    await softCatalog();

    try {
      const {migrateGuestDataToAccount} = require('./favorites.service');
      await migrateGuestDataToAccount(previousUid, user.uid);
    } catch (e) {
      console.warn('Guest data migrate skipped:', e?.message || e);
    }

    await completeAuthenticatedEntry(user);
    return toSessionPayload(user);
  } catch (error) {
    throw mapAuthError(error);
  }
};

/**
 * Signup — CareerMate flow: create/link account, profile, send verification email.
 * Returns session payload; screens should route to EmailVerification.
 */
export const signupWithEmailPassword = async ({
  email,
  password,
  username,
  fullName,
}) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const displayName = (fullName || username || '').trim();
    const current = getCurrentUser();
    let user;

    if (current?.isAnonymous) {
      try {
        const emailCred = getEmailAuthCredential(normalizedEmail, password);
        const linked = await linkWithCredential(current, emailCred);
        user = linked.user;
      } catch (linkError) {
        if (
          linkError?.code === 'auth/email-already-in-use' ||
          linkError?.code === 'auth/credential-already-in-use'
        ) {
          throw linkError;
        }
        const created = await createUserWithEmailAndPassword(
          normalizedEmail,
          password,
        );
        user = created.user;
      }
    } else {
      const created = await createUserWithEmailAndPassword(
        normalizedEmail,
        password,
      );
      user = created.user;
    }

    if (displayName) {
      try {
        await updateProfile(user, {displayName});
        await reloadUser(user);
        user = getCurrentUser() || user;
      } catch (e) {
        console.warn('updateProfile skipped:', e?.message || e);
      }
    }

    await createUserProfileOnce({
      uid: user.uid,
      email: normalizedEmail,
      fullName: displayName,
      username: displayName || normalizedEmail.split('@')[0],
      isAnonymous: false,
      emailVerified: !!user.emailVerified,
    }).catch(e =>
      console.warn('profile create skipped:', e?.message || e),
    );

    try {
      await sendEmailVerification(
        user,
        getEmailVerificationActionCodeSettings(),
      );
    } catch (e) {
      console.warn('sendEmailVerification failed:', e?.message || e);
    }

    await softCatalog();

    try {
      const {migrateLocalFavoritesToAccount} = require('./favorites.service');
      await migrateLocalFavoritesToAccount(user.uid);
    } catch (e) {
      console.warn('Local favorites migrate skipped:', e?.message || e);
    }

    await completeAuthenticatedEntry(user);
    return {
      ...(await toSessionPayload(user)),
      userId: user.uid,
      status: 'success',
      message: '',
      needsEmailVerification: !user.emailVerified,
    };
  } catch (error) {
    return {
      userId: null,
      status: 'error',
      message: mapAuthError(error),
      needsEmailVerification: false,
    };
  }
};

/**
 * Google Sign-In — CareerMate-style, with guest (anonymous) link + favorites migrate.
 */
export const loginWithGoogle = async () => {
  try {
    const previous = getCurrentUser();
    const previousUid = previous?.isAnonymous ? previous.uid : null;
    const {idToken, credential: googleCred} = await getGoogleAuthCredential();

    let user;

    if (previous?.isAnonymous) {
      try {
        const linked = await linkWithCredential(previous, googleCred);
        user = linked.user;
      } catch (linkError) {
        console.log('Google link on login skipped:', linkError?.code || linkError);
        // Fresh credential object from the same idToken (one-time AuthCredential objects)
        const signed = await signInWithCredential(
          getFirebaseAuth(),
          credentialFromIdToken(idToken),
        );
        user = signed.user;
      }
    } else {
      const signed = await signInWithCredential(
        getFirebaseAuth(),
        credentialFromIdToken(idToken),
      );
      user = signed.user;
    }

    await reloadUser(user);
    user = getCurrentUser() || user;

    await createUserProfileOnce({
      uid: user.uid,
      email: user.email || '',
      fullName: user.displayName || '',
      username: user.displayName || (user.email || '').split('@')[0] || 'user',
      isAnonymous: false,
      emailVerified: !!user.emailVerified,
    }).catch(e => console.warn('Google profile create skipped:', e?.message || e));

    await softProfile(user, {authProvider: 'google'});
    await syncEmailVerifiedStatus(user.uid, user.emailVerified);
    await softCatalog();

    try {
      if (previousUid && previousUid !== user.uid) {
        const {migrateGuestDataToAccount} = require('./favorites.service');
        await migrateGuestDataToAccount(previousUid, user.uid);
      } else {
        const {migrateLocalFavoritesToAccount} = require('./favorites.service');
        await migrateLocalFavoritesToAccount(user.uid);
      }
    } catch (e) {
      console.warn('Google favorites migrate skipped:', e?.message || e);
    }

    await completeAuthenticatedEntry(user);
    return toSessionPayload(user);
  } catch (error) {
    throw mapAuthError(error);
  }
};

export const resetPasswordWithEmail = async ({email}) => {
  try {
    await sendPasswordResetEmailNative(
      email.trim().toLowerCase(),
      getPasswordResetActionCodeSettings(),
    );
    return {
      userId: 'sent',
      status: 'success',
      message: '',
    };
  } catch (error) {
    return {
      userId: null,
      status: 'error',
      message: mapAuthError(error),
    };
  }
};

export const confirmPasswordResetCode = async (oobCode, newPassword) => {
  try {
    await confirmPasswordResetNative(oobCode, newPassword);
  } catch (error) {
    throw mapAuthError(error);
  }
};

export const resendEmailVerification = async () => {
  const user = getCurrentUser();
  if (!user || user.isAnonymous) {
    throw 'No signed-in email account.';
  }
  await reloadUser(user);
  const fresh = getCurrentUser();
  if (!fresh) {
    throw 'No signed-in user.';
  }
  await sendEmailVerification(fresh, getEmailVerificationActionCodeSettings());
};

export const refreshAuthUser = async () => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  await reloadUser(user);
  const refreshed = getCurrentUser();
  if (!refreshed) {
    return null;
  }
  await syncEmailVerifiedStatus(refreshed.uid, refreshed.emailVerified);
  return toSessionPayload(refreshed);
};

/** Logout email/Google user, then restore anonymous guest session. */
export const logoutFirebase = async () => {
  try {
    await signOutFromGoogle();
  } catch (e) {
    console.log('Google signOut error', e);
  }
  try {
    if (getCurrentUser()) {
      await signOut();
    }
  } catch (e) {
    console.log('signOut error', e);
  }
  // Clear bound account name so UI shows Guest after logout
  try {
    await setLocalDisplayName('');
  } catch (e) {
    console.warn('Clear display name on logout skipped:', e?.message || e);
  }
  return ensureFirebaseSession();
};

export const getCurrentFirebaseUser = () => getCurrentUser();

export const getFirebaseIdToken = async forceRefresh => {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return user.getIdToken(forceRefresh);
};

export const getActiveUserId = () => getCurrentUser()?.uid || null;
