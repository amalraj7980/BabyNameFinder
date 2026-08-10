import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {Colors} from '../../styles';
import SafeScreen from '../../components/SafeScreen';
import {styles} from './forgotPasswordScreenStyles';

const PasswordResetSuccessScreen = ({navigation}) => {
  const goToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'SignIn'}],
      }),
    );
  };

  return (
    <SafeScreen backgroundColor={Colors.primary}>
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <Text style={[styles.title, {textAlign: 'center'}]}>Password updated</Text>
        <Text style={[styles.description, {textAlign: 'center'}]}>
          Your password has been changed. Sign in with your new password.
        </Text>
        <TouchableOpacity onPress={goToLogin} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Back to Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
};

export default PasswordResetSuccessScreen;
