import React, {useEffect} from 'react';
import {Platform, StatusBar} from 'react-native';
import {DesignTokens as T} from '../theme/designTokens';

/**
 * Apply Discover-cream status bar (dark icons over cream UI).
 * Call on app start and whenever a main screen gains focus.
 */
export const applyAppStatusBar = (barStyle = 'dark-content') => {
  StatusBar.setHidden(false);
  StatusBar.setBarStyle(barStyle, true);
  if (Platform.OS === 'android') {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent', true);
  } else {
    StatusBar.setBackgroundColor(T.colors.background);
  }
};

/**
 * App-wide status bar matching Discover cream background.
 * Translucent so system icons always remain visible over cream screens.
 */
const AppStatusBar = ({
  backgroundColor = T.colors.background,
  barStyle = 'dark-content',
}) => {
  useEffect(() => {
    applyAppStatusBar(barStyle);
  }, [barStyle, backgroundColor]);

  return (
    <StatusBar
      animated
      hidden={false}
      translucent={Platform.OS === 'android'}
      backgroundColor={
        Platform.OS === 'android' ? 'transparent' : backgroundColor
      }
      barStyle={barStyle}
    />
  );
};

export default AppStatusBar;
