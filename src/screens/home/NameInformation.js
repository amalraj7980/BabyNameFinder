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

const asText = value => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    return value.name || value.text || value.title || value.description || '';
  }
  return '';
};

const asList = value => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => {
      if (typeof item === 'string') {
        return {title: item, subtitle: ''};
      }
      if (item && typeof item === 'object') {
        return {
          title: item.name || item.title || item.label || '',
          subtitle: item.role || item.description || item.subtitle || '',
        };
      }
      return null;
    })
    .filter(item => item?.title);
};

const Section = ({title, subtitle, children, defaultOpen = true}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{expanded: open}}>
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
  const raw = route?.params?.item || {};

  const nameInfo = useMemo(() => {
    const origin = asText(raw.origin);
    const meaning =
      asText(raw.meaning) ||
      (typeof raw.origin === 'object' ? asText(raw.origin?.description) : '');
    const syllables =
      asText(raw.syllables) ||
      asText(raw.pronunciation) ||
      asText(raw.name);
    return {
      id: raw.id,
      name: asText(raw.name) || 'Name',
      gender: asText(raw.gender) || '—',
      origin,
      meaning,
      syllables,
      syllableCount: raw.syllableCount || 1,
      funFacts: Array.isArray(raw.funFacts)
        ? raw.funFacts.map(asText).filter(Boolean)
        : [],
      famousPeople: asList(raw.famousPeople),
      variations: Array.isArray(raw.variations)
        ? raw.variations.map(asText).filter(Boolean)
        : [],
      tags: Array.isArray(raw.tags) ? raw.tags.map(asText).filter(Boolean) : [],
      status: asText(raw.status),
    };
  }, [raw]);

  const initial = useMemo(
    () => (nameInfo.name || '?').charAt(0).toUpperCase(),
    [nameInfo.name],
  );

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
    void speakNamePronunciation(nameInfo.name, nameInfo.syllables);
  }, [nameInfo.name, nameInfo.syllables]);

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {nameInfo.name}
        </Text>
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

      {nameInfo.syllables ? (
        <Text style={styles.pronunciationLine}>{nameInfo.syllables}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.hearBtn}
        activeOpacity={0.85}
        onPress={onHearPronunciation}>
        <Ionicons name="volume-medium" size={14} color={T.colors.primary} />
        <Text style={styles.hearText}>Tap to hear pronunciation</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
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

        <Section title="Highlights" subtitle="Quick facts about this name">
          <View style={styles.fact}>
            <Text style={styles.factText}>Gender: {nameInfo.gender}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factText}>
              Pronunciation: {nameInfo.syllables || '—'}
            </Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factText}>
              Syllable count: {nameInfo.syllableCount || '—'}
            </Text>
          </View>
        </Section>

        {nameInfo.funFacts.length ? (
          <Section title="Fun Facts" subtitle="Highlights about this name">
            {nameInfo.funFacts.map((fact, index) => (
              <View key={`fact-${index}`} style={styles.fact}>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {nameInfo.variations.length ? (
          <Section title="Variations" subtitle="Related spellings">
            <View style={styles.chipRow}>
              {nameInfo.variations.map(item => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {nameInfo.tags.length ? (
          <Section title="Tags" defaultOpen={false}>
            <View style={styles.chipRow}>
              {nameInfo.tags.map(item => (
                <View key={item} style={[styles.chip, styles.chipSoft]}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section
          title={`Famous ${nameInfo.name}`}
          subtitle="Notable people with this name"
          defaultOpen={false}>
          {nameInfo.famousPeople.length ? (
            <View style={styles.famousWrap}>
              {nameInfo.famousPeople.map((person, index) => (
                <View key={`${person.title}-${index}`} style={styles.famousCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(person.title || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.famousName}>{person.title}</Text>
                  {person.subtitle ? (
                    <Text style={styles.famousRole}>{person.subtitle}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.famousCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={styles.famousName}>Coming soon</Text>
              <Text style={styles.famousRole}>Famous namesakes</Text>
            </View>
          )}
        </Section>
      </ScrollView>

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
    paddingHorizontal: 8,
  },
  pronunciationLine: {
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.colors.textSecondary,
    marginBottom: 6,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: T.colors.surfacePeach,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSoft: {
    backgroundColor: T.colors.primaryMuted,
  },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: T.colors.textPrimary,
  },
  famousWrap: {
    gap: 8,
  },
  famousCard: {
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
