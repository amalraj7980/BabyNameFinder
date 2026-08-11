import {Platform, StyleSheet} from 'react-native';
import {Fonts} from '../styles';

/** Icon + label row only (safe-area padding added separately). */
export const TAB_BAR_CONTENT_HEIGHT = 46;

export function getTabBarStyle(bottomInset = 0) {
  // Use real inset; keep a small floor for devices with no gesture inset.
  const bottomPad =
    Platform.OS === 'android'
      ? Math.max(bottomInset, 8)
      : Math.max(bottomInset, 6);

  return {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F0E8E2',
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 6,
    height: TAB_BAR_CONTENT_HEIGHT + bottomPad,
    paddingBottom: bottomPad,
    paddingTop: 4,
  };
}

export const tabBarLabelStyle = {
  fontFamily: Fonts.semibold,
  fontSize: 10,
  lineHeight: 12,
  marginTop: 0,
  marginBottom: 0,
};
