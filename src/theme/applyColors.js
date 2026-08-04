import Colors from '../styles/Colors';
import lightColors from '../styles/lightColors';
import darkColors from '../styles/darkColors';

export const applyColors = mode => {
  const palette = mode === 'dark' ? darkColors : lightColors;
  Object.keys(Colors).forEach(key => {
    delete Colors[key];
  });
  Object.assign(Colors, palette);
  return Colors;
};

export const getPalette = mode =>
  mode === 'dark' ? {...darkColors} : {...lightColors};
