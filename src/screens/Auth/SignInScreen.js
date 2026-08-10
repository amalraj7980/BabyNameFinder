import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Colors, Fonts} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {Flash} from '../../util';
import AppInput from '../../components/AppInput';
import SafeScreen from '../../components/SafeScreen';
import {styles} from './signInScreenStyles';

const SignInScreen = ({navigation}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const {
    loginUserWithCredentials,
    clearError,
    error: authError,
  } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPassword = value => value.length >= 6;

  const handleEmailChange = text => {
    setEmail(text);
    if (!isValidEmail(text)) {
      setEmailError(locale?.error?.emailInvalid || 'Invalid email');
      setIsButtonDisabled(true);
    } else {
      setEmailError('');
      setIsButtonDisabled(!isValidPassword(password));
    }
  };

  const handlePasswordChange = text => {
    const trimmed = text.trim();
    setPassword(trimmed);
    if (!isValidPassword(trimmed)) {
      setPasswordError(locale?.error?.passcodeInvalid || 'Invalid password');
      setIsButtonDisabled(true);
    } else {
      setPasswordError('');
      setIsButtonDisabled(!isValidEmail(email));
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setEmail('');
      setEmailError('');
      setPassword('');
      setPasswordError('');
      setIsButtonDisabled(true);
      clearError?.();
    });
    return unsubscribe;
  }, [navigation]);

  const loginHandler = async () => {
    clearError?.();
    setLoading(true);
    try {
      const session = await loginUserWithCredentials(email, password);
      setLoading(false);
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
      navigation.getParent()?.navigate('Home');
    } catch (e) {
      setLoading(false);
      Flash.showError(typeof e === 'string' ? e : e?.message || 'Login failed');
    }
  };

  return (
    <SafeScreen backgroundColor={Colors.primary}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 22,
              color: Colors.WHITE,
              alignSelf: 'flex-start',
              marginTop: 12,
              marginBottom: 8,
            }}>
            {locale?.bT_login || 'Sign in'}
          </Text>

          <AppInput
            label={locale?.placeholder?.email || 'Email'}
            leftIcon="mail"
            value={email}
            onChangeText={handleEmailChange}
            placeholder={locale?.placeholder?.email || 'Email'}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <AppInput
            label={locale?.placeholder?.password || 'Password'}
            leftIcon="key"
            leftIconSet="fa"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder={locale?.placeholder?.password || 'Password'}
            secureTextEntry
            error={passwordError || authError}
          />

          <TouchableOpacity
            style={{paddingBottom: 16, alignSelf: 'flex-end'}}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotText, {fontFamily: Fonts.semibold}]}>
              {locale?.forgotPassword || 'Forgot password?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              isButtonDisabled || loading ? styles.disabledButton : null,
            ]}
            onPress={loginHandler}
            disabled={isButtonDisabled || loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, {fontFamily: Fonts.semibold}]}>
                {locale?.bT_login || 'Sign in'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{padding: 20}}
            onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.buttonText, {fontFamily: Fonts.medium}]}>
              {locale?.dontHaveAnAccount || "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeScreen>
  );
};

export default SignInScreen;
