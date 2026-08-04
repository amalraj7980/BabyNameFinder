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
} from '../firebase/auth';
import {
  getEmailVerificationActionCodeSettings,
  getPasswordResetActionCodeSettings,
} from '../firebase/deepLink';
import {forceSeedBabyNames, startBabyNamesLiveSync} from './babyNames.service';
import {
  ensureUserProfileFromAuth,
  createUserProfileOnce,
  syncEmailVerifiedStatus,
} from './user.service';
import {mapAuthError} from '../utils/authErrors';

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

export {toSessionPayload};

const softCatalog = async () => {
  try {
    startBabyNamesLiveSync();
    await forceSeedBabyNames(); // no-op under read-only rules
  } catch (e) {
    console.log('Catalog sync:', e?.message || e);
  }
};

const softProfile = async (user, extra) => {
  try {
    await ensureUserProfileFromAuth(user, extra);
  } catch (e) {
    console.warn('User profile sync skipped:', e?.message || e);
  }
};

/** Always ensure a Firebase user (anonymous guest if needed). */
export const ensureFirebaseSession = async () => {
  let user = getCurrentUser();
  if (!user) {
    try {
      const cred = await signInAnonymously();
      user = cred.user;
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/operation-not-allowed') {
        console.warn(
          'Anonymous Auth is disabled. Enable it in Firebase Console → Authentication → Sign-in method → Anonymous.',
        );
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

/** Logout email user, then restore anonymous guest session. */
export const logoutFirebase = async () => {
  try {
    if (getCurrentUser()) {
      await signOut();
    }
  } catch (e) {
    console.log('signOut error', e);
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
