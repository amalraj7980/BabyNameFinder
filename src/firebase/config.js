/** Firebase project / Android package — from google-services.json */
export const ANDROID_PACKAGE_NAME = 'com.genesis.baby.names';
export const FIREBASE_PROJECT_ID = 'baby-name-finder-dd77d';
export const APP_NAME = 'Baby Names Together';

export const AUTH_LINK_HOST = 'baby-name-finder-dd77d.firebaseapp.com';
export const AUTH_LINK_PATH = '/auth';
export const AUTH_CONTINUE_URL = `https://${AUTH_LINK_HOST}${AUTH_LINK_PATH}`;

/** Firebase-hosted action URL for verification + password-reset emails */
export const FIREBASE_AUTH_ACTION_URL = `https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/action`;

export const AUTH_DEEP_LINK_PREFIXES = [
  'babynames://auth',
  AUTH_CONTINUE_URL,
  `https://${FIREBASE_PROJECT_ID}.firebaseapp.com`,
];

/**
 * Must match published Firestore rules:
 * baby_names, meta, users, usernames, reactions/{uid}/likes|dislikes
 */
export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  usernames: 'usernames',
  babyNames: 'baby_names',
  meta: 'meta',
  reactions: 'reactions',
  /** Remote force/optional update gate (`app_config/version`). */
  appConfig: 'app_config',
};

export const REACTION_SUBCOLLECTIONS = {
  likes: 'likes',
  dislikes: 'dislikes',
};
