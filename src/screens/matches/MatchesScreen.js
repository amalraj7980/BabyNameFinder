import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
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
import {useFocusEffect} from '@react-navigation/native';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {BrandMark, SegmentedTabs} from '../../components/ui/DesignSystem';
import {getLikedNamesPage, disLikeUser} from '../../api';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import {
  getDisplayName,
  isPartnerLinked,
} from '../../services/onboardingStorage';
import {applyAppStatusBar} from '../../components/AppStatusBar';
import {
  getActivePartnerSession,
  subscribePartnerFavorites,
  categorizePartnerFavorites,
  refreshPartnerConnection,
} from '../../services/partner.service';
import {fetchAllBabyNames} from '../../services/babyNames.service';
import {subscribeLocalFavorites} from '../../services/localFavorites.service';
import {resolveDisplayName} from '../../utils/profileDisplay';
import auth from '@react-native-firebase/auth';

const keyExtractor = item => String(item.id);

const TAB_OPTIONS = [
  {label: 'My Matches', value: 'matches'},
  {label: 'I Liked', value: 'liked'},
];
const LIKED_PAGE_SIZE = 20;

const MatchesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {userId, displayName: authDisplayName, isUserLoggedin} =
    useContext(AuthContext);
  const {likeCount, dislikeCount} = useContext(AppContext);

  const [tab, setTab] = useState('matches');
  const [likedNames, setLikedNames] = useState([]);
  const [bothLikeNames, setBothLikeNames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localName, setLocalName] = useState('');
  const [partnerLinked, setPartnerLinked] = useState(false);
  const [partnerSession, setPartnerSession] = useState(null);
  const [dislikingId, setDislikingId] = useState(null);
  const [isLoadingMoreLiked, setIsLoadingMoreLiked] = useState(false);
  const [hasMoreLiked, setHasMoreLiked] = useState(true);
  const likedCursorRef = useRef(null);
  const loadingLikedRef = useRef(false);
  const loadingMoreLikedRef = useRef(false);
  const hasMoreLikedRef = useRef(true);

  const fetchLiked = useCallback(async () => {
    if (loadingLikedRef.current) {
      return;
    }
    loadingLikedRef.current = true;
    setIsLoading(true);
    try {
      const response = await getLikedNamesPage(userId, {
        pageSize: LIKED_PAGE_SIZE,
      });
      setLikedNames(response?.likes ?? []);
      likedCursorRef.current = response?.nextCursor ?? null;
      hasMoreLikedRef.current = !!response?.hasMore;
      setHasMoreLiked(hasMoreLikedRef.current);
    } catch (error) {
      console.error(`Failed to fetch likes: ${error}`);
    } finally {
      loadingLikedRef.current = false;
      setIsLoading(false);
    }
  }, [userId]);

  const loadMoreLiked = useCallback(async () => {
    if (
      loadingLikedRef.current ||
      loadingMoreLikedRef.current ||
      !hasMoreLikedRef.current ||
      !likedCursorRef.current
    ) {
      return;
    }

    loadingMoreLikedRef.current = true;
    setIsLoadingMoreLiked(true);
    try {
      const response = await getLikedNamesPage(userId, {
        pageSize: LIKED_PAGE_SIZE,
        cursor: likedCursorRef.current,
      });
      const nextPage = response?.likes ?? [];
      setLikedNames(previous => {
        const knownIds = new Set(previous.map(item => String(item.id)));
        return [
          ...previous,
          ...nextPage.filter(item => !knownIds.has(String(item.id))),
        ];
      });
      likedCursorRef.current = response?.nextCursor ?? null;
      hasMoreLikedRef.current = !!response?.hasMore;
      setHasMoreLiked(hasMoreLikedRef.current);
    } catch (error) {
      console.error(`Failed to load more likes: ${error}`);
    } finally {
      loadingMoreLikedRef.current = false;
      setIsLoadingMoreLiked(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      applyAppStatusBar('dark-content');
      let unsubLocal = () => {};
      let unsubPartner = () => {};
      (async () => {
        const name = await getDisplayName();
        setLocalName(name || '');
        try {
          const connection = await refreshPartnerConnection();
          setPartnerSession(connection.session);
          setPartnerLinked(!!connection.linked);
          const session = connection.session;
          const myUid = userId || auth().currentUser?.uid;
          if (session?.id && myUid) {
            unsubPartner = subscribePartnerFavorites(session.id, async docs => {
              const partnerUid =
                session.ownerUid === myUid
                  ? session.partnerUid
                  : session.ownerUid;
              const {both} = categorizePartnerFavorites(
                docs,
                myUid,
                partnerUid,
              );
              const all = await fetchAllBabyNames().catch(() => []);
              const byId = new Map(all.map(n => [String(n.id), n]));
              setBothLikeNames(
                both.map(
                  d =>
                    byId.get(String(d.nameId || d.id)) || {
                      id: d.nameId || d.id,
                      name: d.nameId || d.id,
                    },
                ),
              );
            });
          } else {
            setBothLikeNames([]);
          }
        } catch (e) {
          setPartnerSession(null);
          const linked = await isPartnerLinked();
          setPartnerLinked(linked);
        }
      })();
      unsubLocal = subscribeLocalFavorites(() => {
        if (tab === 'liked') {
          void fetchLiked();
        }
      });
      return () => {
        unsubLocal();
        unsubPartner();
      };
    }, [userId, fetchLiked, isUserLoggedin, authDisplayName, tab]),
  );

  useEffect(() => {
    if (tab === 'liked') {
      fetchLiked();
    }
  }, [tab, fetchLiked, likeCount, dislikeCount, userId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (tab === 'liked') {
        await fetchLiked();
      } else {
        const session = await getActivePartnerSession();
        setPartnerSession(session);
      }
    } catch (e) {
      console.log(e);
    }
    setIsRefreshing(false);
  }, [fetchLiked, tab]);

  const openDetails = useCallback(
    item => navigation.navigate('NameInformation', {item}),
    [navigation],
  );

  const onDislikeLiked = useCallback(
    async item => {
      if (!item?.id || dislikingId) {
        return;
      }
      const id = String(item.id);
      setDislikingId(id);
      setLikedNames(prev => prev.filter(n => String(n.id) !== id));
      try {
        await disLikeUser({userId: userId ?? 0, nameId: id});
      } catch (e) {
        console.log('Matches dislike failed:', e);
        setLikedNames(prev => {
          if (prev.some(n => String(n.id) === id)) {
            return prev;
          }
          return [item, ...prev];
        });
      } finally {
        setDislikingId(null);
      }
    },
    [dislikingId, userId],
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
      const busy = dislikingId === String(item.id);
      return (
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openDetails(item)}
            style={styles.cardBody}>
            <Text style={styles.cardName}>{item.name}</Text>
            {origin ? <Text style={styles.originText}>{origin}</Text> : null}
            <Text style={styles.meaning} numberOfLines={2}>
              {item.meaning || 'Meaning coming soon'}
            </Text>
            <View style={styles.cardFooterRow}>
              <Ionicons name="heart" size={12} color={T.colors.primary} />
              <Text style={styles.cardFooter}>Saved favorite</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dislikeBtn, busy && styles.dislikeBtnBusy]}
            onPress={() => {
              void onDislikeLiked(item);
            }}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Dislike ${item.name}`}>
            {busy ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="thumbs-down" size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [openDetails, onDislikeLiked, dislikingId],
  );

  const renderMatchCard = useCallback(
    ({item}) => {
      const origin = item.origin || item.gender || '';
      return (
        <TouchableOpacity
          style={[styles.card, styles.matchCard]}
          activeOpacity={0.85}
          onPress={() => openDetails(item)}>
          <View style={styles.bothBadge}>
            <Ionicons name="heart" size={11} color="#FFF" />
            <Text style={styles.bothBadgeText}>Both like</Text>
          </View>
          <Text style={styles.cardName}>{item.name}</Text>
          {origin ? <Text style={styles.originText}>{origin}</Text> : null}
          <Text style={styles.meaning} numberOfLines={2}>
            {item.meaning || 'Meaning coming soon'}
          </Text>
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
        {partnerSession?.partnerUid
          ? 'Keep liking names — matches appear when you both like the same one.'
          : 'Shared matches appear when both people like the same name.'}
      </Text>
    </View>
  );

  const renderLikedEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={40} color={T.colors.primaryMuted} />
      <Text style={styles.emptyTitle}>No favorite names yet</Text>
      <Text style={styles.emptySub}>
        Start exploring names and tap ❤ to save your favorites.
      </Text>
    </View>
  );

  const modeLabel = partnerLinked || partnerSession?.partnerUid
    ? 'with partner'
    : 'solo mode';
  const headerName = resolveDisplayName({
    localName,
    authDisplayName,
    isUserLoggedin,
  });

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
        <View style={styles.flex}>
          <FlatList
            data={bothLikeNames}
            keyExtractor={keyExtractor}
            renderItem={renderMatchCard}
            contentContainerStyle={contentPad}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              bothLikeNames.length ? (
                <Text style={styles.sectionLabel}>Both Like</Text>
              ) : null
            }
            ListEmptyComponent={renderMatchesEmpty}
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
        </View>
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
            onEndReached={() => {
              void loadMoreLiked();
            }}
            onEndReachedThreshold={0.45}
            ListFooterComponent={
              isLoadingMoreLiked ? (
                <View style={styles.pageLoader}>
                  <ActivityIndicator size="small" color={T.colors.primary} />
                </View>
              ) : hasMoreLiked && likedNames.length ? (
                <View style={styles.pageHint}>
                  <Text style={styles.pageHintText}>Scroll for more favorites</Text>
                </View>
              ) : null
            }
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
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: T.colors.primary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...T.shadow.soft,
  },
  cardBody: {
    flex: 1,
  },
  dislikeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5C6B7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dislikeBtnBusy: {
    opacity: 0.7,
  },
  matchCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,107,0.35)',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  bothBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  bothBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 0.3,
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
    paddingTop: 48,
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
  pageLoader: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  pageHint: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageHintText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: T.colors.textTertiary,
  },
});

export default MatchesScreen;
