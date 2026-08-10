import React, {useState, useContext} from 'react';
import {Text, Pressable, ActivityIndicator, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import AppInput from '../../components/AppInput';
import {validateEmail} from '../../utils/authValidation';
import {DesignTokens} from '../../theme/designTokens';
import AuthScreenLayout from './AuthScreenLayout';
import {authStyles} from './authStyles';

const ForgotPasswordScreen = ({navigation}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const {sendPasswordReset, error, clearError} = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = validateEmail(email).valid && !loading;

  const handlePasswordReset = async () => {
    if (!canSubmit) {
      return;
    }
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
    <AuthScreenLayout
      compact
      showBack
      onBack={() => navigation.goBack()}
      showBrand={false}
      heroTitle={sent ? 'Check your email' : locale?.resetButton || 'Reset password'}
      heroSubtitle={
        sent
          ? `We sent a reset link to ${email.trim()}. Open it from your inbox to set a new password in the app.`
          : locale?.resetDiscription ||
            'Enter your account email and we will send a reset link.'
      }>
      {sent ? (
        <View>
          <View style={authStyles.successIconWrap}>
            <Ionicons
              name="checkmark-circle"
              size={44}
              color={DesignTokens.colors.primary}
            />
          </View>
          <Text style={authStyles.formSuccess}>Reset link sent successfully</Text>
          {error ? <Text style={authStyles.formError}>{error}</Text> : null}
        </View>
      ) : (
        <AppInput
          leftIcon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail address"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={handlePasswordReset}
          error={fieldError || error}
          containerStyle={authStyles.inputCompact}
          inputWrapperStyle={{minHeight: 46}}
        />
      )}

      <Pressable
        onPress={sent ? () => navigation.navigate('SignIn') : handlePasswordReset}
        style={[
          authStyles.primaryButton,
          !sent && !canSubmit ? authStyles.primaryButtonDisabled : null,
        ]}
        disabled={sent ? false : !canSubmit}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.primaryButtonText}>
            {sent ? 'Back to Sign in' : locale?.resetButton || 'Send reset link'}
          </Text>
        )}
      </Pressable>
    </AuthScreenLayout>
  );
};

export default ForgotPasswordScreen;
