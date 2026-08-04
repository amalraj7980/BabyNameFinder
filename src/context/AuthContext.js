/*
  Auth context — CareerMate-style email flows + guest anonymous session.
  - Password-reset deep links (Gmail → oobCode → ResetPassword)
  - Email verification send + poll
*/

import React, {createContext, useState, useEffect, useCallback} from 'react';
import {Linking} from 'react-native';
import {
  logoutFirebase,
  ensureFirebaseSession,
  toSessionPayload,
  loginWithEmailPassword,
  signupWithEmailPassword,
  resetPasswordWithEmail,
  confirmPasswordResetCode,
  resendEmailVerification,
  refreshAuthUser,
} from '../services/auth.service';
import {onAuthStateChanged, getCurrentUser} from '../firebase/auth';
import {isPasswordResetLink, parseAuthDeepLink} from '../firebase/deepLink';
import {Storage} from '../util';
import {navigateToResetPassword} from '../routes/navigationRef';

const initialAuthState = {
  authStateLoading: true,
  isUserLoggedin: false,
  isAnonymous: true,
  emailVerified: false,
  userId: null,
  access_token: null,
  email: null,
  displayName: null,
};

export const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
  const [val, setVal] = useState(initialAuthState);
  const [loginOccurred, setLoginOccurred] = useState(false);
  const [appSetupComplete, setAppSetupComplete] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [pendingResetCode, setPendingResetCode] = useState(null);
  const [authError, setAuthError] = useState(null);

  const clearError = () => setAuthError(null);

  const applySession = session => {
    if (!session?.userId) {
      setVal({...initialAuthState, authStateLoading: false});
      return;
    }
    Storage.setUserID(session.userId);
    Storage.setUserAccessToken(session.token);
    setVal({
      access_token: session.token,
      userId: session.userId,
      email: session.email || null,
      displayName: session.displayName || null,
      emailVerified: !!session.emailVerified,
      isAnonymous: !!session.isAnonymous,
      isUserLoggedin: !!session.isUserLoggedin,
      authStateLoading: false,
    });
  };

  const loginUser = (userId, access_token) => {
    Storage.setUserID(userId);
    Storage.setUserAccessToken(access_token);
    const current = getCurrentUser();
    setVal({
      access_token,
      userId,
      email: current?.email || null,
      displayName: current?.displayName || null,
      emailVerified: !!current?.emailVerified,
      isAnonymous: !!current?.isAnonymous,
      isUserLoggedin: current ? !current.isAnonymous : true,
      authStateLoading: false,
    });
  };

  const handleIncomingUrl = useCallback(url => {
    if (!url || !isPasswordResetLink(url)) {
      return;
    }
    const parsed = parseAuthDeepLink(url);
    if (parsed?.oobCode) {
      setPendingResetCode(parsed.oobCode);
      navigateToResetPassword(parsed.oobCode);
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    const boot = async () => {
      try {
        await ensureFirebaseSession();
      } catch (e) {
        console.log('Firebase session bootstrap failed:', e?.message || e);
      } finally {
        setFirebaseReady(true);
      }
    };

    boot();

    unsubscribe = onAuthStateChanged(async user => {
      try {
        if (!user) {
          const session = await ensureFirebaseSession();
          applySession(session);
          return;
        }
        const session = await toSessionPayload(user);
        applySession(session);
      } catch (e) {
        console.log('onAuthStateChanged error:', e?.message || e);
        setVal(prev => ({...prev, authStateLoading: false}));
      }
    });

    Linking.getInitialURL().then(handleIncomingUrl).catch(() => {});
    const linkingSub = Linking.addEventListener('url', ({url}) =>
      handleIncomingUrl(url),
    );

    return () => {
      unsubscribe();
      if (typeof linkingSub?.remove === 'function') {
        linkingSub.remove();
      } else if (Linking.removeEventListener) {
        Linking.removeEventListener('url', handleIncomingUrl);
      }
    };
  }, [handleIncomingUrl]);

  // After navigation is ready, open pending reset if any
  useEffect(() => {
    if (pendingResetCode && firebaseReady) {
      navigateToResetPassword(pendingResetCode);
    }
  }, [pendingResetCode, firebaseReady]);

  const logoutUser = async () => {
    try {
      const session = await logoutFirebase();
      applySession(session);
      setLoginOccurred(false);
    } catch (e) {
      console.log('Firebase logout error:', e);
      Storage.logOut();
      setVal({...initialAuthState, authStateLoading: false});
    }
  };

  const checkAuthState = async () => {
    try {
      const session = await ensureFirebaseSession();
      applySession(session);
    } catch (e) {
      setVal(prev => ({...prev, authStateLoading: false}));
    }
  };

  const checkAppSetup = async () => {
    try {
      const appSetupFlag = await Storage.getAppSetUpComplete();
      setAppSetupComplete(appSetupFlag === 'true');
    } catch (error) {
      console.log('Error checking app setup:', error);
    }
  };

  const loginUserWithCredentials = async (email, password) => {
    clearError();
    try {
      const response = await loginWithEmailPassword({email, password});
      applySession(response);
      setLoginOccurred(true);
      return response;
    } catch (e) {
      const message = typeof e === 'string' ? e : e?.message || 'Login failed.';
      setAuthError(message);
      throw message;
    }
  };

  const signUpWithCredentials = async ({email, password, fullName, username}) => {
    clearError();
    const result = await signupWithEmailPassword({
      email,
      password,
      fullName,
      username,
    });
    if (result.status === 'error') {
      setAuthError(result.message);
      return result;
    }
    applySession(result);
    setLoginOccurred(true);
    return result;
  };

  const sendPasswordReset = async email => {
    clearError();
    const result = await resetPasswordWithEmail({email});
    if (result.status === 'error') {
      setAuthError(result.message);
      throw result.message;
    }
    return result;
  };

  const resetPassword = async (oobCode, newPassword) => {
    clearError();
    try {
      await confirmPasswordResetCode(oobCode, newPassword);
      setPendingResetCode(null);
    } catch (e) {
      const message = typeof e === 'string' ? e : e?.message || 'Reset failed.';
      setAuthError(message);
      throw message;
    }
  };

  const checkEmailVerified = useCallback(async () => {
    try {
      const session = await refreshAuthUser();
      if (session) {
        applySession(session);
        return !!session.emailVerified;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, []);

  const resendVerificationEmailFn = useCallback(async () => {
    clearError();
    try {
      await resendEmailVerification();
    } catch (e) {
      const message =
        typeof e === 'string' ? e : e?.message || 'Could not resend email.';
      setAuthError(message);
      throw message;
    }
  }, []);

  const value = {
    ...val,
    loginUserWithCredentials,
    signUpWithCredentials,
    sendPasswordReset,
    resetPassword,
    resendVerificationEmail: resendVerificationEmailFn,
    checkEmailVerified,
    checkAuthState,
    loginUser,
    logoutUser,
    loginOccurred,
    appSetupComplete,
    setAppSetupComplete,
    checkAppSetup,
    firebaseReady,
    pendingResetCode,
    setPendingResetCode,
    error: authError,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
