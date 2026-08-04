import {useFocusEffect} from '@react-navigation/native';
import {useContext} from 'react';
import {Alert, BackHandler} from 'react-native';
import {AppContext} from '../context/AppContext';

const useBackExit = () => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  /** This function is used to Exit app when back button press */
  const backAction = () => {
    Alert.alert('', locale?.alert?.exitApp?.description, [
      {
        text: locale?.alert?.exitApp?.bT_cancel,
        onPress: () => null,
        style: 'cancel',
      },
      {
        text: locale?.alert?.exitApp?.bT_exit,
        onPress: () => BackHandler.exitApp(),
      },
    ]);
    return true;
  };

  useFocusEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', backAction);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backAction);
  });
};

export default useBackExit;
