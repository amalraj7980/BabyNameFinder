// AuthStack.js — CareerMate-style auth screens (headerless; screens own chrome)
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {DesignTokens} from '../theme/designTokens';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import SignInScreen from '../screens/Auth/SignInScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import PasswordResetSuccessScreen from '../screens/Auth/PasswordResetSuccessScreen';
import EmailVerificationScreen from '../screens/Auth/EmailVerificationScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: DesignTokens.colors.background,
        },
      }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen
        name="PasswordResetSuccess"
        component={PasswordResetSuccessScreen}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{gestureEnabled: false}}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
