import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import OnboardingPrefsScreen from '../screens/onboarding/OnboardingPrefsScreen';
import OnboardingNameScreen from '../screens/onboarding/OnboardingNameScreen';
import InAppPurchase from '../screens/premium/InAppPurchase';

const Stack = createStackNavigator();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="OnboardingPrefs" component={OnboardingPrefsScreen} />
      <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
      <Stack.Screen name="InAppPurchase" component={InAppPurchase} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;
