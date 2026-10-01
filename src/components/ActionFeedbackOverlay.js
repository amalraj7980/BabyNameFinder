import React from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {Fonts} from '../styles';
import {DesignTokens as T} from '../theme/designTokens';

/** Soft LIKE/PASS color wash shown when those buttons are pressed. */
export function ActionFeedbackOverlay({opacity, mode}) {
  if (!mode) {
    return null;
  }
  const isLike = mode === 'like';
  return (
    <Animated.View pointerEvents="none" style={[styles.root, {opacity}]}>
      <View
        style={[
          styles.wash,
          {backgroundColor: isLike ? T.colors.success : T.colors.primary},
        ]}
      />
      <View
        style={[
          styles.stamp,
          {backgroundColor: isLike ? T.colors.success : T.colors.primary},
        ]}>
        <Text style={styles.stampText}>{isLike ? 'LIKE' : 'PASS'}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  stamp: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  stampText: {
    color: T.colors.surface,
    fontFamily: Fonts.bold,
    fontSize: 22,
    letterSpacing: 0.6,
  },
});
