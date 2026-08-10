import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {DesignTokens} from '../../theme/designTokens';
import {AUTH_BG, AUTH_BG_END, authStyles} from './authStyles';

const APP_LOGO = require('../../assects/App Icon 1024x1024.png');

/**
 * Same cream gradient + soft blobs as Welcome — used by Login / Sign Up / Forgot.
 * Back sits in a fixed top bar (not inside centered scroll content).
 */
const AuthScreenLayout = ({
  children,
  heroTitle,
  heroSubtitle,
  showBack = false,
  onBack,
  footer,
  showBrand = true,
  compact = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(AUTH_BG);
      }
    }, []),
  );

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={authStyles.root}>
      <LinearGradient
        colors={[AUTH_BG, AUTH_BG_END, '#FFE4D4']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={authStyles.blobCoral} />
      <View style={authStyles.blobBlue} />

      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={authStyles.safe}>
        {showBack ? (
          <View style={authStyles.topBar}>
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={authStyles.backIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Ionicons
                name="chevron-back"
                size={22}
                color={DesignTokens.colors.textPrimary}
              />
            </Pressable>
          </View>
        ) : null}

        <KeyboardAvoidingView
          style={authStyles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            contentContainerStyle={[
              authStyles.scrollContent,
              compact && authStyles.scrollContentCompact,
              showBack && authStyles.scrollContentWithBack,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={!compact}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              }}>
              {showBrand ? (
                <View
                  style={[
                    authStyles.brandWrap,
                    compact && authStyles.brandWrapCompact,
                  ]}>
                  <View
                    style={[
                      authStyles.brandLogoCard,
                      compact && authStyles.brandLogoCardCompact,
                    ]}>
                    <Image
                      source={APP_LOGO}
                      style={[
                        authStyles.brandLogo,
                        compact && authStyles.brandLogoCompact,
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      authStyles.brandTitle,
                      compact && authStyles.brandTitleCompact,
                    ]}>
                    Baby Names{' '}
                    <Text style={authStyles.brandAccent}>Together</Text>
                  </Text>
                  {!compact ? (
                    <Text style={authStyles.brandTag}>Find names you both love</Text>
                  ) : null}
                </View>
              ) : null}

              {(heroTitle || heroSubtitle) && (
                <View
                  style={[
                    authStyles.heroBlock,
                    compact && authStyles.heroBlockCompact,
                  ]}>
                  {heroTitle ? (
                    <Text
                      style={[
                        authStyles.heroTitle,
                        compact && authStyles.heroTitleCompact,
                      ]}>
                      {heroTitle}
                    </Text>
                  ) : null}
                  {heroSubtitle ? (
                    <Text
                      style={[
                        authStyles.heroSubtitle,
                        compact && authStyles.heroSubtitleCompact,
                      ]}>
                      {heroSubtitle}
                    </Text>
                  ) : null}
                </View>
              )}

              <View style={[authStyles.card, compact && authStyles.cardCompact]}>
                {children}
              </View>
              {footer}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default AuthScreenLayout;
