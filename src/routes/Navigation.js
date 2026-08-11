import React, {useContext, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Storage} from '../util';
import {AuthContext, AuthContextProvider} from '../context/AuthContext';
import {AppContextProvider} from '../context/AppContext';
import SplashScreen from '../screens/Auth/SplashScreen';
import ForceUpdateScreen from '../screens/appUpdate/ForceUpdateScreen';
import InAppUpdateReadyModal from '../screens/appUpdate/InAppUpdateReadyModal';
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
import AppStatusBar from '../components/AppStatusBar';

const RootStack = createStackNavigator();
const MIN_SPLASH_DURATION = 5000;

const RouteStack = () => {
  const {authStateLoading, isUserLoggedin} = useContext(AuthContext);
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    if (authStateLoading) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [setupFlag, onboardingDone] = await Promise.all([
          Storage.getAppSetUpComplete(),
          getOnboardingDone(),
        ]);
        // Skip Welcome when onboarding done, legacy setup done, or already logged in.
        const skip =
          setupFlag === 'true' || onboardingDone || !!isUserLoggedin;
        if (mounted) {
          setNeedsOnboarding(!skip);
        }
      } catch (e) {
        if (mounted) {
          setNeedsOnboarding(!isUserLoggedin);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authStateLoading, isUserLoggedin]);

  if (!ready || authStateLoading) {
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
  const {navigationTheme, hydrated} = useTheme();
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
        void (async () => {
          try {
            const {flushPendingReactions} = require('../services/reactionBatch.service');
            await flushPendingReactions({force: true});
          } catch (e) {
            // ignore
          }
        })();
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
      <AppStatusBar />
      <NavigationContainer
        ref={navigationRef}
        linking={linkingConfig}
        theme={themed}>
        <RouteStack />
      </NavigationContainer>
      <InAppUpdateReadyModal />
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
