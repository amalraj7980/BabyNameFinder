import {Platform, StyleSheet} from 'react-native';
import {Fonts} from '../styles';

export const TAB_BAR_CONTENT_HEIGHT = 54;

export function getTabBarStyle(bottomInset = 0) {
  const bottomPad =
    Platform.OS === 'android'
      ? Math.max(bottomInset, 20)
      : Math.max(bottomInset, 10);

  return {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F0E8E2',
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    height: TAB_BAR_CONTENT_HEIGHT + bottomPad,
    paddingBottom: bottomPad,
    paddingTop: 6,
  };
}

export const tabBarLabelStyle = {
  fontFamily: Fonts.semibold,
  fontSize: 11,
  lineHeight: 14,
  marginTop: 2,
  marginBottom: 0,
};
