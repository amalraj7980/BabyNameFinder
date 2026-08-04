import {Dimensions, StyleSheet} from 'react-native';

import {Colors, Fonts} from '../../styles';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

export const FORCE_UPDATE_ROCKET = require('../../assects/force-update-rocket.png');
export const APP_LOGO = require('../../assects/Splash.png');

const HERO_SKY = '#EAF6FF';
const HORIZONTAL_PADDING = 24;

/**
 * Same Figma order as CareerMate:
 * 1) Rocket fully visible on top
 * 2) White area: logo → title → description → buttons
 */
export const forceUpdateScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  hero: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: HERO_SKY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  whiteSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 6,
    alignItems: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 0,
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  title: {
    textAlign: 'center',
    color: '#111111',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    color: '#777777',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    fontFamily: Fonts.regular,
    width: '100%',
    paddingHorizontal: 4,
  },
  spacer: {
    flex: 1,
    minHeight: 12,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  primaryButton: {
    width: '100%',
    marginTop: 0,
    borderRadius: 18,
    minHeight: 56,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    minHeight: 56,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semibold,
    marginRight: 8,
  },
  secondaryButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
});
