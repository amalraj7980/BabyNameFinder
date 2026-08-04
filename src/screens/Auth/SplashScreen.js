// SplashScreen.js
import React, {useContext, useEffect} from 'react';
import {
  View,
  Image
} from 'react-native';
import {Colors} from '../../styles';
import {AuthContext} from '../../context/AuthContext';
import {styles} from './splashScreenStyles';


const SplashScreen = () => {
  const {checkAuthState} = useContext(AuthContext);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    checkAuthState();
  };
  return (
    <View style={styles.container}>
      <Image source={require('../../assects/Splash.png')} style={styles.image} />
    </View>
  );
};


export default SplashScreen;
