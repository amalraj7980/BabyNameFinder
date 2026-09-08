import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {applyAppStatusBar} from '../../components/AppStatusBar';
import {
  getDisplayName,
  setDisplayName,
  getGenderPrefs,
  setGenderPrefs,
  getStylePrefs,
  setStylePrefs,
} from '../../services/onboardingStorage';
import {logoutFirebase} from '../../services/auth.service';
import {resolveDisplayName} from '../../utils/profileDisplay';
import {getInstalledAppVersion} from '../../services/appUpdate';
import {APP_DISPLAY_NAME, APP_VERSION} from '../../constants/appInfo';
import {
  NAME_STYLE_OPTIONS,
  isStyleLocked,
} from '../../constants/nameStyleOptions';

const {width: SCREEN_W} = Dimensions.get('window');
const H_PAD = 14;
const CARD_PAD = 14;
const PREVIEW_W = Math.min(SCREEN_W * 0.48, 176);
const PREVIEW_H = 188;

const C = {
  bgTop: '#FFF8F2',
  bgBottom: '#FFEFE4',
  primary: '#FF6B6B',
  primarySoft: '#FF8E8E',
  text: '#2C3340',
  textMuted: '#8B95A5',
  textHint: '#A8B0BD',
  border: '#E6ECF3',
  chipBorder: '#DCE3EC',
  mint: '#98D8AA',
  genderIdle: '#EAF1F7',
  genderIdleText: '#5C7A94',
  surface: '#FFFFFF',
};

const STYLE_OPTIONS = NAME_STYLE_OPTIONS;

const ACCOUNT_ROWS = [
  {key: 'aiAssistant', label: 'Baby Name AI', icon: 'sparkles', color: '#AF52DE'},
  {key: 'notifications', label: 'Notifications', icon: 'notifications', color: '#4C9AFF'},
  {key: 'privacy', label: 'Privacy', icon: 'lock-closed', color: '#34C759'},
  {key: 'terms', label: 'Terms of Use', icon: 'document-text', color: '#FFCC00'},
  {key: 'help', label: 'Help & Support', icon: 'help-circle', color: '#FF6B8A'},
  {key: 'restore', label: 'Restore Purchases', icon: 'refresh', color: C.primary},
];

const StyleChip = ({label, selected, selectedColor, locked, onPress}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[
      styles.chip,
      selected && {
        backgroundColor: selectedColor || C.mint,
        borderColor: selectedColor || C.mint,
      },
      locked && styles.chipLocked,
    ]}>
    <Text
      style={[
        styles.chipText,
        selected && styles.chipTextOn,
        locked && styles.chipLockedText,
      ]}>
      {label}
    </Text>
    {locked ? (
      <Ionicons name="lock-closed" size={12} color={C.textHint} />
    ) : null}
  </TouchableOpacity>
);

const PreferencesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {discoverCardStyle, updateDiscoverCardStyle, isPrime} =
    useContext(AppContext);
  const {
    isUserLoggedin,
    email,
    displayName: authDisplayName,
    logoutUser,
    updateDisplayName,
  } = useContext(AuthContext);
  const [localName, setLocalName] = useState('');
  const [nameModal, setNameModal] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [boy, setBoy] = useState(true);
  const [girl, setGirl] = useState(true);
  const [stylesSelected, setStylesSelected] = useState(['classic']);
  const [appVersion, setAppVersion] = useState(APP_VERSION);

  const cardStyle = discoverCardStyle || 'detailed';
  const displayName = resolveDisplayName({
    localName,
    authDisplayName,
    isUserLoggedin,
  });

  const loadPrefs = useCallback(async () => {
    const [name, g, s] = await Promise.all([
      getDisplayName(),
      getGenderPrefs(),
      getStylePrefs(),
    ]);
    setLocalName(name || '');
    setBoy(!!g.boy);
    setGirl(!!g.girl);
    setStylesSelected(Array.isArray(s) && s.length ? s : ['classic']);
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs, isUserLoggedin, authDisplayName, email]);

  useFocusEffect(
    useCallback(() => {
      applyAppStatusBar('dark-content');
      void loadPrefs();
    }, [loadPrefs]),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const version = await getInstalledAppVersion();
        if (mounted && version) {
          setAppVersion(version);
        }
      } catch (e) {
        // keep APP_VERSION fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistGender = useCallback(async (nextBoy, nextGirl) => {
    setBoy(nextBoy);
    setGirl(nextGirl);
    await setGenderPrefs({boy: nextBoy, girl: nextGirl});
  }, []);

  const toggleStyle = useCallback(
    async id => {
      const opt = STYLE_OPTIONS.find(o => o.id === id);
      if (isStyleLocked(opt, isPrime)) {
        navigation.navigate('InAppPurchase');
        return;
      }
      setStylesSelected(prev => {
        const next = prev.includes(id)
          ? prev.filter(x => x !== id)
          : [...prev, id];
        // Never persist only-empty; keep at least one free style if all cleared
        const safe = next.length ? next : ['classic'];
        void setStylePrefs(safe);
        return safe;
      });
    },
    [isPrime, navigation],
  );

  const selectCardStyle = useCallback(
    async style => {
      await updateDiscoverCardStyle(style);
    },
    [updateDiscoverCardStyle],
  );

  const saveName = useCallback(async () => {
    const next = nameDraft.trim();
    try {
      if (updateDisplayName) {
        await updateDisplayName(next);
      } else {
        await setDisplayName(next);
      }
      setLocalName(next);
      setNameModal(false);
      Toast.show({type: 'success', text1: 'Name updated'});
    } catch (e) {
      Alert.alert('Could not update name', e?.message || 'Try again.');
    }
  }, [nameDraft, updateDisplayName]);

  const onAccountPress = useCallback(
    key => {
      if (key === 'login') {
        navigation.getParent()?.navigate('Auth') ?? navigation.navigate('Auth');
        return;
      }
      if (key === 'logout') {
        Alert.alert(
          'Log out',
          'You will return to guest mode. Cloud favorites stay on your account.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Log out',
              style: 'destructive',
              onPress: async () => {
                try {
                  if (logoutUser) {
                    await logoutUser();
                  } else {
                    await logoutFirebase();
                  }
                  setLocalName('');
                  setNameDraft('');
                  Toast.show({type: 'success', text1: 'Logged out'});
                } catch (e) {
                  Alert.alert('Logout failed', e?.message || 'Try again.');
                }
              },
            },
          ],
        );
        return;
      }
      if (key === 'aiAssistant') {
        navigation.navigate('AiAssistant');
        return;
      }
      if (key === 'privacy') {
        navigation.navigate('PrivacyPolicy');
        return;
      }
      if (key === 'terms') {
        navigation.navigate('TermsOfService');
        return;
      }
      if (key === 'help') {
        Linking.openURL('mailto:support@babynamestogether.app').catch(() => {
          Alert.alert('Help & Support', 'Email support@babynamestogether.app');
        });
        return;
      }
      if (key === 'restore') {
        navigation.navigate('InAppPurchase');
        return;
      }
      Alert.alert(
        'Notifications',
        'Notification settings will open when enabled on your device.',
      );
    },
    [navigation, logoutUser],
  );

  const initial = (displayName || 'Y').charAt(0).toUpperCase();
  return (
    <LinearGradient colors={[C.bgTop, C.bgBottom]} style={styles.root}>
      <View style={[styles.headerRow, {paddingTop: insets.top}]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.screenTitle}>Preferences</Text>
        <TouchableOpacity
          style={[styles.proBadge, isPrime && styles.proBadgeActive]}
          onPress={() => navigation.navigate('InAppPurchase')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isPrime ? 'PRO member' : 'Go PRO'}>
          {isPrime ? (
            <Ionicons name="diamond" size={11} color="#FFFFFF" />
          ) : (
            <Ionicons name="diamond-outline" size={11} color={C.primary} />
          )}
          <Text style={[styles.proBadgeText, isPrime && styles.proBadgeTextOn]}>
            PRO
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: Math.max(insets.bottom, 12) + 24},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.editCorner}
            onPress={() => {
              setNameDraft(displayName);
              setNameModal(true);
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="create-outline" size={15} color={C.textHint} />
          </TouchableOpacity>
          <View style={styles.profileCenter}>
            <View style={styles.avatarGlow}>
              <LinearGradient
                colors={[C.primarySoft, C.primary]}
                start={{x: 0.15, y: 0}}
                end={{x: 0.9, y: 1}}
                style={styles.avatar}>
                <Text style={styles.avatarLetter}>{initial}</Text>
              </LinearGradient>
              {isPrime ? (
                <View style={styles.avatarProDot}>
                  <Ionicons name="diamond" size={9} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{displayName}</Text>
              {isPrime ? (
                <View style={styles.inlinePro}>
                  <Text style={styles.inlineProText}>PRO</Text>
                </View>
              ) : null}
            </View>
            {isUserLoggedin && email ? (
              <Text style={styles.profileEmail}>{email}</Text>
            ) : null}
            <Text style={styles.profileMeta}>Swiping since August 2026</Text>
          </View>
        </View>

        {/* Name Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="options-outline" size={14} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Name Preferences</Text>
          </View>
          <Text style={styles.fieldLabel}>Names for</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, boy && styles.genderOn]}
              onPress={() => {
                if (boy && !girl) {
                  return;
                }
                persistGender(!boy, girl);
              }}
              activeOpacity={0.85}>
              <Text style={[styles.genderText, boy && styles.genderTextOn]}>
                Boy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, girl && styles.genderOn]}
              onPress={() => {
                if (girl && !boy) {
                  return;
                }
                persistGender(boy, !girl);
              }}
              activeOpacity={0.85}>
              <Text style={[styles.genderText, girl && styles.genderTextOn]}>
                Girl
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Name styles</Text>
          <View style={styles.chips}>
            {STYLE_OPTIONS.map(opt => {
              const locked = isStyleLocked(opt, isPrime);
              return (
                <StyleChip
                  key={opt.id}
                  label={opt.label}
                  locked={locked}
                  selected={!locked && stylesSelected.includes(opt.id)}
                  selectedColor={opt.color || C.mint}
                  onPress={() => toggleStyle(opt.id)}
                />
              );
            })}
          </View>
        </View>

        {/* Card Style */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="albums-outline" size={14} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Card Style</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={PREVIEW_W + 14}
            contentContainerStyle={styles.styleScroll}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => selectCardStyle('detailed')}
              style={styles.previewCol}>
              <View
                style={[
                  styles.previewCard,
                  cardStyle === 'detailed' && styles.previewActive,
                ]}>
                <Text style={styles.previewName}>Charlotte</Text>
                <View style={styles.previewPronRow}>
                  <Ionicons
                    name="volume-medium-outline"
                    size={13}
                    color={C.textMuted}
                  />
                  <Text style={styles.previewPron}>SHAR-lut</Text>
                </View>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>French</Text>
                </View>
                <Text style={styles.previewMeaning}>
                  Free woman — a feminine heir to Charlemagne's legacy
                </Text>
                <View style={styles.waveArea}>
                  <View style={styles.waveBack} />
                  <View style={styles.waveFront} />
                </View>
              </View>
              <View style={styles.styleMeta}>
                {cardStyle === 'detailed' ? (
                  <View style={styles.checkOn}>
                    <Ionicons name="checkmark" size={9} color="#FFF" />
                  </View>
                ) : (
                  <View style={styles.checkOff} />
                )}
                <Text
                  style={[
                    styles.styleName,
                    cardStyle === 'detailed' && styles.styleNameOn,
                  ]}>
                  Detailed
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => selectCardStyle('simple')}
              style={styles.previewCol}>
              <View
                style={[
                  styles.previewCard,
                  styles.previewSimple,
                  cardStyle === 'simple' && styles.previewActive,
                ]}>
                <Text style={styles.previewName}>Oliver</Text>
                <Text style={styles.previewMeaningSimple}>
                  Olive tree, peace
                </Text>
              </View>
              <View style={styles.styleMeta}>
                {cardStyle === 'simple' ? (
                  <View style={styles.checkOn}>
                    <Ionicons name="checkmark" size={9} color="#FFF" />
                  </View>
                ) : (
                  <View style={styles.checkOff} />
                )}
                <Text
                  style={[
                    styles.styleName,
                    cardStyle === 'simple' && styles.styleNameOn,
                  ]}>
                  Simple
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Account */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="settings-sharp" size={14} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Account</Text>
          </View>
          {isUserLoggedin ? (
            <View
              style={[
                styles.accountRow,
                styles.accountRowStatic,
                ACCOUNT_ROWS.length === 0 && styles.accountRowLast,
              ]}>
              <View style={styles.accountLeft}>
                <Ionicons name="person" size={17} color="#4C9AFF" />
                <View>
                  <Text style={styles.accountLabel}>
                    {displayName || 'Account'}
                  </Text>
                  {email ? (
                    <Text style={styles.accountEmail}>{email}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => onAccountPress('login')}
              activeOpacity={0.7}>
              <View style={styles.accountLeft}>
                <Ionicons name="person-circle" size={17} color="#4C9AFF" />
                <Text style={styles.accountLabel}>Login / Sign Up</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#C8D0DA" />
            </TouchableOpacity>
          )}
          {ACCOUNT_ROWS.map((row, index) => (
            <TouchableOpacity
              key={row.key}
              style={[
                styles.accountRow,
                index === ACCOUNT_ROWS.length - 1 && styles.accountRowLast,
              ]}
              onPress={() => onAccountPress(row.key)}
              activeOpacity={0.7}>
              <View style={styles.accountLeft}>
                <Ionicons name={row.icon} size={17} color={row.color} />
                <Text style={styles.accountLabel}>{row.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#C8D0DA" />
            </TouchableOpacity>
          ))}
        </View>

        {isUserLoggedin ? (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => onAccountPress('logout')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={18} color={C.primary} />
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>
        ) : null}

        <Text
          style={styles.versionLabel}
          accessibilityRole="text"
          accessibilityLabel={`${APP_DISPLAY_NAME} version ${appVersion}`}>
          {APP_DISPLAY_NAME} · v{appVersion}
        </Text>
      </ScrollView>

      <Modal visible={nameModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your name</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={C.textHint}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setNameModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={saveName}>
                <Text style={styles.modalOk}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#2D3436',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  android: {elevation: 3},
});

const styles = StyleSheet.create({
  root: {flex: 1},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
    paddingTop: 4,
  },
  headerSpacer: {
    width: 72,
  },
  screenTitle: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
  },
  proBadge: {
    minWidth: 72,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  proBadgeActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  proBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: C.primary,
    letterSpacing: 0.4,
  },
  proBadgeTextOn: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: H_PAD,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: CARD_PAD,
    marginBottom: 10,
    ...cardShadow,
  },
  editCorner: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  profileCenter: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 0,
  },
  avatarGlow: {
    marginBottom: 10,
    borderRadius: 36,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.24,
        shadowRadius: 10,
      },
      android: {elevation: 4},
    }),
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: '#FFFFFF',
  },
  avatarProDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: C.text,
  },
  profileEmail: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: C.textMuted,
    marginTop: 2,
  },
  inlinePro: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inlineProText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileMeta: {
    marginTop: 3,
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: C.textMuted,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: C.text,
  },
  fieldLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: C.textMuted,
    marginBottom: 8,
  },
  partnerEmpty: {
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 2,
  },
  slashWrap: {
    width: 44,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  slash: {
    position: 'absolute',
    width: 38,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#C5CCD6',
    transform: [{rotate: '-32deg'}],
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: C.text,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: C.textMuted,
    textAlign: 'center',
  },
  codeHint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  codeValue: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 3,
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 12,
  },
  copyText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: C.primary,
  },
  dotIdle: {
    backgroundColor: '#FFD0D0',
  },
  waitingText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  pillBtn: {
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 2,
  },
  link: {
    color: C.primary,
    fontFamily: Fonts.semibold,
    fontSize: 13,
    paddingVertical: 4,
  },
  linkCenter: {
    textAlign: 'center',
    paddingTop: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  genderBtn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.genderIdle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOn: {
    backgroundColor: C.primary,
  },
  genderText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: C.genderIdleText,
  },
  genderTextOn: {
    color: '#FFFFFF',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.chipBorder,
    backgroundColor: C.surface,
    marginHorizontal: 3,
    marginBottom: 8,
  },
  chipLocked: {
    backgroundColor: '#F5F7FA',
    borderColor: '#E8EDF3',
  },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.text,
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
  chipLockedText: {
    color: C.textHint,
  },
  styleScroll: {
    paddingRight: 8,
    paddingBottom: 2,
  },
  previewCol: {
    width: PREVIEW_W,
    marginRight: 10,
  },
  previewCard: {
    width: PREVIEW_W,
    height: PREVIEW_H,
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingTop: 14,
    paddingHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#2D3436',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: {elevation: 2},
    }),
  },
  previewActive: {
    borderColor: C.primary,
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {elevation: 4},
    }),
  },
  previewSimple: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  previewName: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: C.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewPronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 6,
  },
  previewPron: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: C.textMuted,
  },
  previewBadge: {
    alignSelf: 'center',
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  previewBadgeText: {
    color: '#FFF',
    fontFamily: Fonts.semibold,
    fontSize: 9,
  },
  previewMeaning: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  previewMeaningSimple: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
  },
  waveArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
    overflow: 'hidden',
  },
  waveBack: {
    position: 'absolute',
    left: -20,
    right: -10,
    bottom: 0,
    height: 28,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 40,
    backgroundColor: '#FFD4D4',
  },
  waveFront: {
    position: 'absolute',
    left: -30,
    right: 20,
    bottom: 0,
    height: 20,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 30,
    backgroundColor: C.primary,
    opacity: 0.85,
  },
  styleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  checkOn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  styleName: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.textMuted,
  },
  styleNameOn: {
    color: C.primary,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF1F5',
  },
  accountRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: C.text,
  },
  accountEmail: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: C.textMuted,
  },
  accountRowStatic: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  logoutBtn: {
    marginTop: 4,
    marginBottom: 8,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: '#FFD0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...cardShadow,
  },
  logoutBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: C.primary,
  },
  versionLabel: {
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: C.textHint,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44,51,64,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: C.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    letterSpacing: 2,
    color: C.text,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF1F5',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancel: {
    color: C.textMuted,
    fontFamily: Fonts.semibold,
    fontSize: 14,
  },
  modalOk: {
    color: C.primary,
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});

export default PreferencesScreen;
