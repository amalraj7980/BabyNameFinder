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
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {AppContext} from '../../context/AppContext';
import {
  getDisplayName,
  setDisplayName,
  getGenderPrefs,
  setGenderPrefs,
  getStylePrefs,
  setStylePrefs,
  getOrCreatePartnerCode,
  regeneratePartnerCode,
  getInviteSent,
  setInviteSent,
  getPartnerCode,
  isPartnerLinked,
  setPartnerLinked,
} from '../../services/onboardingStorage';

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

const STYLE_OPTIONS = [
  {id: 'classic', label: 'Classic', color: C.mint},
  {id: 'modern', label: 'Modern'},
  {id: 'vintage', label: 'Vintage Revival'},
  {id: 'short', label: 'Short & Sweet'},
  {id: 'neutral', label: 'Gender-Neutral'},
];

const ACCOUNT_ROWS = [
  {key: 'notifications', label: 'Notifications', icon: 'notifications', color: '#4C9AFF'},
  {key: 'privacy', label: 'Privacy', icon: 'lock-closed', color: '#34C759'},
  {key: 'terms', label: 'Terms of Use', icon: 'document-text', color: '#FFCC00'},
  {key: 'help', label: 'Help & Support', icon: 'help-circle', color: '#FF6B8A'},
  {key: 'restore', label: 'Restore Purchases', icon: 'refresh', color: C.primary},
];

const WaitingDots = () => {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setActive(p => (p + 1) % 3), 450);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active ? styles.dotActive : styles.dotIdle,
          ]}
        />
      ))}
    </View>
  );
};

