import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {Flash} from '../../util';
import AppInput from '../../components/AppInput';
import AuthScreenLayout from './AuthScreenLayout';
import AuthSocialFooter from './AuthSocialFooter';
import AuthGoogleLoadingOverlay from './AuthGoogleLoadingOverlay';
import {authStyles} from './authStyles';

const SignInScreen = ({navigation}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const {
    loginUserWithCredentials,
    signInWithGoogle,
    clearError,
    error: authError,
  } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordRef = useRef(null);
  const googleSubmittingRef = useRef(false);

  const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPassword = value => value.length >= 6;
  const canSubmit =
    isValidEmail(email) && isValidPassword(password) && !loading && !googleLoading;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setEmail('');
      setEmailError('');
      setPassword('');
      setPasswordError('');
      clearError?.();
    });
    return unsubscribe;
  }, [navigation, clearError]);

  const handleEmailChange = text => {
    setEmail(text);
    setEmailError(isValidEmail(text) ? '' : locale?.error?.emailInvalid || 'Invalid email');
  };

  const handlePasswordChange = text => {
    const trimmed = text.trim();
    setPassword(trimmed);
    setPasswordError(
      isValidPassword(trimmed)
        ? ''
        : locale?.error?.passcodeInvalid || 'Password must be at least 6 characters',
    );
  };

  const finishLogin = session => {
    if (!session?.userId) {
      Alert.alert(
        'Error',
        'Invalid Email or Password. Please check the information entered.',
      );
      return;
    }
    if (!session.emailVerified) {
      navigation.replace('EmailVerification');
      return;
    }
    navigation.getParent()?.navigate('MainTabs');
  };

  const loginHandler = async () => {
    clearError?.();
    if (!isValidEmail(email)) {
      setEmailError(locale?.error?.emailInvalid || 'Invalid email');
      return;
    }
    if (!isValidPassword(password)) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const session = await loginUserWithCredentials(email, password);
      setLoading(false);
      finishLogin(session);
    } catch (e) {
      setLoading(false);
      Flash.showError(typeof e === 'string' ? e : e?.message || 'Login failed');
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleSubmittingRef.current || loading || googleLoading) {
      return;
    }
    clearError?.();
    googleSubmittingRef.current = true;
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      // Google emails are typically verified
      if (session?.userId) {
        navigation.getParent()?.navigate('MainTabs');
      }
    } catch (e) {
      const message =
        typeof e === 'string' ? e : e?.message || 'Google sign-in failed';
      const lower = String(message).toLowerCase();
      if (lower.includes('cancel') || lower.includes('cancelled')) {
        return;
      }
      Flash.showError(message);
    } finally {
      googleSubmittingRef.current = false;
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthScreenLayout
      compact
      showBack
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }
        navigation.getParent()?.goBack();
      }}
      heroTitle={locale?.bT_login || 'Welcome back'}
      heroSubtitle="Sign in to sync favorites."
      overlay={<AuthGoogleLoadingOverlay visible={googleLoading} />}>
      <AppInput
        label={locale?.placeholder?.email || 'Email'}
        leftIcon="mail"
        value={email}
        onChangeText={handleEmailChange}
        placeholder={locale?.placeholder?.email || 'Email'}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus?.()}
        error={emailError}
        containerStyle={authStyles.inputCompact}
        inputWrapperStyle={{minHeight: 46}}
        editable={!busy}
      />

      <AppInput
        ref={passwordRef}
        label={locale?.placeholder?.password || 'Password'}
        leftIcon="key"
        leftIconSet="fa"
        value={password}
        onChangeText={handlePasswordChange}
        placeholder={locale?.placeholder?.password || 'Password'}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={loginHandler}
        error={passwordError || authError}
        containerStyle={authStyles.inputCompact}
        inputWrapperStyle={{minHeight: 46}}
        editable={!busy}
      />

      <Pressable
        style={authStyles.forgotLinkRow}
        onPress={() => navigation.navigate('ForgotPassword')}
        hitSlop={8}
        disabled={busy}>
        <Text style={authStyles.forgotLink}>
          {locale?.forgotPassword || 'Forgot password?'}
        </Text>
      </Pressable>

      <Pressable
        style={[
          authStyles.primaryButton,
          !canSubmit ? authStyles.primaryButtonDisabled : null,
        ]}
        onPress={loginHandler}
        disabled={!canSubmit}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.primaryButtonText}>
            {locale?.bT_login || 'Sign in'}
          </Text>
        )}
      </Pressable>

      <AuthSocialFooter
        message={
          locale?.dontHaveAnAccount?.split('?')?.[0] ||
          "Don't have an account?"
        }
        actionLabel="Sign up"
        onPress={() => navigation.navigate('SignUp')}
        onGooglePress={handleGoogleSignIn}
        googleDisabled={busy}
        googleLoading={googleLoading}
      />
    </AuthScreenLayout>
  );
};

export default SignInScreen;
