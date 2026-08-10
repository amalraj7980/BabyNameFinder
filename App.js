// App.js

import React, {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Navigation from './src/routes/Navigation';
import AppFlashMessage from './src/components/AppFlashMessage';
import {initConnection} from 'react-native-iap';


const App = () => {
  useEffect(() => {
    const initializeIAPConnection = async () => {
      try {
        await initConnection();
        console.log('Successfully initialized IAP connection');
      } catch (err) {
        console.error('Failed to initialize IAP connection', err);
      }
    };

    initializeIAPConnection();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <Navigation />
        <Toast />
        <AppFlashMessage />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
