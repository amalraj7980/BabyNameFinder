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
  TextInput,
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
import {BrandMark} from '../../components/ui/DesignSystem';
import {disLikeUser} from '../../api';
import {AuthContext} from '../../context/AuthContext';
import {
  getDisplayName,
  isPartnerLinked,
} from '../../services/onboardingStorage';
import {applyAppStatusBar} from '../../components/AppStatusBar';
import {
  getActivePartnerSession,
  refreshPartnerConnection,
} from '../../services/partner.service';
import {
  queryLikes,
  subscribeReactions,
  hydrateReactionsStore,
} from '../../store/reactionsStore';
import {hydrateCloudReactions} from '../../services/reactions.service';
import {resolveDisplayName} from '../../utils/profileDisplay';

const keyExtractor = item => String(item.id);
const LIKED_PAGE_SIZE = 20;

const GENDER_FILTERS = [
  {label: 'All', value: 'all'},
  {label: 'Boy', value: 'male'},
  {label: 'Girl', value: 'female'},
  {label: 'Unisex', value: 'unisex'},
];

const MatchesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {userId, displayName: authDisplayName, isUserLoggedin} =
    useContext(AuthContext);

  const [likedNames, setLikedNames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localName, setLocalName] = useState('');
  const [partnerLinked, setPartnerLinked] = useState(false);
  const [partnerSession, setPartnerSession] = useState(null);
  const [dislikingId, setDislikingId] = useState(null);
  const [isLoadingMoreLiked, setIsLoadingMoreLiked] = useState(false);
  const [hasMoreLiked, setHasMoreLiked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const likedCursorRef = useRef(null);
  const loadingLikedRef = useRef(false);
  const loadingMoreLikedRef = useRef(false);
  const hasMoreLikedRef = useRef(true);
  const loadedCountRef = useRef(LIKED_PAGE_SIZE);
  const searchQueryRef = useRef('');
  const genderFilterRef = useRef('all');

  const refreshFromStore = useCallback((reset = false) => {
    if (reset) {
      loadedCountRef.current = LIKED_PAGE_SIZE;
    }
    const response = queryLikes({
      search: searchQueryRef.current,
      gender: genderFilterRef.current,
      pageSize: loadedCountRef.current,
    });
    setLikedNames(response?.likes ?? []);
    likedCursorRef.current = response?.nextCursor ?? null;
    hasMoreLikedRef.current = !!response?.hasMore;
    setHasMoreLiked(hasMoreLikedRef.current);
    setIsLoading(false);
  }, []);

  const fetchLiked = useCallback(async () => {
    if (loadingLikedRef.current) {
      return;
    }
    loadingLikedRef.current = true;
    setIsLoading(true);
    try {
      await hydrateReactionsStore();
      if (isUserLoggedin) {
        void hydrateCloudReactions(userId);
      }
      refreshFromStore(true);
    } catch (error) {
      console.error(`Failed to fetch likes: ${error}`);
      setIsLoading(false);
    } finally {
      loadingLikedRef.current = false;
    }
  }, [userId, isUserLoggedin, refreshFromStore]);

  const loadMoreLiked = useCallback(() => {
    if (
      loadingLikedRef.current ||
      loadingMoreLikedRef.current ||
      !hasMoreLikedRef.current
    ) {
      return;
    }
    loadingMoreLikedRef.current = true;
    setIsLoadingMoreLiked(true);
    loadedCountRef.current += LIKED_PAGE_SIZE;
    refreshFromStore(false);
    loadingMoreLikedRef.current = false;
    setIsLoadingMoreLiked(false);
  }, [refreshFromStore]);

  useFocusEffect(
    useCallback(() => {
      applyAppStatusBar('dark-content');
      let unsubLocal = () => {};
      (async () => {
        const name = await getDisplayName();
        setLocalName(name || '');
        try {
          const connection = await refreshPartnerConnection();
          setPartnerSession(connection.session);
          setPartnerLinked(!!connection.linked);
        } catch (e) {
          setPartnerSession(null);
          const linked = await isPartnerLinked();
          setPartnerLinked(linked);
        }
      })();
      unsubLocal = subscribeReactions(() => {
        refreshFromStore(false);
      });
      return () => {
        unsubLocal();
      };
    }, [fetchLiked, refreshFromStore, isUserLoggedin, authDisplayName]),
  );

  useEffect(() => {
    searchQueryRef.current = searchQuery;
    genderFilterRef.current = genderFilter;
    refreshFromStore(true);
  }, [searchQuery, genderFilter, refreshFromStore]);

  useEffect(() => {
    fetchLiked();
  }, [fetchLiked]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchLiked();
      const session = await getActivePartnerSession();
      setPartnerSession(session);
    } catch (e) {
      console.log(e);
    }
    setIsRefreshing(false);
  }, [fetchLiked]);

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
        await disLikeUser({
          userId: userId ?? 0,
          nameId: id,
          name: item.name,
          gender: item.gender,
          origin: item.origin,
          meaning: item.meaning,
          syllables: item.syllables,
          syllableCount: item.syllableCount,
        });
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

  const query = searchQuery.trim().toLowerCase();
  const hasActiveFilters = query.length > 0 || genderFilter !== 'all';
  const visibleNames = likedNames;

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

  const renderLikedEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={40} color={T.colors.primaryMuted} />
      <Text style={styles.emptyTitle}>
        {hasActiveFilters ? 'No matching favorites' : 'No favorite names yet'}
      </Text>
      <Text style={styles.emptySub}>
        {hasActiveFilters
          ? 'Try a different search or filter.'
          : 'Start exploring names and tap ❤ to save your favorites.'}
      </Text>
    </View>
  );

  const modeLabel =
    partnerLinked || partnerSession?.partnerUid ? 'with partner' : 'solo mode';
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

      <Text style={styles.title}>I Liked</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={T.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search liked names"
            placeholderTextColor={T.colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={T.colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            (filterOpen || genderFilter !== 'all') && styles.filterBtnActive,
          ]}
          onPress={() => setFilterOpen(open => !open)}
          accessibilityRole="button"
          accessibilityLabel="Filter liked names">
          <Ionicons
            name="options-outline"
            size={20}
            color={filterOpen || genderFilter !== 'all' ? T.colors.textOnPrimary : T.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {filterOpen ? (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Gender</Text>
          <View style={styles.filterChips}>
            {GENDER_FILTERS.map(option => {
              const selected = genderFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setGenderFilter(option.value)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.flex}>
        <FlatList
          data={visibleNames}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: T.colors.textPrimary,
    paddingVertical: 8,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.border,
  },
  filterBtnActive: {
    backgroundColor: T.colors.primary,
    borderColor: T.colors.primary,
  },
  filterPanel: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.colors.surface,
    borderWidth: 1,
    borderColor: T.colors.border,
  },
  filterLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: T.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: T.colors.background,
    borderWidth: 1,
    borderColor: T.colors.border,
  },
  chipSelected: {
    backgroundColor: T.colors.primary,
    borderColor: T.colors.primary,
  },
  chipText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: T.colors.textPrimary,
  },
  chipTextSelected: {
    color: T.colors.textOnPrimary,
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
