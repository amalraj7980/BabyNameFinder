import React from 'react';
import {Platform, StatusBar} from 'react-native';
import FlashMessage from 'react-native-flash-message';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * Top flash banner inset below status bar / notch so messages are not cropped.
 */
const AppFlashMessage = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  );

  return (
    <FlashMessage
      position="top"
      floating
      statusBarHeight={statusBarHeight}
    />
  );
};

export default AppFlashMessage;
