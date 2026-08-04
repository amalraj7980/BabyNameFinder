import React, {useState, useContext} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Colors} from '../../styles';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
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
        <Text style={styles.title}>
          {sent ? 'Check your email' : locale?.resetButton || 'Reset password'}
        </Text>
        <Text style={styles.description}>
          {sent
            ? `We sent a reset link to ${email.trim()}. Open it from Gmail to set a new password in the app.`
            : locale?.resetDiscription ||
              'Enter your account email and we will send a reset link.'}
        </Text>

        {!sent ? (
          <TextInput
            value={email}
            placeholder="E-mail address"
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.tintGray}
            style={{
              ...styles.input,
              color: 'black',
              backgroundColor: 'white',
            }}
          />
        ) : null}

        {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={
            sent ? () => navigation.navigate('SignIn') : handlePasswordReset
          }
          style={[styles.resetButton, loading ? styles.disabledButton : null]}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.resetButtonText}>
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
