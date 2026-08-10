import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {BrandMark, SegmentedTabs} from '../../components/ui/DesignSystem';
import {getReactions} from '../../api';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import {
  getDisplayName,
  isPartnerLinked,
} from '../../services/onboardingStorage';

const keyExtractor = item => String(item.id);

const TAB_OPTIONS = [
  {label: 'My Matches', value: 'matches'},
  {label: 'I Liked', value: 'liked'},
];

const MatchesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {userId} = useContext(AuthContext);
  const {likeCount, dislikeCount} = useContext(AppContext);

  const [tab, setTab] = useState('matches');
  const [likedNames, setLikedNames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayName, setDisplayNameState] = useState('');
  const [partnerLinked, setPartnerLinked] = useState(false);

  useEffect(() => {
    (async () => {
      const name = await getDisplayName();
      const linked = await isPartnerLinked();
      setDisplayNameState(name || '');
      setPartnerLinked(linked);
    })();
  }, []);

  const fetchLiked = useCallback(async () => {
    setIsLoading(true);
    const queryParams = {
      pageCount: 1000,
      page: 0,
      startWith: '',
      endsWith: '',
      compoundName: false,
      gender: 'all',
      contains: '',
    };
    try {
      const response = await getReactions(userId, queryParams);
      setLikedNames(response?.likes ?? []);
    } catch (error) {
      console.error(`Failed to fetch likes: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (tab === 'liked') {
      fetchLiked();
    }
  }, [tab, fetchLiked, likeCount, dislikeCount, userId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchLiked();
    } catch (e) {
      console.log(e);
    }
    setIsRefreshing(false);
  }, [fetchLiked]);

  const openDetails = useCallback(
    item => navigation.navigate('NameInformation', {item}),
    [navigation],
  );

  const contentPad = useMemo(
    () => ({
      flexGrow: 1,
      paddingHorizontal: 14,
      paddingBottom: Math.max(insets.bottom, 12) + 16,
    }),
    [insets.bottom],
  );

  const renderLikedCard = useCallback(
    ({item}) => {
      const origin = item.origin || item.gender || '';
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => openDetails(item)}>
          <Text style={styles.cardName}>{item.name}</Text>
          {origin ? <Text style={styles.originText}>{origin}</Text> : null}
          <Text style={styles.meaning} numberOfLines={2}>
            {item.meaning || ''}
          </Text>
          <View style={styles.cardFooterRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={T.colors.textTertiary}
            />
            <Text style={styles.cardFooter}>
              Your partner hasn't seen this yet
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [openDetails],
  );

  const renderMatchesEmpty = () => (
    <View style={styles.empty}>
      <Ionicons
        name="heart-dislike-outline"
        size={42}
        color={T.colors.primaryMuted}
      />
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySub}>
        Keep swiping, your first match is coming!
      </Text>
    </View>
  );

  const renderLikedEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={40} color={T.colors.primaryMuted} />
      <Text style={styles.emptyTitle}>No likes yet</Text>
      <Text style={styles.emptySub}>Names you like will show up here.</Text>
    </View>
  );

  const modeLabel = partnerLinked ? 'with partner' : 'solo mode';
  const headerName = displayName || 'You';

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <BrandMark size={28} />
        <Text style={styles.headerMode} numberOfLines={1}>
          {headerName} ({modeLabel})
        </Text>
      </View>

      <Text style={styles.title}>Matches</Text>

      <View style={styles.tabsWrap}>
        <SegmentedTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </View>

      {tab === 'matches' ? (
        <View style={styles.flex}>{renderMatchesEmpty()}</View>
      ) : (
        <View style={styles.flex}>
          <FlatList
            data={likedNames}
            keyExtractor={keyExtractor}
            renderItem={renderLikedCard}
            contentContainerStyle={contentPad}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={isLoading ? null : renderLikedEmpty}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[T.colors.primary]}
                tintColor={T.colors.primary}
              />
            }
          />
          {isLoading && likedNames.length === 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={T.colors.primary} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 8,
  },
  headerMode: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: T.colors.textPrimary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: T.colors.textPrimary,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  tabsWrap: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: 18,
    padding: 14,
    ...T.shadow.soft,
  },
  cardName: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: T.colors.textPrimary,
    marginBottom: 4,
  },
  originText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: T.colors.textSecondary,
    marginBottom: 6,
  },
  meaning: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: T.colors.textSecondary,
    marginBottom: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardFooter: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: T.colors.textTertiary,
  },
  sep: {height: 10},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyTitle: {
    marginTop: 12,
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: T.colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: T.colors.textSecondary,
    textAlign: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MatchesScreen;
