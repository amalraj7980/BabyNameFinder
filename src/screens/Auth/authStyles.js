import {StyleSheet} from 'react-native';
import {DesignTokens} from '../../theme/designTokens';
import {Fonts} from '../../styles';

const C = DesignTokens.colors;

export const AUTH_BG = C.background;
export const AUTH_BG_END = C.backgroundEnd;

export const authStyles = StyleSheet.create({
  flex: {flex: 1},
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  blobCoral: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  blobBlue: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(94, 194, 215, 0.14)',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  scrollContentCompact: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  scrollContentWithBack: {
    paddingTop: 0,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
    zIndex: 2,
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  brandWrapCompact: {
    marginBottom: 10,
    marginTop: 0,
  },
  brandLogoCard: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadow.card,
  },
  brandLogoCardCompact: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  brandLogo: {
    width: 64,
    height: 64,
  },
  brandLogoCompact: {
    width: 42,
    height: 42,
  },
  brandTitle: {
    marginTop: 14,
    color: C.textPrimary,
    fontFamily: Fonts.extrabold,
    fontSize: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  brandTitleCompact: {
    marginTop: 8,
    fontSize: 18,
  },
  brandAccent: {
    color: C.primary,
  },
  brandTag: {
    marginTop: 6,
    color: C.textSecondary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroBlock: {
    marginBottom: 18,
  },
  heroBlockCompact: {
    marginBottom: 10,
    alignItems: 'center',
  },
  heroTitle: {
    color: C.textPrimary,
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  heroTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 2,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: C.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  heroSubtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: DesignTokens.radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...DesignTokens.shadow.soft,
  },
  cardCompact: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
  },
  forgotLinkRow: {
    alignSelf: 'flex-end',
    marginTop: 0,
    marginBottom: 8,
    paddingVertical: 2,
  },
  forgotLink: {
    color: C.primary,
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  formError: {
    color: C.error,
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginBottom: 8,
  },
  formSuccess: {
    color: C.success,
    fontFamily: Fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: C.textOnPrimary,
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },
  socialDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139, 149, 165, 0.35)',
  },
  socialDividerText: {
    color: C.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
    ...DesignTokens.shadow.soft,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: C.textPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  footerPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    color: C.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  footerLink: {
    color: C.primary,
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  legalText: {
    marginTop: 12,
    color: C.textTertiary,
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalLink: {
    color: C.textSecondary,
    fontFamily: Fonts.semibold,
    textDecorationLine: 'underline',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  backButtonCompact: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  backButtonText: {
    color: C.textSecondary,
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  successIconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surfaceMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inputCompact: {
    marginBottom: 10,
  },
});
