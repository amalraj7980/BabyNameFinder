import React, {useCallback, useContext, useState} from 'react';
import {BackHandler} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import ConfirmationModal from '../components/ConfirmationModal';
import {AppContext} from '../context/AppContext';
import {useIsTabRootScreen} from '../hooks/useIsTabRootScreen';

/**
 * CareerMate TabExitOnBackHandler —
 * Android back on a tab root → "Do you want to exit?" confirm.
 */
export const TabExitOnBackHandler = () => {
  const isTabRoot = useIsTabRootScreen();
  const {
    locale: {locale},
  } = useContext(AppContext);
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isTabRoot) {
        return undefined;
      }

      const onBackPress = () => {
        setVisible(true);
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        if (typeof sub?.remove === 'function') {
          sub.remove();
        } else {
          BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }
      };
    }, [isTabRoot]),
  );

  return (
    <ConfirmationModal
      visible={visible}
      type="exit"
      title={locale?.alert?.exitApp?.title || 'Do you want to exit?'}
      description={
        locale?.alert?.exitApp?.description ||
        'Are you sure you want to close Baby Names Together?'
      }
      secondaryText={locale?.alert?.exitApp?.bT_cancel || 'Cancel'}
      primaryText={locale?.alert?.exitApp?.bT_exit || 'Exit'}
      onSecondary={() => setVisible(false)}
      onClose={() => setVisible(false)}
      onPrimary={() => {
        setVisible(false);
        BackHandler.exitApp();
      }}
    />
  );
};

export default TabExitOnBackHandler;
