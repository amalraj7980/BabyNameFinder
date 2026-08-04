/** Map Firebase Auth error codes to user-facing messages */
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
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in Firebase Console.';
    case 'auth/invalid-action-code':
      return 'This link is invalid or has already been used.';
    case 'auth/expired-action-code':
      return 'This link has expired. Request a new one.';
    case 'auth/missing-email':
      return 'Email address is required.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
};
