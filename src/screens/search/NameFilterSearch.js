import React, {useState, useContext, useEffect, useCallback, memo} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {AppContext} from '../../context/AppContext';
import {Fonts} from '../../styles';
import {getTabBarStyle} from '../../routes/tabBarStyles';
import {COUNTRY_ORIGIN_OPTIONS} from '../../constants/countryOriginOptions';

const C = {
  bg: '#FFF8F2',
  primary: '#FF6B6B',
  text: '#2C3340',
  muted: '#8B95A5',
  surface: '#FFFFFF',
  border: '#E6ECF3',
  boy: '#5EC2D7',
  girl: '#FF6B6B',
  unisex: '#98D8AA',
  inputBg: '#FAFBFC',
};

const GENDER_OPTIONS = [
  {label: 'All', value: 'all', color: C.text},
  {label: 'Boy', value: 'male', color: C.boy},
  {label: 'Girl', value: 'female', color: C.girl},
  {label: 'Unisex', value: 'unisex', color: C.unisex},
];

const FilterField = memo(function FilterField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'none',
  maxLength,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, focused && styles.fieldLabelActive]}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, focused && styles.inputActive]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        maxLength={maxLength}
        returnKeyType="done"
        blurOnSubmit
        underlineColorAndroid="transparent"
        importantForAutofill="no"
      />
    </View>
  );
});

export default function NameFilterSearch({navigation}) {
  const insets = useSafeAreaInsets();
  const {seachfilterData, setSeachfilterData} = useContext(AppContext);

  // Local draft avoids AppContext re-renders fighting TextInput focus
  const [draft, setDraft] = useState({
    firstLetter: '',
    lastLetter: '',
    contains: '',
    compoundLetter: false,
    gender: 'all',
    origins: [],
  });

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: {display: 'none', height: 0},
      });
      return () => {
        parent?.setOptions({
          tabBarStyle: getTabBarStyle(insets.bottom),
        });
      };
    }, [navigation, insets.bottom]),
  );

  useEffect(() => {
    setDraft({
      firstLetter: seachfilterData?.firstLetter ?? '',
      lastLetter: seachfilterData?.lastLetter ?? '',
      contains: seachfilterData?.contains ?? '',
      compoundLetter: !!seachfilterData?.compoundLetter,
      gender: seachfilterData?.gender ?? 'all',
      origins: Array.isArray(seachfilterData?.origins)
        ? seachfilterData.origins
        : [],
    });
  }, [seachfilterData]);

  const setField = useCallback((field, value) => {
    setDraft(prev => ({...prev, [field]: value}));
  }, []);

  const toggleOrigin = useCallback(value => {
    if (value === 'all') {
      setDraft(prev => ({...prev, origins: []}));
      return;
    }
    setDraft(prev => {
      const current = prev.origins || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {...prev, origins: next};
    });
  }, []);

  const handleApply = useCallback(() => {
    Keyboard.dismiss();
    setSeachfilterData(prev => ({
      ...prev,
      firstLetter: (draft.firstLetter || '').trim(),
      lastLetter: (draft.lastLetter || '').trim(),
      contains: (draft.contains || '').trim(),
      compoundLetter: !!draft.compoundLetter,
      gender: draft.gender || 'all',
      origins: Array.isArray(draft.origins) ? draft.origins : [],
      search: false,
    }));
    navigation.goBack();
  }, [draft, navigation, setSeachfilterData]);

  const handleReset = useCallback(() => {
    const cleared = {
      firstLetter: '',
      lastLetter: '',
      contains: '',
      compoundLetter: false,
      gender: 'all',
      origins: [],
    };
    setDraft(cleared);
    setSeachfilterData({
      ...cleared,
      search: false,
    });
  }, [setSeachfilterData]);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);
  const allOriginsSelected = !(draft.origins && draft.origins.length);

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter</Text>
        <TouchableOpacity
          onPress={handleReset}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          accessibilityRole="button"
          accessibilityLabel="Reset filters">
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {paddingBottom: bottomPad + 88},
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          bounces
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}>
          <Pressable onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.card}>
              <FilterField
                label="Starts with"
                value={draft.firstLetter}
                onChangeText={text => setField('firstLetter', text)}
                placeholder="e.g. A"
                maxLength={12}
              />
              <FilterField
                label="Ends with"
                value={draft.lastLetter}
                onChangeText={text => setField('lastLetter', text)}
                placeholder="e.g. a"
                maxLength={12}
              />
              <FilterField
                label="Contains"
                value={draft.contains}
                onChangeText={text => setField('contains', text)}
                placeholder="e.g. an"
                maxLength={24}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleLabel}>Compound names only</Text>
                  <Text style={styles.toggleHint}>
                    Off = all names. On = only names with spaces or hyphens.
                  </Text>
                </View>
                <Switch
                  trackColor={{false: '#D8DEE6', true: '#FFD0D0'}}
                  thumbColor={draft.compoundLetter ? C.primary : '#F4F4F5'}
                  ios_backgroundColor="#D8DEE6"
                  onValueChange={value => setField('compoundLetter', value)}
                  value={!!draft.compoundLetter}
                />
              </View>

              <Text style={styles.sectionLabel}>Gender</Text>
              <View style={styles.genderWrap}>
                {GENDER_OPTIONS.map(opt => {
                  const selected = draft.gender === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.genderChip,
                        selected && {
                          backgroundColor: opt.color,
                          borderColor: opt.color,
                        },
                      ]}
                      onPress={() => setField('gender', opt.value)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{selected}}>
                      <Text
                        style={[
                          styles.genderChipText,
                          selected && styles.genderChipTextOn,
                          !selected && {color: opt.color},
                        ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
                Country / Origin
              </Text>
              <Text style={styles.sectionHint}>
                Select one or more. Leave All to include every origin.
              </Text>
              <View style={styles.genderWrap}>
                {COUNTRY_ORIGIN_OPTIONS.map(opt => {
                  const selected =
                    opt.value === 'all'
                      ? allOriginsSelected
                      : (draft.origins || []).includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.genderChip,
                        selected && {
                          backgroundColor: C.primary,
                          borderColor: C.primary,
                        },
                      ]}
                      onPress={() => toggleOrigin(opt.value)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{selected}}>
                      <Text
                        style={[
                          styles.genderChipText,
                          selected
                            ? styles.genderChipTextOn
                            : {color: C.text},
                        ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, {paddingBottom: bottomPad}]}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Apply filters">
            <Text style={styles.applyText}>Apply filters</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#2D3436',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: {elevation: 2},
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: C.text,
  },
  resetText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.primary,
    minWidth: 48,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    ...softShadow,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.muted,
    marginBottom: 8,
  },
  fieldLabelActive: {
    color: C.primary,
  },
  input: {
    minHeight: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: C.text,
    backgroundColor: C.inputBg,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputActive: {
    borderColor: C.primary,
    backgroundColor: C.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    marginBottom: 14,
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  toggleLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.text,
  },
  toggleHint: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: C.muted,
  },
  sectionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: C.muted,
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 6,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: C.muted,
    marginBottom: 12,
  },
  genderWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  genderChipText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  genderChipTextOn: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  applyBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
