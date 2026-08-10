import React, {useMemo, useState, useCallback, useContext} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {likeUser, disLikeUser} from '../../api';
import {AuthContext} from '../../context/AuthContext';
import {speakNamePronunciation} from '../../services/speakPronunciation';
import {shareBabyName} from '../../services/shareBabyName';
import {getTabBarStyle} from '../../routes/tabBarStyles';

const Section = ({title, subtitle, children, defaultOpen = true}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
        </View>
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={T.colors.textTertiary}
        />
      </TouchableOpacity>
      {open ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
};

const NameInformation = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {userId} = useContext(AuthContext);
  const nameInfo = route?.params?.item || {};
  const initial = useMemo(
    () => (nameInfo.name || '?').charAt(0).toUpperCase(),
    [nameInfo.name],
  );

  // Hide bottom tabs while name details is open
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

  const onPass = useCallback(async () => {
    try {
      await disLikeUser({userId: userId ?? 0, nameId: nameInfo.id});
    } catch (e) {
      // ignore
    }
    navigation.goBack();
  }, [navigation, userId, nameInfo.id]);

  const onLike = useCallback(async () => {
    try {
      await likeUser({userId: userId ?? 0, nameId: nameInfo.id});
    } catch (e) {
      // ignore
    }
    navigation.goBack();
  }, [navigation, userId, nameInfo.id]);

  const onHearPronunciation = useCallback(() => {
    void speakNamePronunciation(
      nameInfo.name,
      nameInfo.syllables || nameInfo.pronunciation,
    );
  }, [nameInfo.name, nameInfo.syllables, nameInfo.pronunciation]);

  const onShare = useCallback(() => {
    void shareBabyName(nameInfo.name);
  }, [nameInfo.name]);

  const footerPad = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={20} color={T.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nameInfo.name || 'Name'}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share name">
          <Ionicons
            name="share-outline"
            size={18}
            color={T.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.hearBtn}
        activeOpacity={0.85}
        onPress={onHearPronunciation}>
        <Ionicons name="bar-chart" size={13} color={T.colors.primary} />
        <Text style={styles.hearText}>Tap to hear pronunciation</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Section title="Origin & Meaning">
          {nameInfo.origin ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{nameInfo.origin}</Text>
            </View>
          ) : null}
          <Text style={styles.body}>
            {nameInfo.meaning || 'Meaning coming soon.'}
          </Text>
        </Section>

        <Section title="Fun Fact" subtitle="Highlights about this name">
          <View style={styles.fact}>
            <Text style={styles.factText}>
              Gender: {nameInfo.gender || '—'}
            </Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factText}>
              Syllables: {nameInfo.syllables || nameInfo.syllableCount || '—'}
            </Text>
          </View>
        </Section>

        <Section
          title={`Famous ${nameInfo.name || 'names'}`}
          subtitle="Notable people with this name"
          defaultOpen={false}>
          <View style={styles.famousRow}>
            <View style={styles.famousCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={styles.famousName}>Coming soon</Text>
              <Text style={styles.famousRole}>Famous namesakes</Text>
            </View>
          </View>
        </Section>
      </ScrollView>

      {/* Fixed bottom action placeholder (Pass / Like) — no tab bar behind */}
      <View style={[styles.footer, {paddingBottom: footerPad}]}>
        <TouchableOpacity
          style={styles.passBtn}
          onPress={onPass}
          activeOpacity={0.85}>
          <Ionicons name="close" size={16} color={T.colors.primary} />
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={onLike}
          activeOpacity={0.85}>
          <Ionicons name="heart" size={16} color={T.colors.textOnPrimary} />
          <Text style={styles.likeText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.shadow.soft,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: T.colors.textPrimary,
  },
  hearBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.colors.primaryMuted,
    borderColor: T.colors.primaryBorder,
    borderWidth: 1,
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  hearText: {
    color: T.colors.primary,
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    ...T.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {flex: 1},
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: T.colors.textPrimary,
  },
  cardSub: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: T.colors.textSecondary,
  },
  cardBody: {
    marginTop: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: T.colors.textSecondary,
  },
  fact: {
    backgroundColor: T.colors.surfaceMint,
    borderLeftWidth: 3,
    borderLeftColor: T.colors.accentMint,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  factText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: T.colors.textPrimary,
  },
  famousRow: {
    flexDirection: 'row',
  },
  famousCard: {
    flex: 1,
    backgroundColor: T.colors.surfacePeach,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  famousName: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: T.colors.textPrimary,
  },
  famousRole: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: T.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.colors.borderSoft,
    backgroundColor: T.colors.surface,
  },
  passBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: T.colors.primary,
    backgroundColor: T.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  passText: {
    color: T.colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  likeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  likeText: {
    color: T.colors.textOnPrimary,
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});

export default NameInformation;
