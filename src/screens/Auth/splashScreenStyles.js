import {StyleSheet, Dimensions} from 'react-native';
import {DesignTokens} from '../../theme/designTokens';
import {Fonts} from '../../styles';

const C = DesignTokens.colors;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IS_NARROW = SCREEN_WIDTH < 360;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  gradient: {
    flex: 1,
  },
  blobCoral: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 107, 107, 0.14)',
  },
  blobBlue: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(94, 194, 215, 0.16)',
  },
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoStage: {
    width: IS_NARROW ? 168 : 188,
    height: IS_NARROW ? 168 : 188,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  glowRingOuter: {
    width: IS_NARROW ? 168 : 188,
    height: IS_NARROW ? 168 : 188,
  },
  glowRingMid: {
    width: IS_NARROW ? 148 : 164,
    height: IS_NARROW ? 148 : 164,
    borderColor: 'rgba(94, 194, 215, 0.4)',
  },
  glowSoft: {
    position: 'absolute',
    width: IS_NARROW ? 130 : 146,
    height: IS_NARROW ? 130 : 146,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 107, 0.16)',
  },
  logoCard: {
    width: IS_NARROW ? 118 : 132,
    height: IS_NARROW ? 118 : 132,
    borderRadius: IS_NARROW ? 28 : 32,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...DesignTokens.shadow.card,
  },
  logoImage: {
    width: IS_NARROW ? 92 : 104,
    height: IS_NARROW ? 92 : 104,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  titleRow: {
    marginTop: IS_NARROW ? 18 : 22,
    alignItems: 'center',
  },
  titleMain: {
    color: C.textPrimary,
    fontFamily: Fonts.extrabold,
    fontSize: IS_NARROW ? 28 : 32,
    lineHeight: IS_NARROW ? 34 : 38,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  titleAccent: {
    color: C.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 10,
    width: IS_NARROW ? 150 : 180,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.primaryMuted,
  },
  headline: {
    marginTop: 16,
    color: C.textPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    color: C.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  features: {
    marginTop: 26,
    width: '100%',
    maxWidth: 340,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.borderSoft,
    gap: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    color: C.textPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  featureHint: {
    color: C.textTertiary,
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
    gap: 10,
  },
  loaderRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: C.primaryMuted,
    borderTopColor: C.primary,
  },
  loadingText: {
    color: C.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
});
