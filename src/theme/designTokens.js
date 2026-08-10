/**
 * Design tokens extracted from Figma / screenshot references.
 * Warm cream surfaces + coral primary (Baby Names for Couples).
 */
export const DesignTokens = {
  colors: {
    primary: '#FF6B6B',
    primarySoft: '#FF8E8E',
    primaryMuted: '#FFD0D0',
    primaryBorder: '#FFB4B4',

    secondary: '#7EC8D8',
    secondarySoft: '#A8E4EF',
    accentMint: '#98D8AA',
    accentYellow: '#F5D76E',
    partnerBlue: '#5EC2D7',

    background: '#FFF8F2',
    backgroundEnd: '#FFEFE4',
    surface: '#FFFFFF',
    surfacePeach: '#FFE8D6',
    surfaceMint: '#E8F6EC',

    textPrimary: '#2C3340',
    textSecondary: '#8B95A5',
    textTertiary: '#A8B0BD',
    textOnPrimary: '#FFFFFF',

    border: '#E6ECF3',
    borderSoft: '#F0E8E2',
    divider: '#EEF1F5',

    success: '#34C759',
    successSoft: 'rgba(52, 199, 89, 0.12)',
    error: '#FF3B30',
    warning: '#FF9F0A',

    likeOverlay: '#34C759',
    passOverlay: '#FF6B6B',

    chipInactiveBg: '#FFFFFF',
    chipInactiveBorder: '#DCE3EC',
    chipSelectedMint: '#98D8AA',
    chipLocked: '#C5CCD6',

    tabInactive: '#9AA3AF',
    progressTrack: '#E8EEF5',

    headerBg: '#FF6B6B',
    Boy: '#5EC2D7',
    Girl: '#FF6B6B',
    unisex: '#8FCB9B',
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    xl: 28,
    pill: 999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  shadow: {
    card: {
      shadowColor: '#2D3436',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    soft: {
      shadowColor: '#2D3436',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
  },
  typography: {
    hero: {fontSize: 32, lineHeight: 38, fontWeight: '700'},
    title: {fontSize: 26, lineHeight: 32, fontWeight: '700'},
    titleSm: {fontSize: 22, lineHeight: 28, fontWeight: '700'},
    body: {fontSize: 15, lineHeight: 22, fontWeight: '400'},
    bodySm: {fontSize: 13, lineHeight: 18, fontWeight: '400'},
    label: {fontSize: 14, lineHeight: 18, fontWeight: '600'},
    button: {fontSize: 16, lineHeight: 20, fontWeight: '700'},
    caption: {fontSize: 12, lineHeight: 16, fontWeight: '500'},
  },
};

export default DesignTokens;
