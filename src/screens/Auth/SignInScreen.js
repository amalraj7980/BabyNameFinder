import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import {Colors} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Flash} from '../../util';
import {styles} from './signInScreenStyles';

const SignInScreen = ({navigation}) => {
  const {
    locale: {locale, code},
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
  const setLoad = load => {
    setLoading(load);
  };
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  // Regular expression for basic email validation
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPassword = password => password.length >= 6; // Minimum 6 characters for the password

  const handleEmailChange = text => {
    setEmail(text);

    if (!isValidEmail(text)) {
      setEmailError(locale?.error?.emailInvalid);
      setIsButtonDisabled(true);
    } else {
      setEmailError('');
      setIsButtonDisabled(!isValidPassword(password));
    }
  };

  const handlePasswordChange = text => {
    const trimmedPassword = text.trim(); // Remove leading and trailing whitespace
    setPassword(trimmedPassword);

    if (!isValidPassword(trimmedPassword)) {
      setPasswordError(locale?.error?.passcodeInvalid);
      setIsButtonDisabled(true);
    } else {
      setPasswordError('');
      setIsButtonDisabled(!isValidEmail(email));
    }
  };
  useEffect(() => {
    // Listen for navigation events
    const unsubscribe = navigation.addListener('focus', () => {
      // Clear the email field when the screen comes into focus
      setEmail('');
      setEmailError('');
      setPassword('');
      setPasswordError('');
      setIsButtonDisabled(true);
    });

    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, [navigation]);
  // const loginHandler = async () => {
  //     setLoading(true);
  //     console.log("email",email,password)
  //     try {
  //       await loginUserWithCredentials(email, password);
  //       // console.log("res====>",res)

  //       navigation.navigate('BabyNames');

  //     } catch (e) {
  //       // Flash.showError(e);
  //       console.log("error===>",e)
  //       setLoading(false);
  //     }

  // };
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
      console.log('error===>', e);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={[styles.inputContainer, {marginTop: 20}]}>
          <Ionicons
            name="mail"
            size={20}
            color={Colors.tintGray}
            style={styles.icon}
          />
          <TextInput
            style={{
              ...styles.inputs,
              color: 'black',
              backgroundColor: 'white', // Add a background color
            }}
            placeholder={locale?.placeholder.email}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            placeholderTextColor={Colors.tintGray}
          />
        </View>
        <View style={{width: '100%', paddingLeft: 5}}>
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>
        <View style={styles.inputContainer}>
          <Icon
            name="key"
            size={20}
            color={Colors.tintGray}
            style={styles.icon}
          />
          <TextInput
            style={{
              ...styles.inputs,
              color: 'black',
              backgroundColor: 'white', // Add a background color
            }}
            placeholder={locale?.placeholder.password}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor={Colors.tintGray}
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Icon
              name={isPasswordVisible ? 'eye' : 'eye-slash'}
              size={20}
              color={Colors.tintGray}
            />
          </TouchableOpacity>
        </View>
        <View style={{width: '100%', paddingLeft: 5}}>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        </View>

        <TouchableOpacity
          style={{paddingBottom: 20, alignItems: 'flex-end', marginLeft: 130}}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>{locale?.forgotPassword}</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
        style={[styles.button, isButtonDisabled ? styles.disabledButton : null]}
        onPress={loginHandler}
        disabled={isButtonDisabled}>
        <Text style={styles.buttonText}>{locale?.bT_login}</Text>
      </TouchableOpacity> */}
        <TouchableOpacity
          style={[
            styles.button,
            isButtonDisabled || loading ? styles.disabledButton : null,
          ]}
          onPress={loginHandler}
          disabled={isButtonDisabled || loading}>
          {loading ? (
            <ActivityIndicator color="white" /> // Show loader while loading
          ) : (
            <Text style={styles.buttonText}>{locale?.bT_login}</Text>
          )}
        </TouchableOpacity>
        {/* <View style={{ padding: 30 }}>
        <Text style={styles.buttonText}> {locale?.signin_with}</Text>
      </View> */}
        {/* <View style={styles.socialButtons}>
        <TouchableOpacity style={styles.googleButton} onPress={handleGmailLogin}>
          <Image source={require('../../assects/google.png')} style={styles.buttonIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.facebookButton} onPress={handleFacebookLogin}>
          <Image source={require('../../assects/fb.png')} style={styles.buttonIcon} />
        </TouchableOpacity>
      </View> */}
        <TouchableOpacity
          style={{padding: 20}}
          onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.buttonText}>
            {locale?.dontHaveAnAccount || "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};


export default SignInScreen;
