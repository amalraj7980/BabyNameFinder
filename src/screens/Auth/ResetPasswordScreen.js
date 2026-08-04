import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Colors} from '../../styles';
import {styles} from './forgotPasswordScreenStyles';
import {
  validatePassword,
  validateConfirmPassword,
} from '../../utils/authValidation';
import {AuthContext} from '../../context/AuthContext';

const ResetPasswordScreen = ({navigation, route}) => {
  const {resetPassword, error, clearError} = React.useContext(AuthContext);
  const oobCode = route?.params?.oobCode ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.description}>
          Choose a strong password for your account.
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          placeholderTextColor={Colors.tintGray}
          style={{...styles.input, color: 'black', backgroundColor: 'white'}}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          placeholderTextColor={Colors.tintGray}
          style={{...styles.input, color: 'black', backgroundColor: 'white'}}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          style={{marginBottom: 12}}>
          <Text style={{color: Colors.primary}}>
            {showPassword ? 'Hide passwords' : 'Show passwords'}
          </Text>
        </TouchableOpacity>

        {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleReset}
          style={[styles.resetButton, loading ? styles.disabledButton : null]}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.resetButtonText}>Update password</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ResetPasswordScreen;
