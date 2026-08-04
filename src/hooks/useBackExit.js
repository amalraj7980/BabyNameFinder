import React, {useCallback, useContext, useState} from 'react';
import {BackHandler} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {AppContext} from '../context/AppContext';
import ConfirmationModal from '../components/ConfirmationModal';

/**
 * CareerMate-style exit-on-back: shows ConfirmationModal instead of Alert.
 * Usage: const {ExitConfirmModal} = useBackExit(); … render <ExitConfirmModal />
 */
const useBackExit = (enabled = true) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
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
    }, [enabled]),
  );

  const ExitConfirmModal = useCallback(
    () => (
      <ConfirmationModal
        visible={visible}
        type="exit"
        title={locale?.alert?.exitApp?.title || 'Exit app?'}
        description={
          locale?.alert?.exitApp?.description ||
          'Are you sure you want to close Baby Names?'
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
    ),
    [visible, locale],
  );

  return {ExitConfirmModal};
};

export default useBackExit;
