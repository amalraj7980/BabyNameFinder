import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {StatusBar, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import RNRestart from 'react-native-restart';

import {applyColors, getPalette} from './applyColors';

const STORAGE_KEY = '@babynames/theme_mode';

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  colors: getPalette('light'),
  navigationTheme: NavigationDefaultTheme,
  setDarkModeEnabled: () => {},
  hydrated: false,
});

export const ThemeProvider = ({children}) => {
  const [mode, setMode] = useState('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const next = stored === 'dark' ? 'dark' : 'light';
        if (mounted) {
          applyColors(next);
          setMode(next);
        }
      } catch (e) {
        applyColors('light');
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const palette = applyColors(mode);
    // Discover cream theme — keep icons visible on Android 15+ (edge-to-edge)
    StatusBar.setHidden(false);
    StatusBar.setBarStyle(palette.statusBarStyle || 'dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent', true);
    } else {
      StatusBar.setBackgroundColor(
        palette.background || palette.statusBarBg || '#FFF8F2',
      );
    }
  }, [mode, hydrated]);

  const setDarkModeEnabled = useCallback(async enabled => {
    const next = enabled ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // ignore
    }
    applyColors(next);
    setMode(next);
    // Remount StyleSheet-based screens with the new palette
    try {
      RNRestart.Restart();
    } catch (e) {
      // restart optional in some builds
    }
  }, []);

  const colors = useMemo(() => getPalette(mode), [mode]);

  const navigationTheme = useMemo(() => {
    const base = mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
    return {
      ...base,
      dark: mode === 'dark',
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card || colors.surface,
        text: colors.textGray,
        border: colors.border || colors.lightGray,
        notification: colors.errorRed,
      },
    };
  }, [mode, colors]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors,
      navigationTheme,
      setDarkModeEnabled,
      hydrated,
    }),
    [mode, colors, navigationTheme, setDarkModeEnabled, hydrated],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
