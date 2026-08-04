import React, {useState, useContext} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Colors, Fonts} from '../../styles';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import AppInput from '../../components/AppInput';
import {styles} from './forgotPasswordScreenStyles';
import {validateEmail} from '../../utils/authValidation';

const ForgotPasswordScreen = ({navigation}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const {sendPasswordReset, error, clearError} = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePasswordReset = async () => {
    clearError?.();
    setFieldError('');
    const validation = validateEmail(email);
    if (!validation.valid) {
      setFieldError(validation.error);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      // error via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={[styles.title, {fontFamily: Fonts.bold}]}>
          {sent ? 'Check your email' : locale?.resetButton || 'Reset password'}
        </Text>
        <Text style={[styles.description, {fontFamily: Fonts.regular}]}>
          {sent
            ? `We sent a reset link to ${email.trim()}. Open it from Gmail to set a new password in the app.`
            : locale?.resetDiscription ||
              'Enter your account email and we will send a reset link.'}
        </Text>

        {!sent ? (
          <AppInput
            label="Email"
            leftIcon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail address"
            autoCapitalize="none"
            keyboardType="email-address"
            error={fieldError || error}
          />
        ) : null}

        {sent && error ? (
          <Text style={[styles.errorText, {fontFamily: Fonts.medium}]}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={
            sent ? () => navigation.navigate('SignIn') : handlePasswordReset
          }
          style={[styles.resetButton, loading ? styles.disabledButton : null]}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={[styles.resetButtonText, {fontFamily: Fonts.semibold}]}>
              {sent
                ? 'Back to Sign in'
                : locale?.resetButton || 'Send reset link'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ForgotPasswordScreen;
