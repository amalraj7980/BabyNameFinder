/**
 * Global color pattern — one source for the whole app.
 * Dusty rose + cream, matching share.html / legal web pages.
 * Change values here to update every screen.
 *
 * To restore the previous coral palette, comment the active Palette
 * and uncomment the OLD PALETTE block below.
 */
export const Palette = {
  rose: '#C17B74',
  roseDeep: '#B56C66',
  roseSoft: '#E8C4BE',
  roseMuted: '#F6E8E4',
  roseFill: 'rgba(193, 123, 116, 0.12)',
  cream: '#F7EFE8',
  creamEnd: '#F4E6DC',
  paper: '#FFFBF8',
  white: '#FFFFFF',
  ink: '#3A2E2A',
  muted: '#7A6B66',
  mutedSoft: '#C4A39D',
  gold: '#D7B37A',
  border: '#F1E4DF',
  borderSoft: '#F0E8E2',
  boy: '#5EC2D7',
  boySoft: '#A8E4EF',
  mint: '#98D8AA',
  unisex: '#8FCB9B',
  success: '#34C759',
  error: '#FF3B30',
};

/* OLD PALETTE (coral / Figma) — kept for restore, not used. */
 
//  export const Palette = {
//   rose: '#FF6B6B',
//   roseDeep: '#E85A5A',
//   roseSoft: '#FF8E8E',
//   roseMuted: '#FFD0D0',
//   roseFill: 'rgba(255, 107, 107, 0.12)',
//   cream: '#FFF8F2',
//   creamEnd: '#FFEFE4',
//   paper: '#FFE8D6',
//   white: '#FFFFFF',
//   ink: '#2C3340',
//   muted: '#8B95A5',
//   mutedSoft: '#A8B0BD',
//   gold: '#F5D76E',
//   border: '#E6ECF3',
//   borderSoft: '#F0E8E2',
//   boy: '#5EC2D7',
//   boySoft: '#A8E4EF',
//   mint: '#98D8AA',
//   unisex: '#8FCB9B',
//   success: '#34C759',
//   error: '#FF3B30',
// };

export const DesignTokens = {
  colors: {
    primary: Palette.rose,
    primarySoft: Palette.roseSoft,
    primaryMuted: Palette.roseMuted,
    primaryBorder: Palette.roseSoft,
    primaryFill: Palette.roseFill,
    headerBg: Palette.rose,

    secondary: Palette.boy,
    secondarySoft: Palette.boySoft,
    accentMint: Palette.mint,
    accentYellow: Palette.gold,
    partnerBlue: Palette.boy,
    gold: Palette.gold,

    background: Palette.cream,
    backgroundEnd: Palette.creamEnd,
    surface: Palette.white,
    surfacePeach: Palette.paper,
    surfaceMint: '#E8F6EC',

    textPrimary: Palette.ink,
    textSecondary: Palette.muted,
    textTertiary: Palette.mutedSoft,
    textOnPrimary: Palette.white,

    border: Palette.border,
    borderSoft: Palette.borderSoft,
    divider: '#EEF1F5',

    success: Palette.success,
    successSoft: 'rgba(52, 199, 89, 0.12)',
    error: Palette.error,
    warning: Palette.gold,

    likeOverlay: Palette.success,
    passOverlay: Palette.rose,

    chipInactiveBg: Palette.white,
    chipInactiveBorder: Palette.roseSoft,
    chipSelectedMint: Palette.mint,
    chipLocked: '#C5CCD6',

    tabInactive: Palette.mutedSoft,
    progressTrack: Palette.roseMuted,

    Boy: Palette.boy,
    Girl: Palette.rose,
    unisex: Palette.unisex,

    // Screen aliases so local `const C = T.colors` works everywhere
    text: Palette.ink,
    textMuted: Palette.muted,
    textHint: Palette.mutedSoft,
    muted: Palette.muted,
    bg: Palette.cream,
    bgTop: Palette.cream,
    bgBottom: Palette.creamEnd,
    bgEnd: Palette.creamEnd,
    boy: Palette.boy,
    girl: Palette.rose,
    mint: Palette.mint,
    blue: Palette.boy,
    chipBorder: Palette.roseSoft,
    inputBg: Palette.paper,
    soft: Palette.roseFill,
    genderIdle: '#EAF1F7',
    genderIdleText: '#5C7A94',
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
      shadowColor: Palette.ink,
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    soft: {
      shadowColor: Palette.ink,
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
