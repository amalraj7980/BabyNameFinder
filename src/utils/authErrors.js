import {
  GOOGLE_SIGN_IN_CANCELLED,
  GOOGLE_SIGN_IN_NO_ID_TOKEN,
  GOOGLE_SIGN_IN_NOT_CONFIGURED,
} from '../services/googleSignIn.service';

/** Map Firebase Auth / Google Sign-In error codes to user-facing messages */
export const mapAuthError = error => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/credential-already-in-use':
      return 'This email is already linked to another account.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in Firebase Console.';
    case 'auth/admin-restricted-operation':
      return 'New account creation is currently restricted. Please contact support.';
    case 'auth/invalid-action-code':
      return 'This link is invalid or has already been used.';
    case 'auth/expired-action-code':
      return 'This link has expired. Request a new one.';
    case 'auth/missing-email':
      return 'Email address is required.';
    case GOOGLE_SIGN_IN_CANCELLED:
      return 'Sign in cancelled.';
    case GOOGLE_SIGN_IN_NO_ID_TOKEN:
      return 'Google Sign-In failed. Please try again.';
    case GOOGLE_SIGN_IN_NOT_CONFIGURED:
      return 'Google Sign-In is not configured yet. Add your Firebase Web client ID.';
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      return 'Google Play Services is unavailable. Update Play Services and try again.';
    case 'IN_PROGRESS':
      return 'Sign in is already in progress. Please wait.';
    case 'DEVELOPER_ERROR':
    case '10':
      return 'Google Sign-In is not authorized for this build. Add SHA-1 in Firebase, re-download google-services.json, then rebuild.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
};
