import React, {useContext, useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StatusBar,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../../context/AuthContext';
import {DesignTokens} from '../../theme/designTokens';
import {AUTH_BG, AUTH_BG_END} from './authStyles';
import {styles} from './splashScreenStyles';

const APP_LOGO = require('../../assects/App Icon 1024x1024.png');
const C = DesignTokens.colors;

const FEATURES_META = [
  {
    icon: 'heart',
    label: 'Swipe names you love',
    hint: 'Discover',
    iconBg: 'rgba(255, 107, 107, 0.16)',
    iconColor: C.primary,
  },
  {
    icon: 'people',
    label: 'Match with your partner',
    hint: 'Together',
    iconBg: 'rgba(94, 194, 215, 0.18)',
    iconColor: C.Boy,
  },
  {
    icon: 'star',
    label: 'Save favorites together',
    hint: 'Shared list',
    iconBg: 'rgba(245, 215, 110, 0.28)',
    iconColor: '#D4A017',
  },
];

const SplashFeatureRow = ({items}) => (
  <View style={styles.features}>
    {items.map(item => (
      <Animated.View
        key={item.label}
        style={[
          styles.featureRow,
          {
            opacity: item.opacity,
            transform: [{translateX: item.translateX}, {scale: item.scale}],
          },
        ]}>
        <View style={[styles.featureIconWrap, {backgroundColor: item.iconBg}]}>
          <Ionicons name={item.icon} size={18} color={item.iconColor} />
        </View>
        <Text style={styles.featureLabel}>{item.label}</Text>
        <Text style={styles.featureHint}>{item.hint}</Text>
      </Animated.View>
    ))}
  </View>
);

const SplashScreen = () => {
  const {checkAuthState} = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const glowPulse2 = useRef(new Animated.Value(0)).current;
  const softGlow = useRef(new Animated.Value(0.45)).current;
  const shimmerX = useRef(new Animated.Value(-60)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const spinnerRotate = useRef(new Animated.Value(0)).current;

  const featureOpacity0 = useRef(new Animated.Value(0)).current;
  const featureOpacity1 = useRef(new Animated.Value(0)).current;
  const featureOpacity2 = useRef(new Animated.Value(0)).current;
  const featureX0 = useRef(new Animated.Value(24)).current;
  const featureX1 = useRef(new Animated.Value(24)).current;
  const featureX2 = useRef(new Animated.Value(24)).current;
  const featureScale0 = useRef(new Animated.Value(0.94)).current;
  const featureScale1 = useRef(new Animated.Value(0.94)).current;
  const featureScale2 = useRef(new Animated.Value(0.94)).current;

  const features = useMemo(
    () =>
      FEATURES_META.map((meta, i) => ({
        ...meta,
        opacity: [featureOpacity0, featureOpacity1, featureOpacity2][i],
        translateX: [featureX0, featureX1, featureX2][i],
        scale: [featureScale0, featureScale1, featureScale2][i],
      })),
    [
      featureOpacity0,
      featureOpacity1,
      featureOpacity2,
      featureScale0,
      featureScale1,
      featureScale2,
      featureX0,
      featureX1,
      featureX2,
    ],
  );

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(AUTH_BG);
    }
  }, []);

  useEffect(() => {
    checkAuthState?.();
  }, [checkAuthState]);

  useEffect(() => {
    const featureIn = (opacity, x, scale, delay) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: 0,
          duration: 420,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          delay,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]);

    const entrance = Animated.sequence([
      // Icon pops in with highlight
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 580,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 64,
          useNativeDriver: true,
        }),
        Animated.timing(softGlow, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Brand title
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 440,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        featureIn(featureOpacity0, featureX0, featureScale0, 0),
        featureIn(featureOpacity1, featureX1, featureScale1, 90),
        featureIn(featureOpacity2, featureX2, featureScale2, 180),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    // Expanding highlight rings around the icon
    const ringPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const ringPulse2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(glowPulse2, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    // Light sweep across logo card
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: 160,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1600),
        Animated.timing(shimmerX, {
          toValue: -60,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const heart = Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.25,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const spin = Animated.loop(
      Animated.timing(spinnerRotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    entrance.start(({finished}) => {
      if (finished) {
        float.start();
        ringPulse.start();
        ringPulse2.start();
        shimmer.start();
        heart.start();
        spin.start();
      }
    });

    return () => {
      entrance.stop();
      float.stop();
      ringPulse.stop();
      ringPulse2.stop();
      shimmer.stop();
      heart.stop();
      spin.stop();
    };
  }, [
    featureOpacity0,
    featureOpacity1,
    featureOpacity2,
    featureScale0,
    featureScale1,
    featureScale2,
    featureX0,
    featureX1,
    featureX2,
    footerOpacity,
    glowPulse,
    glowPulse2,
    headlineOpacity,
    heartPulse,
    logoFloat,
    logoOpacity,
    logoScale,
    shimmerX,
    softGlow,
    spinnerRotate,
    taglineOpacity,
    titleOpacity,
    titleTranslateY,
  ]);

  const logoTranslateY = logoFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });

  const ringScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1.12],
  });
  const ringOpacity = glowPulse.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.55, 0.28, 0],
  });

  const ringScale2 = glowPulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1.18],
  });
  const ringOpacity2 = glowPulse2.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.45, 0.22, 0],
  });

  const spinnerRotation = spinnerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[AUTH_BG, AUTH_BG_END, '#FFE4D4']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}>
        <View style={styles.blobCoral} />
        <View style={styles.blobBlue} />

        <SafeAreaView
          style={[
            styles.safe,
            {paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12)},
          ]}>
          <View style={styles.body}>
            <Animated.View
              style={{
                opacity: logoOpacity,
                transform: [{scale: logoScale}, {translateY: logoTranslateY}],
              }}>
              <View style={styles.logoStage}>
                <Animated.View
                  style={[
                    styles.glowRing,
                    styles.glowRingOuter,
                    {opacity: ringOpacity, transform: [{scale: ringScale}]},
                  ]}
                />
                <Animated.View
                  style={[
                    styles.glowRing,
                    styles.glowRingMid,
                    {opacity: ringOpacity2, transform: [{scale: ringScale2}]},
                  ]}
                />
                <Animated.View style={[styles.glowSoft, {opacity: softGlow}]} />

                <View style={styles.logoCard}>
                  <Image
                    source={APP_LOGO}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Animated.View
                    style={[
                      styles.shimmer,
                      {transform: [{translateX: shimmerX}, {skewX: '-18deg'}]},
                    ]}
                  />
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: titleOpacity,
                transform: [{translateY: titleTranslateY}],
                alignItems: 'center',
              }}>
              <View style={styles.titleRow}>
                <Text style={styles.titleMain}>
                  Baby Names{'\n'}
                  <Text style={styles.titleAccent}>for Couples</Text>
                </Text>
              </View>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Animated.View style={{transform: [{scale: heartPulse}]}}>
                  <Ionicons name="heart" size={14} color={C.primary} />
                </Animated.View>
                <View style={styles.dividerLine} />
              </View>
            </Animated.View>

            <Animated.Text style={[styles.headline, {opacity: headlineOpacity}]}>
              Find the name you both love
            </Animated.Text>
            <Animated.Text style={[styles.tagline, {opacity: taglineOpacity}]}>
              Swipe together, match favorites, and choose with confidence.
            </Animated.Text>

            <SplashFeatureRow items={features} />
          </View>

          <Animated.View style={[styles.footer, {opacity: footerOpacity}]}>
            <Animated.View
              style={[styles.loaderRing, {transform: [{rotate: spinnerRotation}]}]}
            />
            <Text style={styles.loadingText}>Preparing your name journey…</Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default SplashScreen;
