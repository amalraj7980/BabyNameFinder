import React, {useEffect, useState} from 'react';
import {AppState, StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Storage} from '../util';
import {AuthContextProvider} from '../context/AuthContext';
import {AppContextProvider} from '../context/AppContext';
import SplashScreen from '../screens/Auth/SplashScreen';
import ForceUpdateScreen from '../screens/appUpdate/ForceUpdateScreen';
import {linkingConfig} from '../components/DeepLinking';
import {NetworkProvider} from '../context/NetworkContext';
import GlobalNetworkNotifier from '../hooks/GlobalNetworkNotifier';
import {navigationRef} from './navigationRef';
import {ThemeProvider, useTheme} from '../theme';
import {
  reapplyUpdateGateOnForeground,
  runStartupAppUpdateCheck,
  useAppUpdateStore,
} from '../services/appUpdate';
import {trackAppOpen} from '../services/rating/ratingService';
import {getOnboardingDone} from '../services/onboardingStorage';
import OnboardingStack from './OnboardingStack';
import MainTabs from './MainTabs';
import AuthStack from './AuthStack';
import {DesignTokens as T} from '../theme/designTokens';

const RootStack = createStackNavigator();
const MIN_SPLASH_DURATION = 5000;

const RouteStack = () => {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [setupFlag, onboardingDone] = await Promise.all([
          Storage.getAppSetUpComplete(),
          getOnboardingDone(),
        ]);
        // New Figma onboarding if neither legacy setup nor v2 onboarding completed
        setNeedsOnboarding(!(setupFlag === 'true' || onboardingDone));
      } catch (e) {
        setNeedsOnboarding(true);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{headerShown: false}}>
      {needsOnboarding ? (
        <RootStack.Screen name="Onboarding" component={OnboardingStack} />
      ) : null}
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="Auth"
        component={AuthStack}
        options={{presentation: 'modal'}}
      />
    </RootStack.Navigator>
  );
};

const ThemedNavigation = () => {
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const {navigationTheme, colors, hydrated} = useTheme();
  const {phase} = useAppUpdateStore();

  useEffect(() => {
    void trackAppOpen();
    void runStartupAppUpdateCheck();
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => setMinSplashElapsed(true),
      MIN_SPLASH_DURATION,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onAppStateChange = next => {
      if (next !== 'active') {
        return;
      }
      void reapplyUpdateGateOnForeground();
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  const updatePending = phase === 'idle' || phase === 'checking';

  if (phase === 'ios_required') {
    return <ForceUpdateScreen />;
  }

  if (!hydrated || !minSplashElapsed || updatePending) {
    return <SplashScreen />;
  }

  const themed = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      primary: T.colors.primary,
      background: T.colors.background,
      card: T.colors.surface,
      text: T.colors.textPrimary,
      border: T.colors.border,
      notification: T.colors.primary,
    },
  };

  return (
    <>
      <StatusBar
        barStyle={colors.statusBarStyle || 'dark-content'}
        backgroundColor={T.colors.background}
      />
      <NavigationContainer
        ref={navigationRef}
        linking={linkingConfig}
        theme={themed}>
        <RouteStack />
      </NavigationContainer>
    </>
  );
};

const Navigation = () => {
  return (
    <NetworkProvider>
      <GlobalNetworkNotifier>
        <ThemeProvider>
          <AuthContextProvider>
            <AppContextProvider>
              <ThemedNavigation />
            </AppContextProvider>
          </AuthContextProvider>
        </ThemeProvider>
      </GlobalNetworkNotifier>
    </NetworkProvider>
  );
};

export default Navigation;
