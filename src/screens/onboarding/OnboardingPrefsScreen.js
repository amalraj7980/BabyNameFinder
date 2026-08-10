import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {
  PrimaryButton,
  ProgressSteps,
  Chip,
  ScreenScaffold,
} from '../../components/ui/DesignSystem';
import {
  getGenderPrefs,
  setGenderPrefs,
  getStylePrefs,
  setStylePrefs,
} from '../../services/onboardingStorage';

const STYLE_OPTIONS = [
  {id: 'classic', label: 'Classic', color: T.colors.accentMint},
  {id: 'modern', label: 'Modern'},
  {id: 'vintage', label: 'Vintage Revival'},
  {id: 'short', label: 'Short & Sweet'},
  {id: 'neutral', label: 'Gender-Neutral'},
  {id: 'heritage', label: 'Heritage Collections', locked: true},
  {id: 'vibe', label: 'Vibe Collections', locked: true},
  {id: 'premium', label: 'Premium Collections', locked: true},
];

const OnboardingPrefsScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [boy, setBoy] = useState(true);
  const [girl, setGirl] = useState(false);
  const [stylesSelected, setStylesSelected] = useState(['classic']);

  useEffect(() => {
    (async () => {
      const g = await getGenderPrefs();
      setBoy(!!g.boy);
      setGirl(!!g.girl);
      const s = await getStylePrefs();
      if (Array.isArray(s) && s.length) {
        setStylesSelected(s);
      }
    })();
  }, []);

  const toggleStyle = useCallback(id => {
    setStylesSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const onContinue = useCallback(async () => {
    await setGenderPrefs({boy, girl});
    await setStylePrefs(stylesSelected);
    navigation.navigate('OnboardingName');
  }, [boy, girl, stylesSelected, navigation]);

  const helper = (() => {
    if (boy && !girl) {
      return 'Boy names only. Tap Girl to add it back.';
    }
    if (!boy && girl) {
      return 'Girl names only. Tap Boy to add it back.';
    }
    if (boy && girl) {
      return 'Showing boy and girl names.';
    }
    return 'Select at least one gender to continue.';
  })();

  const canContinue = boy || girl;

  return (
    <ScreenScaffold>
      <View style={{paddingTop: insets.top + 4}}>
        <ProgressSteps step={1} total={3} />
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="chevron-back" size={24} color={T.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: Math.max(insets.bottom, 16) + 90},
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Boy names, girl names, or both?</Text>
        <Text style={styles.helper}>{helper}</Text>

        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, boy && styles.genderActive]}
            onPress={() => setBoy(v => !v)}
            activeOpacity={0.85}>
            <Text style={[styles.genderText, boy && styles.genderTextActive]}>
              Boy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, girl && styles.genderActive]}
            onPress={() => setGirl(v => !v)}
            activeOpacity={0.85}>
            <Text style={[styles.genderText, girl && styles.genderTextActive]}>
              Girl
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.heading, styles.heading2]}>
          Any name style preferences?
        </Text>
        <Text style={styles.helper}>Pick as many as you like.</Text>

        <View style={styles.chips}>
          {STYLE_OPTIONS.map(opt => (
            <Chip
              key={opt.id}
              label={opt.label}
              locked={opt.locked}
              selected={!opt.locked && stylesSelected.includes(opt.id)}
              selectedColor={opt.color || T.colors.primary}
              onPress={() => toggleStyle(opt.id)}
            />
          ))}
          <Chip
            label="Browse collections"
            accent
            onPress={() => {}}
          />
        </View>

        <Text style={styles.matchCount}>56 names match your preferences.</Text>
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <PrimaryButton
          title="Continue"
          disabled={!canContinue}
          onPress={onContinue}
        />
      </View>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  back: {
    marginLeft: 12,
    marginTop: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: T.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heading2: {
    marginTop: 28,
  },
  helper: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: T.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EAF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderActive: {
    backgroundColor: T.colors.primary,
  },
  genderText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: '#5B7A95',
  },
  genderTextActive: {
    color: T.colors.textOnPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  matchCount: {
    marginTop: 8,
    textAlign: 'center',
    color: T.colors.primary,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: T.colors.background,
  },
});

export default OnboardingPrefsScreen;
