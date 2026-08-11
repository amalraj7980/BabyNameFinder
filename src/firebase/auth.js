/**
 * Thin Firebase Auth wrappers (CareerMate-style).
 * Business logic lives in src/services/auth.service.js
 * Uses RN Firebase modular API (v22+).
 */
import {getApp} from '@react-native-firebase/app';
import {
  getAuth,
  onAuthStateChanged as onAuthStateChangedModular,
  signInAnonymously as signInAnonymouslyModular,
  signInWithEmailAndPassword as signInWithEmailAndPasswordModular,
  createUserWithEmailAndPassword as createUserWithEmailAndPasswordModular,
  sendPasswordResetEmail as sendPasswordResetEmailModular,
  confirmPasswordReset as confirmPasswordResetModular,
  signOut as signOutModular,
  signInWithCredential as signInWithCredentialModular,
  linkWithCredential as linkWithCredentialModular,
  EmailAuthProvider,
  GoogleAuthProvider as GoogleAuthProviderModular,
} from '@react-native-firebase/auth';

export const getFirebaseAuth = () => getAuth(getApp());

export const getCurrentUser = () => getFirebaseAuth().currentUser;

export const onAuthStateChanged = listener =>
  onAuthStateChangedModular(getFirebaseAuth(), listener);

export const signInAnonymously = () =>
  signInAnonymouslyModular(getFirebaseAuth());

export const signInWithEmailAndPassword = (email, password) =>
  signInWithEmailAndPasswordModular(getFirebaseAuth(), email, password);

export const createUserWithEmailAndPassword = (email, password) =>
  createUserWithEmailAndPasswordModular(getFirebaseAuth(), email, password);

export const sendPasswordResetEmail = (email, actionCodeSettings) =>
  actionCodeSettings
    ? sendPasswordResetEmailModular(
        getFirebaseAuth(),
        email,
        actionCodeSettings,
      )
    : sendPasswordResetEmailModular(getFirebaseAuth(), email);

export const confirmPasswordReset = (oobCode, newPassword) =>
  confirmPasswordResetModular(getFirebaseAuth(), oobCode, newPassword);

export const sendEmailVerification = (user, actionCodeSettings) =>
  actionCodeSettings
    ? user.sendEmailVerification(actionCodeSettings)
    : user.sendEmailVerification();

export const reloadUser = user => user.reload();

export const updateProfile = (user, profile) => user.updateProfile(profile);

export const signOut = () => signOutModular(getFirebaseAuth());

export const getEmailAuthCredential = (email, password) =>
  EmailAuthProvider.credential(email, password);

export const GoogleAuthProvider = GoogleAuthProviderModular;

export const signInWithCredential = (authInstance, credential) =>
  signInWithCredentialModular(authInstance, credential);

export const linkWithCredential = (user, credential) =>
  linkWithCredentialModular(user, credential);
