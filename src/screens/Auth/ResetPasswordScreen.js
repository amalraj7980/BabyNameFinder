import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Fonts} from '../../styles';
import {styles} from './forgotPasswordScreenStyles';
import {
  validatePassword,
  validateConfirmPassword,
} from '../../utils/authValidation';
import {AuthContext} from '../../context/AuthContext';
import AppInput from '../../components/AppInput';

const ResetPasswordScreen = ({navigation, route}) => {
  const {resetPassword, error, clearError} = React.useContext(AuthContext);
  const oobCode = route?.params?.oobCode ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    clearError?.();
    setFieldError('');

    if (!oobCode) {
      setFieldError('This reset link is invalid. Request a new one.');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setFieldError(passwordCheck.error);
      return;
    }
    const confirmCheck = validateConfirmPassword(password, confirmPassword);
    if (!confirmCheck.valid) {
      setFieldError(confirmCheck.error);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(oobCode, password);
      navigation.replace('PasswordResetSuccess');
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
          Set new password
        </Text>
        <Text style={[styles.description, {fontFamily: Fonts.regular}]}>
          Choose a strong password for your account.
        </Text>

        <AppInput
          label="New password"
          leftIcon="key"
          leftIconSet="fa"
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          secureTextEntry
          autoCapitalize="none"
        />
        <AppInput
          label="Confirm new password"
          leftIcon="key"
          leftIconSet="fa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
          autoCapitalize="none"
          error={fieldError || error}
        />

        <TouchableOpacity
          onPress={handleReset}
          style={[styles.resetButton, loading ? styles.disabledButton : null]}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={[styles.resetButtonText, {fontFamily: Fonts.semibold}]}>
              Update password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ResetPasswordScreen;
