import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Easing, Platform} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Fonts} from '../styles';
import {DesignTokens as T} from '../theme/designTokens';

const C = T.colors;

const softShadow = Platform.select({
  ios: {
    shadowColor: '#2D3436',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.1,
    shadowRadius: 22,
  },
  android: {elevation: 6},
});

/**
 * Shared animated loader for Discover / Filter apply transitions.
 */
export const NamesLoadingState = ({message = 'Finding names…'}) => {
  const appear = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const dot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    appear.setValue(0);
    Animated.spring(appear, {
      toValue: 1,
      friction: 7,
      tension: 52,
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const dotLoop = Animated.loop(
      Animated.timing(dot, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    spinLoop.start();
    dotLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      dotLoop.stop();
    };
  }, [appear, pulse, spin, dot, message]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.15],
  });
  const iconScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const appearScale = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const title = (message || 'Finding names…').replace(/\s*(\.\.\.|…)\s*$/, '');

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: appear,
          transform: [{scale: appearScale}],
        },
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message}>
      <View style={styles.iconWrap}>
        <Animated.View
          style={[
            styles.pulseRing,
            {opacity: ringOpacity, transform: [{scale: ringScale}]},
          ]}
        />
        <Animated.View style={[styles.orbit, {transform: [{rotate}]}]}>
          <View style={styles.orbitDot} />
        </Animated.View>
        <Animated.View
          style={[styles.iconInner, {transform: [{scale: iconScale}]}]}>
          <Ionicons name="sparkles" size={30} color={C.primary} />
        </Animated.View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(index => {
          const opacity = dot.interpolate({
            inputRange: [0, 0.2 + index * 0.2, 0.45 + index * 0.2, 1],
            outputRange: [0.25, 1, 0.25, 0.25],
          });
          return (
            <Animated.View
              key={`dot-${index}`}
              style={[styles.dot, {opacity}]}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  iconWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primaryMuted,
  },
  orbit: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(193,123,116,0.28)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  orbitDot: {
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193,123,116,0.22)',
    ...softShadow,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: C.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
});

export default NamesLoadingState;
