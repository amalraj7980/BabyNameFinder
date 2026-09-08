import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {Flash} from '../../util';
import CustomPopup from '../../components/CustomPopup';
import AppInput from '../../components/AppInput';
import {validateRegisterForm} from '../../utils/authValidation';
import AuthScreenLayout from './AuthScreenLayout';
import AuthSocialFooter from './AuthSocialFooter';
import AuthGoogleLoadingOverlay from './AuthGoogleLoadingOverlay';
import {authStyles} from './authStyles';
import {PRIVACY_POLICY_URL, TERMS_OF_USE_URL} from '../../constants/appInfo';

const SignUpScreen = ({navigation}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const {
    signUpWithCredentials,
    signInWithGoogle,
    clearError,
    error: authError,
  } = useContext(AuthContext);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isErrorPopupVisible, setIsErrorPopupVisible] = useState(false);
  const [signupError, setSignupError] = useState();
  const googleSubmittingRef = useRef(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFieldError('');
      clearError?.();
      setLoading(false);
    });
    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [navigation, clearError]);

  const signupHandler = async () => {
    clearError?.();
    setFieldError('');
    const validation = validateRegisterForm({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!validation.valid) {
      setFieldError(validation.error);
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithCredentials({
        email,
        password,
        fullName,
        username: fullName.trim(),
      });
      setLoading(false);

      if (result?.status === 'error' || !result?.userId) {
        setSignupError(result?.message || authError || 'Signup failed');
        setIsErrorPopupVisible(true);
        return;
      }

      navigation.replace('EmailVerification');
    } catch (e) {
      setLoading(false);
      setSignupError(typeof e === 'string' ? e : e?.message);
      setIsErrorPopupVisible(true);
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
  const canSubmit =
    validateRegisterForm({
      fullName,
      email,
      password,
      confirmPassword,
    }).valid && !busy;

  return (
    <AuthScreenLayout
      compact
      showBack
      onBack={() => navigation.goBack()}
      heroTitle="Create account"
      heroSubtitle="Save favorites and personalize your name discovery."
      overlay={<AuthGoogleLoadingOverlay visible={googleLoading} />}>
      <AppInput
        label="Full name"
        leftIcon="person"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Full name"
        autoCapitalize="words"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => emailRef.current?.focus?.()}
        editable={!busy}
      />

      <AppInput
        ref={emailRef}
        label={locale?.placeholder?.email || 'Email'}
        leftIcon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder={locale?.placeholder?.email || 'Email'}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus?.()}
        editable={!busy}
      />

      <AppInput
        ref={passwordRef}
        label={locale?.placeholder?.password || 'Password'}
        leftIcon="key"
        leftIconSet="fa"
        value={password}
        onChangeText={setPassword}
        placeholder={locale?.placeholder?.password || 'Password'}
        secureTextEntry
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus?.()}
        editable={!busy}
      />

      <AppInput
        ref={confirmRef}
        label={locale?.placeholder?.confirmPassword || 'Confirm password'}
        leftIcon="key"
        leftIconSet="fa"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={
          locale?.placeholder?.confirmPassword || 'Confirm password'
        }
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={signupHandler}
        error={fieldError || authError}
        editable={!busy}
      />

      <Pressable
        style={[
          authStyles.primaryButton,
          !canSubmit ? authStyles.primaryButtonDisabled : null,
        ]}
        onPress={signupHandler}
        disabled={!canSubmit}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.primaryButtonText}>
            {locale?.lets_go || 'Create account'}
          </Text>
        )}
      </Pressable>

      <AuthSocialFooter
        message="Already have an account?"
        actionLabel="Sign in"
        onPress={() => navigation.navigate('SignIn')}
        onGooglePress={handleGoogleSignIn}
        googleDisabled={busy}
        googleLoading={googleLoading}
      />

      <Text style={authStyles.legalText}>
        {locale?.privacyPolicy || 'By continuing you agree to our '}
        <Text
          onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
          style={authStyles.legalLink}>
          Terms of Service
        </Text>
        <Text> and </Text>
        <Text
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          style={authStyles.legalLink}>
          Privacy Policy
        </Text>
      </Text>

      <CustomPopup
        isVisible={isErrorPopupVisible}
        message={signupError}
        title={'Error'}
        style={{width: '90%', height: 200}}
        onClose={() => setIsErrorPopupVisible(false)}
        onCancel={() => setIsErrorPopupVisible(false)}
        cancelText="Cancel"
      />
    </AuthScreenLayout>
  );
};

export default SignUpScreen;
