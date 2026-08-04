import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';
import {Colors} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomPopup from '../../components/CustomPopup';
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
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
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
        <View style={[styles.inputContainer, {marginTop: 20}]}>
          <Ionicons
            name="person"
            size={20}
            color={Colors.tintGray}
            style={styles.icon}
          />
          <TextInput
            style={{...styles.inputs, color: 'black', backgroundColor: 'white'}}
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor={Colors.tintGray}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail"
            size={20}
            color={Colors.tintGray}
            style={styles.icon}
          />
          <TextInput
            style={{...styles.inputs, color: 'black', backgroundColor: 'white'}}
            placeholder={locale?.placeholder?.email || 'Email'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.tintGray}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon
            name="key"
            size={20}
            color={Colors.tintGray}
            style={styles.icon}
          />
          <TextInput
            style={{...styles.inputs, color: 'black', backgroundColor: 'white'}}
            placeholder={locale?.placeholder?.password || 'Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor={Colors.tintGray}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(v => !v)}>
            <Icon
              name={isPasswordVisible ? 'eye' : 'eye-slash'}
              size={20}
              color={Colors.tintGray}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Icon
            name="key"
            size={20}
            color={Colors.tintGray}
            style={styles.icon}
          />
          <TextInput
            style={[styles.inputs, {color: 'black'}]}
            placeholder={
              locale?.placeholder?.confirmPassword || 'Confirm password'
            }
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!isConfirmPasswordVisible}
            placeholderTextColor={Colors.tintGray}
          />
          <TouchableOpacity
            onPress={() => setConfirmPasswordVisible(v => !v)}>
            <Icon
              name={isConfirmPasswordVisible ? 'eye' : 'eye-slash'}
              size={20}
              color={Colors.tintGray}
            />
          </TouchableOpacity>
        </View>

        {fieldError ? (
          <View style={{width: '100%', paddingLeft: 5}}>
            <Text style={styles.errorText}>{fieldError}</Text>
          </View>
        ) : null}
        {authError ? (
          <View style={{width: '100%', paddingLeft: 5}}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading ? styles.disabledButton : null]}
          onPress={signupHandler}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
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
          style={{padding: 30}}
          onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.buttonText}>
            {locale?.alreadyHaveAnAccount || 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <View style={{padding: 0}}>
          <Text style={styles.LinkText}>
            {locale?.privacyPolicy || 'By continuing you agree to our '}
            <Text
              onPress={() => Linking.openURL(TermsAndConditionsUrl)}
              style={[
                styles.LinkText,
                {textDecorationLine: 'underline', fontWeight: 'bold'},
              ]}>
              Terms of Service
            </Text>
            <Text> and </Text>
            <Text
              onPress={() => Linking.openURL(privacyPolicyUrl)}
              style={[
                styles.LinkText,
                {textDecorationLine: 'underline', fontWeight: 'bold'},
              ]}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;
