import React, {useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CommonActions} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {markAppEntered} from '../../services/onboardingStorage';
import {speakNamePronunciation} from '../../services/speakPronunciation';

const APP_LOGO = require('../../assects/App Icon 1024x1024.png');
const {width: SCREEN_W} = Dimensions.get('window');
const DECK_W = Math.min(SCREEN_W * 0.62, 240);
const PREVIEW_NAME = 'Oliver';

/**
 * Transform-only entrance (scale/translate) — no opacity fades on text/buttons
 * to avoid Android label flicker during transitions.
 */
const WelcomeScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const brandScale = useRef(new Animated.Value(0.92)).current;
  const brandY = useRef(new Animated.Value(12)).current;
  const titleY = useRef(new Animated.Value(14)).current;
  const deckScale = useRef(new Animated.Value(0.9)).current;
  const deckY = useRef(new Animated.Value(22)).current;
  const deckFloat = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(18)).current;
  const ctaScale = useRef(new Animated.Value(0.96)).current;
  const ready = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(T.colors.background);
    }

    // Reveal after first layout so transforms don't flash mid-measure
    requestAnimationFrame(() => {
      ready.setValue(1);
    });

    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.spring(brandScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(deckScale, {
          toValue: 1,
          friction: 7,
          tension: 68,
          useNativeDriver: true,
        }),
        Animated.timing(deckY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(ctaScale, {
          toValue: 1,
          friction: 8,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(ctaY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(deckFloat, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(deckFloat, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    entrance.start(({finished}) => {
      if (finished) {
        float.start();
      }
    });

    return () => {
      entrance.stop();
      float.stop();
    };
  }, [
    brandScale,
    brandY,
    ctaScale,
    ctaY,
    deckFloat,
    deckScale,
    deckY,
    ready,
    titleY,
  ]);

  const continueAsGuest = useCallback(() => {
    navigation.navigate('OnboardingPrefs');
  }, [navigation]);

  const openAuth = useCallback(() => {
    navigation.getParent()?.navigate('Auth') ?? navigation.navigate('Auth');
  }, [navigation]);

  const skipToApp = useCallback(async () => {
    await markAppEntered();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'MainTabs'}],
      }),
    );
  }, [navigation]);

  const speakOliver = useCallback(() => {
    void speakNamePronunciation(PREVIEW_NAME);
  }, []);

  const floatY = deckFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[T.colors.background, T.colors.backgroundEnd, '#FFE4D4']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.blobCoral} />
      <View style={styles.blobBlue} />

      <Animated.View style={[styles.scrollHost, {opacity: ready}]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 20,
              paddingBottom: Math.max(insets.bottom, 16) + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled">
          <Animated.View
            style={[
              styles.brandBlock,
              {
                transform: [{translateY: brandY}, {scale: brandScale}],
              },
            ]}>
            <View style={styles.logoCard} collapsable={false}>
              <Image
                source={APP_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{translateY: titleY}],
              alignItems: 'center',
            }}
            collapsable={false}>
            <Text style={styles.brandTitle}>
              Baby Names{'\n'}
              <Text style={styles.brandAccent}>for Couples</Text>
            </Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Ionicons name="heart" size={12} color={T.colors.primary} />
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.subtitle}>
              Swipe, match, and pick the perfect name together
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.deckWrap,
              {
                transform: [
                  {translateY: deckY},
                  {scale: deckScale},
                ],
              },
            ]}>
            <Animated.View
              style={[styles.deckStack, {transform: [{translateY: floatY}]}]}
              collapsable={false}>
              <View
                pointerEvents="none"
                style={[styles.deckShadow, styles.deckBack]}
              />
              <View
                pointerEvents="none"
                style={[styles.deckShadow, styles.deckMid]}
              />
              <View style={styles.deckFront} collapsable={false}>
                <View style={styles.deckTopRow}>
                  <View style={[styles.genderPill, styles.boyPill]}>
                    <Text style={styles.genderPillText}>Boy</Text>
                  </View>
                  <TouchableOpacity
                    onPress={speakOliver}
                    activeOpacity={0.7}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    style={styles.speakerBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Pronounce Oliver">
                    <Ionicons
                      name="volume-medium"
                      size={16}
                      color={T.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.previewName}>{PREVIEW_NAME}</Text>
                <View style={styles.originBadge}>
                  <Text style={styles.originBadgeText}>English</Text>
                </View>
                <Text style={styles.previewMeaning}>Olive tree, peace</Text>

                <View style={styles.actionHintRow}>
                  <View style={styles.actionBtn}>
                    <Ionicons
                      name="close"
                      size={16}
                      color={T.colors.passOverlay}
                    />
                  </View>
                  <View style={styles.actionBtn}>
                    <Ionicons
                      name="heart"
                      size={16}
                      color={T.colors.likeOverlay}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          <View style={styles.spacer} />

          <Animated.View
            style={[
              styles.ctaBlock,
              {
                transform: [{translateY: ctaY}, {scale: ctaScale}],
              },
            ]}
            collapsable={false}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={continueAsGuest}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Continue as Guest">
              <Text style={styles.primaryBtnText} allowFontScaling={false}>
                Continue as Guest
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={T.colors.textOnPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={openAuth}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Login or Sign Up">
              <Text style={styles.secondaryText} allowFontScaling={false}>
                Login / Sign Up
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skipToApp}
              hitSlop={{top: 10, bottom: 10, left: 16, right: 16}}
              style={styles.skipBtn}>
              <Text style={styles.skipText} allowFontScaling={false}>
                Skip intro — browse names
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  scrollHost: {
    flex: 1,
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
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandBlock: {
    marginBottom: 18,
  },
  logoCard: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: T.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.shadow.card,
  },
  logoImage: {
    width: 68,
    height: 68,
  },
  brandTitle: {
    textAlign: 'center',
    color: T.colors.textPrimary,
    fontFamily: Fonts.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  brandAccent: {
    color: T.colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    width: 140,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: T.colors.primaryMuted,
  },
  subtitle: {
    textAlign: 'center',
    color: T.colors.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  deckWrap: {
    marginTop: 22,
    width: DECK_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckStack: {
    width: '100%',
    position: 'relative',
  },
  deckShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.borderSoft,
  },
  deckBack: {
    transform: [{rotate: '-7deg'}, {scale: 0.96}],
    opacity: 0.45,
    backgroundColor: T.colors.surfacePeach,
  },
  deckMid: {
    transform: [{rotate: '4deg'}, {scale: 0.98}],
    opacity: 0.7,
  },
  deckFront: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: T.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.colors.borderSoft,
    ...T.shadow.card,
  },
  deckTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  speakerBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPill: {
    borderRadius: T.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  boyPill: {
    backgroundColor: 'rgba(94, 194, 215, 0.18)',
  },
  genderPillText: {
    color: T.colors.Boy,
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
  previewName: {
    fontFamily: Fonts.extrabold,
    fontSize: 26,
    color: T.colors.textPrimary,
    letterSpacing: 0.2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  originBadge: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  originBadgeText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
  previewMeaning: {
    marginTop: 8,
    marginBottom: 12,
    color: T.colors.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  actionHintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingTop: 2,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.colors.background,
    borderWidth: 1,
    borderColor: T.colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
  ctaBlock: {
    alignSelf: 'stretch',
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: T.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...T.shadow.soft,
  },
  primaryBtnText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: T.colors.primaryBorder,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: T.colors.primary,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.colors.textSecondary,
  },
});

export default WelcomeScreen;
