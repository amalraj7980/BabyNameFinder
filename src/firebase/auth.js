/**
 * Thin Firebase Auth wrappers (CareerMate-style).
 * Business logic lives in src/services/auth.service.js
 */
import auth from '@react-native-firebase/auth';

export const getFirebaseAuth = () => auth();

export const getCurrentUser = () => auth().currentUser;

export const onAuthStateChanged = listener =>
  auth().onAuthStateChanged(listener);

export const signInAnonymously = () => auth().signInAnonymously();

export const signInWithEmailAndPassword = (email, password) =>
  auth().signInWithEmailAndPassword(email, password);

export const createUserWithEmailAndPassword = (email, password) =>
  auth().createUserWithEmailAndPassword(email, password);

export const sendPasswordResetEmail = (email, actionCodeSettings) =>
  actionCodeSettings
    ? auth().sendPasswordResetEmail(email, actionCodeSettings)
    : auth().sendPasswordResetEmail(email);

export const confirmPasswordReset = (oobCode, newPassword) =>
  auth().confirmPasswordReset(oobCode, newPassword);

export const sendEmailVerification = (user, actionCodeSettings) =>
  actionCodeSettings
    ? user.sendEmailVerification(actionCodeSettings)
    : user.sendEmailVerification();

export const reloadUser = user => user.reload();

export const updateProfile = (user, profile) => user.updateProfile(profile);

export const signOut = () => auth().signOut();

export const getEmailAuthCredential = (email, password) =>
  auth.EmailAuthProvider.credential(email, password);

export const GoogleAuthProvider = auth.GoogleAuthProvider;

export const signInWithCredential = (authInstance, credential) =>
  authInstance.signInWithCredential(credential);

export const linkWithCredential = (user, credential) =>
  user.linkWithCredential(credential);
