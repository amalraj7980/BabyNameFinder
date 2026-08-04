import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Colors} from '../../styles';
import {AuthContext} from '../../context/AuthContext';
import {styles} from './forgotPasswordScreenStyles';
import {navigateToHome} from '../../routes/navigationRef';

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
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.description}>
        We sent a verification link to your Gmail / inbox. Open it to activate
        your account.
      </Text>

      <View
        style={{
          backgroundColor: Colors.lightGray,
          borderRadius: 8,
          padding: 14,
          marginBottom: 16,
        }}>
        <Text style={{color: Colors.textLight, marginBottom: 4}}>Email</Text>
        <Text style={{color: Colors.textGray, fontWeight: '600'}}>
          {email || '—'}
        </Text>
      </View>

      <Text style={[styles.description, {marginBottom: 8}]}>
        1. Open the email from Firebase / Baby Names{'\n'}
        2. Tap the verification link{'\n'}
        3. Return here and tap “I’ve verified”
      </Text>
      <Text style={[styles.description, {fontSize: 13}]}>
        Check spam if you don’t see it within a minute.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {localMessage ? (
        <Text style={{color: Colors.Boy, marginBottom: 10}}>{localMessage}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleContinue}
        style={[styles.resetButton, loading ? styles.disabledButton : null]}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.resetButtonText}>I’ve verified</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={loading || resendCooldown > 0}
        style={{marginTop: 18, alignItems: 'center'}}>
        <Text style={{color: Colors.primary, fontWeight: '600'}}>
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend verification email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSignOut}
        style={{marginTop: 24, alignItems: 'center'}}>
        <Text style={{color: Colors.textLight}}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailVerificationScreen;
