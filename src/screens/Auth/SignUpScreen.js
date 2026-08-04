import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';
import {Colors, Fonts} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import CustomPopup from '../../components/CustomPopup';
import AppInput from '../../components/AppInput';
import {styles} from './signUpScreenStyles';
import {validateRegisterForm} from '../../utils/authValidation';

const SignUpScreen = ({navigation}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const {signUpWithCredentials, clearError, error: authError} =
    useContext(AuthContext);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isErrorPopupVisible, setIsErrorPopupVisible] = useState(false);
  const [signupError, setSignupError] = useState();

  const privacyPolicyUrl =
    'https://riafy.me/wellness/privacy.php?appname=Baby%20Names%20App';
  const TermsAndConditionsUrl =
    'https://riafy.me/wellness/terms.php?apptitle=Baby%20Names%20App';

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
  }, [navigation]);

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

  return (
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
          Create account
        </Text>

        <AppInput
          label="Full name"
          leftIcon="person"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full name"
          autoCapitalize="words"
        />

        <AppInput
          label={locale?.placeholder?.email || 'Email'}
          leftIcon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder={locale?.placeholder?.email || 'Email'}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppInput
          label={locale?.placeholder?.password || 'Password'}
          leftIcon="key"
          leftIconSet="fa"
          value={password}
          onChangeText={setPassword}
          placeholder={locale?.placeholder?.password || 'Password'}
          secureTextEntry
        />

        <AppInput
          label={locale?.placeholder?.confirmPassword || 'Confirm password'}
          leftIcon="key"
          leftIconSet="fa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={
            locale?.placeholder?.confirmPassword || 'Confirm password'
          }
          secureTextEntry
          error={fieldError || authError}
        />

        <TouchableOpacity
          style={[styles.button, loading ? styles.disabledButton : null]}
          onPress={signupHandler}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.buttonText, {fontFamily: Fonts.semibold}]}>
              {locale?.lets_go || 'Create account'}
            </Text>
          )}
        </TouchableOpacity>

        <CustomPopup
          isVisible={isErrorPopupVisible}
          message={signupError}
          title={'Error'}
          style={{width: '90%', height: 200}}
          onClose={() => setIsErrorPopupVisible(false)}
          onCancel={() => setIsErrorPopupVisible(false)}
          cancelText="Cancel"
        />

        <TouchableOpacity
          style={{padding: 24}}
          onPress={() => navigation.navigate('SignIn')}>
          <Text style={[styles.buttonText, {fontFamily: Fonts.medium}]}>
            {locale?.alreadyHaveAnAccount || 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.LinkText, {fontFamily: Fonts.regular}]}>
          {locale?.privacyPolicy || 'By continuing you agree to our '}
          <Text
            onPress={() => Linking.openURL(TermsAndConditionsUrl)}
            style={[
              styles.LinkText,
              {textDecorationLine: 'underline', fontFamily: Fonts.semibold},
            ]}>
            Terms of Service
          </Text>
          <Text> and </Text>
          <Text
            onPress={() => Linking.openURL(privacyPolicyUrl)}
            style={[
              styles.LinkText,
              {textDecorationLine: 'underline', fontFamily: Fonts.semibold},
            ]}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;
