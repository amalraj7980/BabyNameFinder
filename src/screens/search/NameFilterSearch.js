import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  memo,
} from 'react';
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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {AppContext} from '../../context/AppContext';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {getTabBarStyle} from '../../routes/tabBarStyles';
import {COUNTRY_ORIGIN_OPTIONS} from '../../constants/countryOriginOptions';
import {NamesLoadingState} from '../../components/NamesLoadingState';

const C = T.colors;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const keyboardLayoutAnim = () => {
  LayoutAnimation.configureNext({
    duration: Platform.OS === 'ios' ? 250 : 200,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
};

const GENDER_OPTIONS = [
  {label: 'All', value: 'all', color: C.text},
  {label: 'Boy', value: 'male', color: C.boy},
  {label: 'Girl', value: 'female', color: C.girl},
  {label: 'Unisex', value: 'unisex', color: C.unisex},
];

const NAME_LENGTH_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Short · 1–4', value: 'short'},
  {label: 'Medium · 5–7', value: 'medium'},
  {label: 'Long · 8+', value: 'long'},
];

const NAME_STYLE_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Modern', value: 'modern'},
  {label: 'Classic', value: 'classic'},
  {label: 'Biblical', value: 'biblical'},
  {label: 'International', value: 'international'},
];

const FilterField = memo(function FilterField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'none',
  maxLength,
  onFocusField,
}) {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  return (
    <View ref={wrapRef} style={styles.field} collapsable={false}>
      <Text style={[styles.fieldLabel, focused && styles.fieldLabelActive]}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, focused && styles.inputActive]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setFocused(true);
          onFocusField?.(wrapRef);
        }}
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
  const {seachfilterData, setSeachfilterData, setDiscoverFilterBusy} =
    useContext(AppContext);

  // Local draft avoids AppContext re-renders fighting TextInput focus
  const [draft, setDraft] = useState({
    firstLetter: '',
    lastLetter: '',
    contains: '',
    originQuery: '',
    nameLength: 'all',
    style: 'all',
    compoundLetter: false,
    gender: 'all',
    origins: [],
  });
  const [isApplying, setIsApplying] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const focusedFieldRef = useRef(null);

  const scrollFieldIntoView = useCallback(wrapRef => {
    const field = wrapRef?.current;
    const scroller = scrollRef.current;
    if (!field?.measureInWindow || !scroller?.measureInWindow) {
      return;
    }
    field.measureInWindow((_fx, fy, _fw, fh) => {
      scroller.measureInWindow((_sx, sy, _sw, sh) => {
        const topGap = 12;
        const bottomGap = 20;
        const visibleTop = sy + topGap;
        const visibleBottom = sy + sh - bottomGap;
        let delta = 0;
        if (fy < visibleTop) {
          delta = fy - visibleTop;
        } else if (fy + fh > visibleBottom) {
          delta = fy + fh - visibleBottom;
        }
        if (delta !== 0) {
          scroller.scrollTo({
            y: Math.max(0, scrollOffsetRef.current + delta),
            animated: true,
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardLayoutAnim();
      setKeyboardOpen(true);
      if (Platform.OS !== 'ios') {
        requestAnimationFrame(() => {
          const wrap = focusedFieldRef.current;
          if (wrap) {
            scrollFieldIntoView(wrap);
          }
        });
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardLayoutAnim();
      setKeyboardOpen(false);
    });
    const didShowSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardDidShow', () => {
            const wrap = focusedFieldRef.current;
            if (wrap) {
              requestAnimationFrame(() => scrollFieldIntoView(wrap));
            }
          })
        : {remove: () => {}};

    return () => {
      showSub.remove();
      hideSub.remove();
      didShowSub.remove();
    };
  }, [scrollFieldIntoView]);

  const onFocusField = useCallback(
    wrapRef => {
      focusedFieldRef.current = wrapRef;
      requestAnimationFrame(() => scrollFieldIntoView(wrapRef));
    },
    [scrollFieldIntoView],
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: {display: 'none', height: 0},
      });
      return () => {
        Keyboard.dismiss();
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
      originQuery: seachfilterData?.originQuery ?? '',
      nameLength: seachfilterData?.nameLength ?? 'all',
      style: seachfilterData?.style ?? 'all',
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
    if (isApplying) {
      return;
    }
    Keyboard.dismiss();
    setIsApplying(true);
    setDiscoverFilterBusy(true);
    setSeachfilterData(prev => ({
      ...prev,
      firstLetter: (draft.firstLetter || '').trim(),
      lastLetter: (draft.lastLetter || '').trim(),
      contains: (draft.contains || '').trim(),
      originQuery: (draft.originQuery || '').trim(),
      nameLength: draft.nameLength || 'all',
      style: draft.style || 'all',
      compoundLetter: !!draft.compoundLetter,
      gender: draft.gender || 'all',
      origins: Array.isArray(draft.origins) ? draft.origins : [],
      search: false,
    }));
    // Brief overlay so Discover can mount the matching loader before pop.
    setTimeout(() => {
      navigation.goBack();
    }, 280);
  }, [
    draft,
    isApplying,
    navigation,
    setDiscoverFilterBusy,
    setSeachfilterData,
  ]);

  const handleReset = useCallback(() => {
    if (isApplying) {
      return;
    }
    const cleared = {
      firstLetter: '',
      lastLetter: '',
      contains: '',
      originQuery: '',
      nameLength: 'all',
      style: 'all',
      compoundLetter: false,
      gender: 'all',
      origins: [],
    };
    Keyboard.dismiss();
    setIsApplying(true);
    setDiscoverFilterBusy(true);
    setDraft(cleared);
    setSeachfilterData({
      ...cleared,
      search: false,
    });
    setTimeout(() => {
      navigation.goBack();
    }, 280);
  }, [isApplying, navigation, setDiscoverFilterBusy, setSeachfilterData]);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);
  const footerPad = keyboardOpen ? 8 : bottomPad;
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
          disabled={isApplying}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          accessibilityRole="button"
          accessibilityLabel="Reset filters">
          <Text
            style={[styles.resetText, isApplying && styles.resetTextDisabled]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        enabled={Platform.OS === 'ios'}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onScrollBeginDrag={Keyboard.dismiss}
          onScroll={event => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          nestedScrollEnabled
          bounces
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}>
          <Pressable onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Name</Text>
              <FilterField
                label="Starts with"
                value={draft.firstLetter}
                onChangeText={text => setField('firstLetter', text)}
                placeholder="e.g. A"
                maxLength={12}
                onFocusField={onFocusField}
              />
              <FilterField
                label="Ends with"
                value={draft.lastLetter}
                onChangeText={text => setField('lastLetter', text)}
                placeholder="e.g. a"
                maxLength={12}
                onFocusField={onFocusField}
              />
              <FilterField
                label="Contains"
                value={draft.contains}
                onChangeText={text => setField('contains', text)}
                placeholder="e.g. an"
                maxLength={24}
                onFocusField={onFocusField}
              />

              <View style={styles.sectionRule} />

              <FilterField
                label="Country or origin keyword"
                value={draft.originQuery}
                onChangeText={text => setField('originQuery', text)}
                placeholder="e.g. India or Nigeria"
                autoCapitalize="words"
                maxLength={32}
                onFocusField={onFocusField}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleLabel}>Compound names only</Text>
                  <Text style={styles.toggleHint}>
                    Off = all names. On = only names with spaces or hyphens.
                  </Text>
                </View>
                <Switch
                  trackColor={{false: T.colors.chipLocked, true: T.colors.primarySoft}}
                  thumbColor={draft.compoundLetter ? C.primary : '#F4F4F5'}
                  ios_backgroundColor="#D8DEE6"
                  onValueChange={value => setField('compoundLetter', value)}
                  value={!!draft.compoundLetter}
                />
              </View>

              {keyboardOpen ? null : (
                <View style={styles.optionsBlock}>
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
                    Name length
                  </Text>
                  <View style={styles.genderWrap}>
                    {NAME_LENGTH_OPTIONS.map(opt => {
                      const selected = draft.nameLength === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.genderChip,
                            selected && styles.detailChipSelected,
                          ]}
                          onPress={() => setField('nameLength', opt.value)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityState={{selected}}>
                          <Text
                            style={[
                              styles.genderChipText,
                              selected && styles.genderChipTextOn,
                              !selected && {color: C.text},
                            ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
                    Name style
                  </Text>
                  <Text style={styles.sectionHint}>
                    Uses the catalog’s verified style tags when available.
                  </Text>
                  <View style={styles.genderWrap}>
                    {NAME_STYLE_OPTIONS.map(opt => {
                      const selected = draft.style === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.genderChip,
                            selected && styles.detailChipSelected,
                          ]}
                          onPress={() => setField('style', opt.value)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityState={{selected}}>
                          <Text
                            style={[
                              styles.genderChipText,
                              selected && styles.genderChipTextOn,
                              !selected && {color: C.text},
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
              )}
            </View>
          </Pressable>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {paddingBottom: footerPad, paddingTop: keyboardOpen ? 8 : 12},
          ]}>
          <TouchableOpacity
            style={[styles.applyBtn, isApplying && styles.applyBtnDisabled]}
            onPress={handleApply}
            activeOpacity={0.88}
            disabled={isApplying}
            accessibilityRole="button"
            accessibilityLabel="Apply filters">
            <Text style={styles.applyText}>
              {isApplying ? 'Applying…' : 'Apply filters'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {isApplying ? (
        <View style={styles.applyingOverlay} pointerEvents="auto">
          <NamesLoadingState message="Applying filters…" />
        </View>
      ) : null}
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
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
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
  resetTextDisabled: {
    opacity: 0.45,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    ...softShadow,
  },
  optionsBlock: {
    overflow: 'hidden',
  },
  field: {
    marginBottom: 14,
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
    letterSpacing: 0.2,
  },
  sectionLabelSpaced: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: C.muted,
    marginBottom: 12,
    lineHeight: 15,
  },
  sectionRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginBottom: 16,
    marginTop: 2,
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
  detailChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    ...Platform.select({
      ios: {
        shadowColor: '#2D3436',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {elevation: 8},
    }),
  },
  applyBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.72,
  },
  applyText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  applyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247,239,232,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
