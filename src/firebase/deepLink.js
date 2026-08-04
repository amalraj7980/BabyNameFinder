import {
  ANDROID_PACKAGE_NAME,
  FIREBASE_AUTH_ACTION_URL,
} from './config';

const getAuthActionCodeSettings = () => ({
  url: FIREBASE_AUTH_ACTION_URL,
  handleCodeInApp: true,
  android: {
    packageName: ANDROID_PACKAGE_NAME,
    installApp: true,
    minimumVersion: '1',
  },
});

export const getPasswordResetActionCodeSettings = () =>
  getAuthActionCodeSettings();

export const getEmailVerificationActionCodeSettings = () =>
  getAuthActionCodeSettings();

const getQueryParam = (url, key) => {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const isAuthMode = value =>
  value === 'resetPassword' ||
  value === 'verifyEmail' ||
  value === 'recoverEmail' ||
  value === 'signIn';

export const parseAuthDeepLink = url => {
  if (!url) {
    return null;
  }
  try {
    const modeParam = getQueryParam(url, 'mode') ?? '';
    const oobCode = getQueryParam(url, 'oobCode');
    const apiKey = getQueryParam(url, 'apiKey');
    const continueUrl = getQueryParam(url, 'continueUrl');
    const mode = isAuthMode(modeParam) ? modeParam : 'unknown';

    if (!oobCode && mode === 'unknown') {
      return null;
    }

    return {mode, oobCode, apiKey, continueUrl};
  } catch {
    return null;
  }
};

export const isPasswordResetLink = url => {
  const parsed = parseAuthDeepLink(url);
  return parsed?.mode === 'resetPassword' && Boolean(parsed.oobCode);
};