const PillButton = ({title, icon, onPress}) => (
  <TouchableOpacity style={styles.pillBtn} onPress={onPress} activeOpacity={0.88}>
    <View style={styles.pillBtnInner}>
      {icon}
      <Text style={styles.pillBtnText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const StyleChip = ({label, selected, selectedColor, onPress}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[
      styles.chip,
      selected && {
        backgroundColor: selectedColor || C.mint,
        borderColor: selectedColor || C.mint,
      },
    ]}>
    <Text style={[styles.chipText, selected && styles.chipTextOn]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PreferencesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {discoverCardStyle, updateDiscoverCardStyle, isPrime} =
    useContext(AppContext);
  const [displayName, setDisplayNameState] = useState('');
  const [nameModal, setNameModal] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [inviteSent, setInviteSentState] = useState(false);
  const [partnerLinked, setPartnerLinkedState] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [boy, setBoy] = useState(true);
  const [girl, setGirl] = useState(true);
  const [stylesSelected, setStylesSelected] = useState(['classic']);
  const [codeModal, setCodeModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const cardStyle = discoverCardStyle || 'detailed';

  const loadPrefs = useCallback(async () => {
    const [name, linked, invited, code, g, s] = await Promise.all([
      getDisplayName(),
      isPartnerLinked(),
      getInviteSent(),
      getPartnerCode(),
      getGenderPrefs(),
      getStylePrefs(),
    ]);
    setDisplayNameState(name || '');
    setPartnerLinkedState(linked);
    setInviteSentState(invited);
    setPartnerCode(code);
    setBoy(!!g.boy);
    setGirl(!!g.girl);
    setStylesSelected(Array.isArray(s) && s.length ? s : ['classic']);
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const persistGender = useCallback(async (nextBoy, nextGirl) => {
    setBoy(nextBoy);
    setGirl(nextGirl);
    await setGenderPrefs({boy: nextBoy, girl: nextGirl});
  }, []);

  const toggleStyle = useCallback(async id => {
    setStylesSelected(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      void setStylePrefs(next);
      return next;
    });
  }, []);

  const selectCardStyle = useCallback(
    async style => {
      await updateDiscoverCardStyle(style);
    },
    [updateDiscoverCardStyle],
  );

  const invitePartner = useCallback(async () => {
    try {
      const code = await getOrCreatePartnerCode();
      setPartnerCode(code);
      await setInviteSent(true);
      setInviteSentState(true);
      await Share.open({
        title: 'Invite your partner',
        message: `Join me on Baby Names Together! Use code ${code} to start matching names together.`,
      });
    } catch (e) {
      // cancelled
    }
  }, []);

  const shareLink = useCallback(async () => {
    try {
      const code = partnerCode || (await getOrCreatePartnerCode());
      setPartnerCode(code);
      await Share.open({
        title: 'Share invite link',
        message: `Join me on Baby Names Together with code ${code}`,
      });
    } catch (e) {
      // cancelled
    }
  }, [partnerCode]);

  const copyCode = useCallback(async () => {
    const code = partnerCode || (await getOrCreatePartnerCode());
    setPartnerCode(code);
    Toast.show({type: 'success', text1: 'Code copied', text2: code});
    try {
      await Share.open({title: 'Partner code', message: code});
    } catch (e) {
      // cancelled after toast
    }
  }, [partnerCode]);

  const generateNewLink = useCallback(async () => {
    const code = await regeneratePartnerCode();
    setPartnerCode(code);
    setInviteSentState(true);
    Toast.show({type: 'success', text1: 'New invite code ready'});
  }, []);

  const joinWithCode = useCallback(async () => {
    if (joinCode.trim().length < 4) {
      Alert.alert('Enter a valid invite code');
      return;
    }
    await setPartnerLinked(true);
    await setInviteSent(true);
    setPartnerLinkedState(true);
    setInviteSentState(true);
    const code = await getOrCreatePartnerCode();
    setPartnerCode(code);
    setCodeModal(false);
    Toast.show({type: 'success', text1: 'Partner connected'});
  }, [joinCode]);

  const saveName = useCallback(async () => {
    const next = nameDraft.trim();
    await setDisplayName(next);
    setDisplayNameState(next);
    setNameModal(false);
  }, [nameDraft]);

  const onAccountPress = useCallback(
    key => {
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
    [navigation],
  );

  const initial = (displayName || 'Y').charAt(0).toUpperCase();
  const showWaiting = inviteSent && !partnerLinked;

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
              <Text style={styles.profileName}>{displayName || 'You'}</Text>
              {isPrime ? (
                <View style={styles.inlinePro}>
                  <Text style={styles.inlineProText}>PRO</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.profileMeta}>Swiping since August 2026</Text>
          </View>
        </View>

        {/* Partner */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="link" size={14} color={C.primary} />
            <Text style={styles.cardHeaderTitle}>Partner Connection</Text>
          </View>

          {showWaiting ? (
            <>
              <Text style={styles.codeHint}>
                Ask your partner to tap on the link you just shared, or they can
                use this code instead:
              </Text>
              <Text style={styles.codeValue}>{partnerCode}</Text>
              <TouchableOpacity style={styles.copyRow} onPress={copyCode}>
                <Ionicons name="copy-outline" size={14} color={C.primary} />
                <Text style={styles.copyText}>Copy code</Text>
              </TouchableOpacity>
              <WaitingDots />
              <Text style={styles.waitingText}>
                Waiting for your partner to join...
              </Text>
              <PillButton
                title="Share Link"
                onPress={shareLink}
                icon={
                  <Ionicons
                    name="share-outline"
                    size={14}
                    color={C.surface}
                  />
                }
              />
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={() => setCodeModal(true)}>
                  <Text style={styles.link}>I have a code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={generateNewLink}>
                  <Text style={styles.link}>Generate a new link</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : partnerLinked ? (
            <>
              <View style={styles.partnerEmpty}>
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={C.mint}
                />
                <Text style={styles.emptyTitle}>Partner connected</Text>
                <Text style={styles.emptySub}>
                  You're matching names together
                </Text>
              </View>
              <Text style={styles.codeValue}>{partnerCode}</Text>
              <PillButton
                title="Share Link"
                onPress={shareLink}
                icon={
                  <Ionicons
                    name="share-outline"
                    size={14}
                    color={C.surface}
                  />
                }
              />
            </>
          ) : (
            <>
              <View style={styles.partnerEmpty}>
                <View style={styles.slashWrap}>
                  <Ionicons name="people" size={30} color="#C5CCD6" />
                  <View style={styles.slash} />
                </View>
                <Text style={styles.emptyTitle}>No partner connected</Text>
                <Text style={styles.emptySub}>
                  Connect to find names together
                </Text>
              </View>
              <PillButton
                title="Invite Partner"
                onPress={invitePartner}
                icon={<Ionicons name="link" size={14} color={C.surface} />}
              />
              <TouchableOpacity onPress={() => setCodeModal(true)}>
                <Text style={[styles.link, styles.linkCenter]}>
                  I have a code
                </Text>
              </TouchableOpacity>
            </>
          )}
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
            {STYLE_OPTIONS.map(opt => (
              <StyleChip
                key={opt.id}
                label={opt.label}
                selected={stylesSelected.includes(opt.id)}
                selectedColor={opt.color || C.mint}
                onPress={() => toggleStyle(opt.id)}
              />
            ))}
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
      </ScrollView>

      <Modal visible={codeModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter invite code</Text>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              placeholder="XM5XV8"
              placeholderTextColor={C.textHint}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setCodeModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={joinWithCode}>
                <Text style={styles.modalOk}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.chipBorder,
    backgroundColor: C.surface,
    marginHorizontal: 3,
    marginBottom: 8,
  },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.text,
  },
  chipTextOn: {
    color: '#FFFFFF',
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
