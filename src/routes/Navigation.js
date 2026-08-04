import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StatusBar} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
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
import {linkingConfig} from '../components/DeepLinking';
import {NetworkProvider} from '../context/NetworkContext';
import GlobalNetworkNotifier from '../hooks/GlobalNetworkNotifier';
import {navigationRef} from './navigationRef';
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const RouteStack = () => {
  const [appSetupComplete, setAppSetupComplete] = useState(false);
  const [isSetupCheckComplete, setSetupCheckComplete] = useState(false); // New state
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
              options={{gestureEnabled: false}}>
              {props => <LandingScreen {...props} handleStart={handleStart} />}
            </Drawer.Screen>
          )}
        </Drawer.Navigator>
      )}
    </>
  );
};

const Navigation = () => {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setAppLoaded(true);
    }, 2000);
  }, []);

  return (
    <>
      <NetworkProvider>
        <GlobalNetworkNotifier>
          <AuthContextProvider>
            <AppContextProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#fff" />
              <NavigationContainer ref={navigationRef} linking={linkingConfig}>
                {appLoaded ? <RouteStack /> : <SplashScreen />}
              </NavigationContainer>
            </AppContextProvider>
          </AuthContextProvider>
        </GlobalNetworkNotifier>
      </NetworkProvider>
    </>
  );
};

export default Navigation;
