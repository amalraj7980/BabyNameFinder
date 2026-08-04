// AuthStack.js — CareerMate-style auth screens
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors} from '../styles';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import SignInScreen from '../screens/Auth/SignInScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import PasswordResetSuccessScreen from '../screens/Auth/PasswordResetSuccessScreen';
import EmailVerificationScreen from '../screens/Auth/EmailVerificationScreen';

const Stack = createStackNavigator();

const AuthStack = ({navigation}) => {
  const renderMenuIcon = () => {
    return (
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={{marginLeft: 10}}>
        <Icon name="menu" size={25} color={Colors.WHITE} />
      </TouchableOpacity>
    );
  };

  const headerTitle = title => () =>
    (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
          {title}
        </Text>
      </View>
    );

  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.WHITE,
        headerTitleStyle: {
          fontSize: 18,
        },
      }}>
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{
          headerTitle: headerTitle('Sign in'),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{
          headerTitle: headerTitle('Create an account'),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerTitle: headerTitle('Reset password'),
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          headerTitle: headerTitle('New password'),
        }}
      />
      <Stack.Screen
        name="PasswordResetSuccess"
        component={PasswordResetSuccessScreen}
        options={{
          headerTitle: headerTitle('Success'),
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{
          headerTitle: headerTitle('Verify email'),
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
