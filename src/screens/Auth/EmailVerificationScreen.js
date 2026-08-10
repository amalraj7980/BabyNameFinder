import React, {useEffect, useState, useContext} from 'react';
import {Text, Pressable, ActivityIndicator, View} from 'react-native';
import {AuthContext} from '../../context/AuthContext';
import {navigateToHome} from '../../routes/navigationRef';
import AuthScreenLayout from './AuthScreenLayout';
import {authStyles} from './authStyles';

const POLL_INTERVAL_MS = 5000;
const RESEND_COOLDOWN_MS = 60000;

const EmailVerificationScreen = ({navigation}) => {
  const {
    email,
    error,
    clearError,
    resendVerificationEmail,
    checkEmailVerified,
    logoutUser,
    emailVerified,
  } = useContext(AuthContext);

  const [localMessage, setLocalMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      checkEmailVerified().catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkEmailVerified]);

  useEffect(() => {
    if (emailVerified) {
      navigateToHome();
    }
  }, [emailVerified]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendCooldown(current => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) {
      return;
    }
    clearError?.();
    setLocalMessage('');
    setLoading(true);
    try {
      await resendVerificationEmail();
      setLocalMessage('Verification email sent. Check your inbox (and spam).');
      setResendCooldown(RESEND_COOLDOWN_MS / 1000);
    } catch (e) {
      // context error
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    clearError?.();
    setLocalMessage('');
    setLoading(true);
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        navigateToHome();
      } else {
        setLocalMessage(
          'Not verified yet. Open the link in your email, then try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      navigation.replace('SignIn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      showBrand={false}
      heroTitle="Verify your email"
      heroSubtitle="We sent a verification link to your inbox. Open it to activate your account.">
      <View
        style={{
          backgroundColor: '#FFF8F2',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: '#F0E8E2',
        }}>
        <Text style={authStyles.footerText}>Email</Text>
        <Text style={[authStyles.heroSubtitle, {color: '#2C3340', fontWeight: '600'}]}>
          {email || '—'}
        </Text>
      </View>

      <Text style={[authStyles.heroSubtitle, {marginBottom: 8}]}>
        1. Open the email from Firebase / Baby Names{'\n'}
        2. Tap the verification link{'\n'}
        3. Return here and tap “I’ve verified”
      </Text>
      <Text style={[authStyles.legalText, {marginTop: 0, marginBottom: 12}]}>
        Check spam if you don’t see it within a minute.
      </Text>

      {error ? <Text style={authStyles.formError}>{error}</Text> : null}
      {localMessage ? <Text style={authStyles.formSuccess}>{localMessage}</Text> : null}

      <Pressable
        onPress={handleContinue}
        style={[
          authStyles.primaryButton,
          loading ? authStyles.primaryButtonDisabled : null,
        ]}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.primaryButtonText}>I’ve verified</Text>
        )}
      </Pressable>

      <Pressable
        onPress={handleResend}
        disabled={loading || resendCooldown > 0}
        style={{marginTop: 18, alignItems: 'center'}}>
        <Text style={authStyles.footerLink}>
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend verification email'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleSignOut}
        style={{marginTop: 24, alignItems: 'center'}}>
        <Text style={authStyles.footerText}>Sign out</Text>
      </Pressable>
    </AuthScreenLayout>
  );
};

export default EmailVerificationScreen;
