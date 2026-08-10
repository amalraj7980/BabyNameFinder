import React, {useEffect, useState} from 'react';
import {AppState, StatusBar} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import LandingScreen from '../screens/Auth/LandingScreen';
import AppStack from './AppStack';
import AuthStack from './AuthStack';
import CustomDrawerContent from '../routes/CustomDrawer/CustomDrawerContent';
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

const Drawer = createDrawerNavigator();

/** Same as CareerMate AuthNavigationBridge — minimum splash on launch. */
const MIN_SPLASH_DURATION = 5000;

const RouteStack = () => {
  const [appSetupComplete, setAppSetupComplete] = useState(false);
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    checkAppSetup();
  }, []);

  const checkAppSetup = async () => {
    try {
      setIsloading(true);
      const appSetupFlag = await Storage.getAppSetUpComplete();
      setAppSetupComplete(appSetupFlag === 'true');
      setIsloading(false);
    } catch (error) {
      console.log('Error checking app setup:', error);
      setIsloading(false);
    }
  };

  const handleStart = async () => {
    try {
      await Storage.setAppSetUpComplete('true');
      setAppSetupComplete(true);
    } catch (error) {
      console.log('Error setting app setup flag:', error);
    }
  };

  return (
    <>
      {isLoading ? (
        <SplashScreen />
      ) : (
        <Drawer.Navigator
          screenOptions={{headerShown: false}}
          drawerContent={props => (
            <CustomDrawerContent {...props} contentContainerStyle={{flex: 1}} />
          )}>
          {appSetupComplete ? (
            <>
              <Drawer.Screen name="Home" component={AppStack} />
              <Drawer.Screen name="Auth" component={AuthStack} />
            </>
          ) : (
            <Drawer.Screen
              name="LandingScreen"
              options={{swipeEnabled: false, headerShown: false}}>
              {props => <LandingScreen {...props} handleStart={handleStart} />}
            </Drawer.Screen>
          )}
        </Drawer.Navigator>
      )}
    </>
  );
};

/**
 * CareerMate-style update gate bridge:
 * - startup Firestore / Play check
 * - hold splash until check done + min 5s
 * - ForceUpdate UI when required
 * - foreground recheck after store / recents
 */
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

  // After "Close the app" / recents / return from store — same as CareerMate.
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

  return (
    <>
      <StatusBar
        barStyle={colors.statusBarStyle || 'dark-content'}
        backgroundColor={colors.headerBg || colors.primary}
        translucent={false}
      />
      <NavigationContainer
        ref={navigationRef}
        linking={linkingConfig}
        theme={navigationTheme}>
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
