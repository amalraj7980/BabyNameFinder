import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import {Fonts} from '../../styles';

const C = {
  primary: '#FF6B6B',
  text: '#2C3340',
  muted: '#8B95A5',
  surface: '#FFFFFF',
};

/**
 * In-screen blocker while Google / Gmail sign-in completes.
 * Uses a View (not Modal) so the native Google account picker stays on top.
 */
const AuthGoogleLoadingOverlay = ({
  visible,
  message = 'Signing in with Google…',
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={styles.backdrop}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityRole="progressbar"
      accessibilityLabel={message}>
      <View style={styles.card}>
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
        <Text style={styles.title}>Please wait</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: 'rgba(44, 51, 64, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: C.surface,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2D3436',
        shadowOffset: {width: 0, height: 12},
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {elevation: 10},
    }),
  },
  spinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: C.text,
    marginBottom: 6,
  },
  message: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AuthGoogleLoadingOverlay;
