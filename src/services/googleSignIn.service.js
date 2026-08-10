import {
  GoogleSignin,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';

import {GOOGLE_WEB_CLIENT_ID} from '../config/googleSignIn';
import {
  getFirebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '../firebase/auth';

export const GOOGLE_SIGN_IN_CANCELLED = 'google-sign-in/cancelled';
export const GOOGLE_SIGN_IN_NO_ID_TOKEN = 'google-sign-in/no-id-token';
export const GOOGLE_SIGN_IN_NOT_CONFIGURED = 'google-sign-in/not-configured';

let configured = false;

export const configureGoogleSignIn = () => {
  if (configured) {
    return;
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    console.warn(
      'Google Sign-In: GOOGLE_WEB_CLIENT_ID is empty. Add the Web client ID from Firebase (client_type 3) in src/config/googleSignIn.js after enabling Google Sign-In.',
    );
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  configured = true;
};

const assertConfigured = () => {
  if (!GOOGLE_WEB_CLIENT_ID) {
    const error = new Error(
      'Google Sign-In is not configured. Add your Firebase Web client ID in src/config/googleSignIn.js.',
    );
    Object.assign(error, {code: GOOGLE_SIGN_IN_NOT_CONFIGURED});
    throw error;
  }
};

const resolveIdToken = async fromSignIn => {
  if (fromSignIn) {
    return fromSignIn;
  }

  const tokens = await GoogleSignin.getTokens();
  if (tokens.idToken) {
    return tokens.idToken;
  }

  const error = new Error('Google sign in failed: missing ID token.');
  Object.assign(error, {code: GOOGLE_SIGN_IN_NO_ID_TOKEN});
  throw error;
};

/** Interactive Google account picker → Firebase ID token. */
export const getGoogleIdToken = async () => {
  assertConfigured();
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

  const response = await GoogleSignin.signIn();
  if (isCancelledResponse(response)) {
    const error = new Error('Google sign in cancelled.');
    Object.assign(error, {code: GOOGLE_SIGN_IN_CANCELLED});
    throw error;
  }

  return resolveIdToken(response?.data?.idToken);
};

export const credentialFromIdToken = idToken =>
  GoogleAuthProvider.credential(idToken);

export const signInWithGoogleAccount = async () => {
  const idToken = await getGoogleIdToken();
  return signInWithCredential(
    getFirebaseAuth(),
    credentialFromIdToken(idToken),
  );
};

/** Returns a fresh AuthCredential (new object each call). */
export const getGoogleAuthCredential = async () => {
  const idToken = await getGoogleIdToken();
  return {idToken, credential: credentialFromIdToken(idToken)};
};

export const signOutFromGoogle = async () => {
  configureGoogleSignIn();

  try {
    if (GoogleSignin.hasPreviousSignIn()) {
      await GoogleSignin.signOut();
    }
  } catch {
    // Best-effort; Firebase sign-out still runs in auth.service.
  }
};
