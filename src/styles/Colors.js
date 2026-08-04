import lightColors from './lightColors';

/**
 * Mutable shared palette — ThemeContext Object.assigns light/dark into this.
 * Prefer useTheme().colors in new screens; existing Screens reading Colors.x
 * at render time pick up the active mode after theme hydrate / toggle + restart.
 */
const Colors = {...lightColors};

export default Colors;
