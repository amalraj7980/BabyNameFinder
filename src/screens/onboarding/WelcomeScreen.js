import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {PrimaryButton, ScreenScaffold} from '../../components/ui/DesignSystem';

const WelcomeScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScreenScaffold>
      <View
        style={[
          styles.content,
          {paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) + 8},
        ]}>
        <View style={styles.logoRow}>
          <View style={styles.logoLeft} />
          <View style={styles.logoHeart} />
          <View style={styles.logoRight} />
        </View>

        <Text style={styles.title}>
          Baby Names{'\n'}for Couples
        </Text>
        <Text style={styles.subtitle}>Swipe, match, and pick together</Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewName}>Oliver</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>English</Text>
          </View>
          <Text style={styles.previewMeaning}>Olive tree, peace</Text>
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="Let's find your perfect name"
          onPress={() => navigation.navigate('OnboardingPrefs')}
        />
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoRow: {
    width: 72,
    height: 48,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLeft: {
    position: 'absolute',
    left: 4,
    width: 28,
    height: 36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    backgroundColor: T.colors.primary,
    transform: [{rotate: '-28deg'}],
  },
  logoRight: {
    position: 'absolute',
    right: 4,
    width: 28,
    height: 36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: T.colors.partnerBlue,
    transform: [{rotate: '28deg'}],
  },
  logoHeart: {
    width: 18,
    height: 18,
    backgroundColor: T.colors.accentYellow,
    borderRadius: 4,
    transform: [{rotate: '45deg'}],
    zIndex: 2,
  },
  title: {
    textAlign: 'center',
    color: T.colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: T.colors.textPrimary,
    fontFamily: Fonts.medium,
    fontSize: 16,
    marginBottom: 28,
  },
  previewCard: {
    width: '78%',
    backgroundColor: T.colors.surface,
    borderRadius: T.radius.xl,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...T.shadow.card,
  },
  previewName: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: T.colors.textPrimary,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  previewMeaning: {
    color: T.colors.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  spacer: {
    flex: 1,
  },
});

export default WelcomeScreen;
