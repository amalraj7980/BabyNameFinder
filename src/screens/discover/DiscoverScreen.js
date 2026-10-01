import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {applyAppStatusBar} from '../../components/AppStatusBar';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {BrandMark} from '../../components/ui/DesignSystem';
import {NamesLoadingState} from '../../components/NamesLoadingState';
import {
  disLikeUser,
  likeUser,
  undoLikeUser,
  undoDisLikeUser,
  getExcludeReactionsPage,
  getFilteredNamesCount,
  getRemainingNamesCount,
  getTotalNamesCount,
} from '../../api';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {Storage} from '../../util';
import {
  getDisplayName,
} from '../../services/onboardingStorage';
import {speakNamePronunciation} from '../../services/speakPronunciation';
import {shareBabyName} from '../../services/shareBabyName';
import {resolveDisplayName} from '../../utils/profileDisplay';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

/** Match Figma Discover proportions */
const CARD_WIDTH = SCREEN_W * 0.86;
const CARD_HEIGHT_DETAILED = Math.min(SCREEN_H * 0.42, 390);
const CARD_HEIGHT_SIMPLE = Math.min(SCREEN_H * 0.30, 280);
const CARD_H_MARGIN = (SCREEN_W - CARD_WIDTH) / 2;
const DISCOVER_PAGE_SIZE = 20;
const PREFETCH_REMAINING_CARDS = 4;
/** Overlay wash + PASS/LIKE appear from a small drag, fully visible at ~10% swipe. */
const OVERLAY_FADE_START = Math.max(10, SCREEN_W * 0.03);
const OVERLAY_VISIBLE_AT = SCREEN_W * 0.1;
const OVERLAY_OPACITY_INPUT_X = [
  -OVERLAY_VISIBLE_AT,
  -OVERLAY_FADE_START,
  0,
  OVERLAY_FADE_START,
  OVERLAY_VISIBLE_AT,
];
const OVERLAY_OPACITY_OUTPUT_X = [1, 0.55, 0, 0.55, 1];
const ACTION_OUTLINE_FULL_AT = SCREEN_W * 0.22;

const hasSelectedFilters = filters =>
  Boolean(
    (filters?.firstLetter || filters?.startWith || '').toString().trim() ||
      (filters?.lastLetter || filters?.endsWith || '').toString().trim() ||
      (filters?.contains || '').toString().trim() ||
      (filters?.originQuery || '').toString().trim() ||
      filters?.compoundLetter ||
      filters?.compoundName === true ||
      filters?.compoundName === 'true' ||
      (filters?.gender && filters.gender !== 'all') ||
      (filters?.nameLength && filters.nameLength !== 'all') ||
      (filters?.style && filters.style !== 'all') ||
      (Array.isArray(filters?.origins) && filters.origins.length > 0),
  );

const buildDiscoverQueryParams = (seachfilterData, userId, extras = {}) => ({
  pageSize: DISCOVER_PAGE_SIZE,
  u: userId ?? 0,
  startWith: (seachfilterData?.firstLetter || '').toString().trim(),
  endsWith: (seachfilterData?.lastLetter || '').toString().trim(),
  compoundName: !!seachfilterData?.compoundLetter,
  gender: seachfilterData?.gender ?? 'all',
  contains: (seachfilterData?.contains || '').toString().trim(),
  originQuery: (seachfilterData?.originQuery || '').toString().trim(),
  nameLength: seachfilterData?.nameLength ?? 'all',
  style: seachfilterData?.style ?? 'all',
  origins: Array.isArray(seachfilterData?.origins) ? seachfilterData.origins : [],
  cursor: extras.cursor ?? null,
  reactedIds: extras.reactedIds,
  excludeIds: extras.excludeIds,
});

const C = T.colors;

/** Centered empty deck — icon, soft motion, clear next step. */
const DiscoverDeckEmpty = ({
  title,
  subtitle,
  primaryLabel,
  onPrimaryPress,
  primaryIcon = 'options-outline',
  secondaryLabel,
  onSecondaryPress,
  loading = false,
}) => {
  const appear = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      return undefined;
    }
    appear.setValue(0);
    Animated.spring(appear, {
      toValue: 1,
      friction: 7,
      tension: 48,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [appear, float, title, loading]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const scale = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  if (loading) {
    return <NamesLoadingState message={subtitle || 'Finding names…'} />;
  }

  return (
    <Animated.View
      style={[
        styles.empty,
        {
          opacity: appear,
          transform: [{scale}],
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${subtitle}`}>
      <Animated.View
        style={[styles.emptyIconRing, {transform: [{translateY}]}]}>
        <View style={styles.emptyIconGlow} />
        <View style={styles.emptyIconInner}>
          <Ionicons name="sparkles-outline" size={34} color={C.primary} />
        </View>
      </Animated.View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {primaryLabel ? (
        <TouchableOpacity
          style={styles.emptyPrimaryBtn}
          onPress={onPrimaryPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}>
          <Ionicons name={primaryIcon} size={16} color={C.surface} />
          <Text style={styles.emptyPrimaryText}>{primaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {secondaryLabel ? (
        <TouchableOpacity
          style={styles.emptySecondaryBtn}
          onPress={onSecondaryPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}>
          <Text style={styles.emptySecondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

const getGenderVisual = gender => {
  const g = (gender || '').toString().toLowerCase().trim();
  if (g === 'boy' || g === 'male' || g === 'm') {
    return {icon: 'male', color: C.boy, label: 'Male'};
  }
  if (g === 'girl' || g === 'female' || g === 'f') {
    return {icon: 'female', color: C.girl, label: 'Female'};
  }
  return {icon: 'male-female', color: C.unisex, label: 'Unisex'};
};

const GenderBadge = ({gender}) => {
  const [showLabel, setShowLabel] = useState(false);
  const genderVisual = getGenderVisual(gender);

  return (
    <TouchableOpacity
      style={[
        styles.genderBadge,
        showLabel && styles.genderBadgeExpanded,
        {backgroundColor: `${genderVisual.color}22`},
      ]}
      onPress={() => setShowLabel(v => !v)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={
        showLabel
          ? `Hide ${genderVisual.label}`
          : `Show ${genderVisual.label}`
      }
      accessibilityState={{expanded: showLabel}}>
      <Ionicons
        name={genderVisual.icon}
        size={16}
        color={genderVisual.color}
      />
      {showLabel ? (
        <Text style={[styles.genderLabel, {color: genderVisual.color}]}>
          {genderVisual.label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const cardIdentity = (item, index = 0) =>
  String(item?.id || item?.slug || item?.name || `name-${index}`).trim();

const normalizeDeckCards = (names = [], excludeIds) => {
  const seen = new Set(
    (excludeIds instanceof Set
      ? [...excludeIds]
      : Array.isArray(excludeIds)
        ? excludeIds
        : []
    )
      .map(id => String(id || '').trim())
      .filter(Boolean),
  );
  const unique = [];
  (Array.isArray(names) ? names : []).forEach((item, index) => {
    if (!item || !(item.id || item.slug || item.name)) {
      return;
    }
    const id = cardIdentity(item, index);
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    unique.push({
      ...item,
      id,
      key: id,
      _deckIndex: unique.length,
    });
  });
  return unique;
};

const overlayUi = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  wash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '56%',
  },
  washPass: {
    left: 0,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
  washLike: {
    right: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  stampDock: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  stampDockPass: {
    alignItems: 'flex-start',
    paddingLeft: 18,
  },
  stampDockLike: {
    alignItems: 'flex-end',
    paddingRight: 18,
  },
  stamp: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stampPass: {
    backgroundColor: C.primary,
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: {width: -4, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {elevation: 8},
    }),
  },
  stampLike: {
    backgroundColor: C.success,
    ...Platform.select({
      ios: {
        shadowColor: C.success,
        shadowOffset: {width: 4, height: 6},
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {elevation: 8},
    }),
  },
  stampText: {
    color: C.surface,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});

const OVERLAY_WRAPPER = {
  width: '100%',
  height: '100%',
};

const OVERLAY_LABELS = {
  left: {
    title: 'PASS',
    element: (
      <View style={overlayUi.layer} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(193, 123, 116, 0.42)',
            'rgba(193, 123, 116, 0.16)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={[overlayUi.wash, overlayUi.washPass]}
        />
        <View style={[overlayUi.stampDock, overlayUi.stampDockPass]}>
          <View style={[overlayUi.stamp, overlayUi.stampPass]}>
            <Text style={overlayUi.stampText}>PASS</Text>
          </View>
        </View>
      </View>
    ),
    style: {wrapper: OVERLAY_WRAPPER},
  },
  right: {
    title: 'LIKE',
    element: (
      <View style={overlayUi.layer} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(52, 199, 89, 0.42)',
            'rgba(52, 199, 89, 0.16)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          start={{x: 1, y: 0.5}}
          end={{x: 0, y: 0.5}}
          style={[overlayUi.wash, overlayUi.washLike]}
        />
        <View style={[overlayUi.stampDock, overlayUi.stampDockLike]}>
          <View style={[overlayUi.stamp, overlayUi.stampLike]}>
            <Text style={overlayUi.stampText}>LIKE</Text>
          </View>
        </View>
      </View>
    ),
    style: {wrapper: OVERLAY_WRAPPER},
  },
};

const DiscoverScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  // insets.top used for status-area padding on root
  const {
    seachfilterData,
    setSeachfilterData,
    setIsUndoEnabled,
    isUndoEnabled,
    babyNamesCount,
    setBabyNamesCount,
    discoverCardStyle,
    discoverFilterBusy,
    setDiscoverFilterBusy,
  } = useContext(AppContext);
  const {userId, firebaseReady, loginOccurred, displayName: authDisplayName, isUserLoggedin} =
    useContext(AuthContext);

  const [babyNamesData, setBabyNamesData] = useState([]);
  const [deckExhausted, setDeckExhausted] = useState(true);
  const [deckEpoch, setDeckEpoch] = useState(0);
  const [swipedCards, setSwipedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingResults, setIsRefreshingResults] = useState(false);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [filteredCount, setFilteredCount] = useState(null);
  const [filteredCountExact, setFilteredCountExact] = useState(false);
  // Remaining names the user can still discover (filters applied, likes/dislikes excluded).
  const [remainingCount, setRemainingCount] = useState(null);
  // Catalog size from Firestore — used by List header, not the Discover banner.
  const [catalogTotal, setCatalogTotal] = useState(null);
  const [localName, setLocalName] = useState('');

  const swiperRef = useRef(null);
  const swipeProgress = useRef(new Animated.Value(0)).current;
  const loadingRequestId = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const babyNamesDataRef = useRef(babyNamesData);
  const swipedCardsRef = useRef(swipedCards);
  const cardIndexRef = useRef(0);
  const swipingLockRef = useRef(false);
  const nextCursorRef = useRef(null);
  const hasMorePagesRef = useRef(true);
  const catalogCountRef = useRef(null);
  const reactedIdsRef = useRef(null);
  const sessionSeenIdsRef = useRef(new Set());
  const loadingNextPageRef = useRef(false);
  const prefetchedPageRef = useRef(null);
  const prefetchPromiseRef = useRef(null);
  const prefetchCursorRef = useRef(null);
  const catalogCountRefreshPromiseRef = useRef(null);

  babyNamesDataRef.current = babyNamesData;
  swipedCardsRef.current = swipedCards;

  const cardStyle = discoverCardStyle || 'detailed';
  const isSimple = cardStyle === 'simple';
  const cardHeight = isSimple ? CARD_HEIGHT_SIMPLE : CARD_HEIGHT_DETAILED;

  const likeOutlineOpacity = useMemo(
    () =>
      swipeProgress.interpolate({
        inputRange: [0, ACTION_OUTLINE_FULL_AT],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [swipeProgress],
  );
  const passOutlineOpacity = useMemo(
    () =>
      swipeProgress.interpolate({
        inputRange: [-ACTION_OUTLINE_FULL_AT, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [swipeProgress],
  );

  const onSwiping = useCallback(
    x => {
      swipeProgress.setValue(x);
    },
    [swipeProgress],
  );

  const clearSwipeProgress = useCallback(() => {
    swipeProgress.setValue(0);
  }, [swipeProgress]);

  const refreshProfile = useCallback(async () => {
    const name = await getDisplayName();
    setLocalName(name || '');
  }, []);

  const applyCatalogTotal = useCallback(
    (total, {persist = true} = {}) => {
      const totalCount = Number(total);
      if (!Number.isFinite(totalCount) || totalCount < 0) {
        return;
      }
        catalogCountRef.current = totalCount;
        setCatalogTotal(totalCount);
        setBabyNamesCount(totalCount);
        if (persist) {
          void Storage.setBabyNamesCount(totalCount);
        }
    },
    [setBabyNamesCount],
  );

  const refreshCatalogCount = useCallback(async () => {
    if (!firebaseReady) {
      return;
    }
    if (catalogCountRefreshPromiseRef.current) {
      return catalogCountRefreshPromiseRef.current;
    }

    const request = getTotalNamesCount({forceRefresh: true})
      .then(response => {
        const totalCount = Number(response?.namesCount);
        if (!Number.isFinite(totalCount) || totalCount < 0) {
          return;
        }
        applyCatalogTotal(totalCount);
      })
      .catch(error => {
        console.warn('Failed to refresh the baby-name count:', error);
      });

    catalogCountRefreshPromiseRef.current = request;
    request.finally(() => {
      if (catalogCountRefreshPromiseRef.current === request) {
        catalogCountRefreshPromiseRef.current = null;
      }
    });
    return request;
  }, [applyCatalogTotal, firebaseReady]);

  useFocusEffect(
    useCallback(() => {
      applyAppStatusBar('dark-content');
      void refreshProfile();
      void refreshCatalogCount();
    }, [refreshCatalogCount, refreshProfile]),
  );

  useEffect(() => {
    void refreshProfile();
  }, [isUserLoggedin, authDisplayName, refreshProfile]);

  // Provisional Storage seed only — never treat it as final; always refresh from server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await Storage.getBabyNamesCount();
        const n = Number(stored);
        if (
          !cancelled &&
          Number.isFinite(n) &&
          n > 0 &&
          catalogCountRef.current == null
        ) {
          catalogCountRef.current = n;
          setCatalogTotal(n);
        }
      } catch (e) {
        // ignore
      }
      if (!cancelled) {
        void refreshCatalogCount();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseReady]);

  const rememberSessionIds = useCallback(ids => {
    const seen = sessionSeenIdsRef.current;
    (Array.isArray(ids) ? ids : [ids]).forEach(id => {
      const nextId = String(id || '').trim();
      if (nextId) {
        seen.add(nextId);
      }
    });
  }, []);

  const rememberReactedId = useCallback(id => {
    const nextId = String(id || '').trim();
    if (!nextId) {
      return;
    }
    rememberSessionIds(nextId);
    const reacted = Array.isArray(reactedIdsRef.current)
      ? reactedIdsRef.current
      : [];
    if (!reacted.includes(nextId)) {
      reactedIdsRef.current = [...reacted, nextId];
    }
  }, [rememberSessionIds]);

  // Remaining Discover count (filtered or unfiltered). Catalog total never changes on swipe.
  const bumpRemainingCount = useCallback(delta => {
    setRemainingCount(prev => {
      if (typeof prev === 'number' && Number.isFinite(prev)) {
        return Math.max(0, prev + delta);
      }
      return prev;
    });
    setFilteredCount(prev => {
      if (typeof prev === 'number' && Number.isFinite(prev)) {
        return Math.max(0, prev + delta);
      }
      return prev;
    });
  }, []);

  const replaceDeck = useCallback(
    names => {
      const deck = normalizeDeckCards(names || [], sessionSeenIdsRef.current);
      rememberSessionIds(deck.map(item => item.id));
      setBabyNamesData(deck);
      cardIndexRef.current = 0;
      setDeckExhausted(deck.length === 0);
      setSwipedCards([]);
      setIsUndoEnabled(false);
      setDeckEpoch(e => e + 1);
    },
    [rememberSessionIds, setIsUndoEnabled],
  );

  const fetchBabyNamesData = useCallback(
    async (options = {}) => {
      const {silent = false} = options;
      const requestId = ++loadingRequestId.current;
      if (!silent && !hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else if (!silent) {
        setIsRefreshingResults(true);
      }
      const queryParams = buildDiscoverQueryParams(seachfilterData, userId);
      const filtering = hasSelectedFilters(queryParams);

      // Do not briefly show the previous filter's total while the new request is
      // still being evaluated.
      if (filtering) {
        setFilteredCount(null);
        setFilteredCountExact(false);
        setRemainingCount(null);
      }

      try {
        const countPromise = filtering
          ? getFilteredNamesCount(queryParams)
          : getRemainingNamesCount(queryParams);
        const response = await getExcludeReactionsPage(queryParams);
        if (requestId !== loadingRequestId.current) {
          return;
        }

        const reacted = new Set(
          (response.reactedIds || []).map(id => String(id)),
        );
        let names = (response.babyNames || []).filter(item => {
          const id = cardIdentity(item);
          return Boolean(id) && !reacted.has(id);
        });

        if (silent) {
          const idx = cardIndexRef.current;
          const len = babyNamesDataRef.current.length;
          const midDeck = idx > 0 && idx < len;
          if (midDeck || swipingLockRef.current) {
            return;
          }
        }

        sessionSeenIdsRef.current = new Set();
        nextCursorRef.current = null;
        hasMorePagesRef.current = !!response.hasMore;
        setHasMorePages(!!response.hasMore);
        prefetchedPageRef.current = null;
        prefetchPromiseRef.current = null;
        prefetchCursorRef.current = null;
        replaceDeck(names);
        nextCursorRef.current = response.nextCursor;
        reactedIdsRef.current = response.reactedIds || [];
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
        setIsLoading(false);
        setIsRefreshingResults(false);
        setDiscoverFilterBusy(false);

        const countResponse = await countPromise;
        if (requestId !== loadingRequestId.current) {
          return;
        }

        const pageCount = Number(response?.namesCount);
        const countApiCount = Number(countResponse?.namesCount);
        const remaining = Number.isFinite(countApiCount)
          ? countApiCount
          : pageCount;
        const isExact =
          countResponse?.exact === true || response?.exact === true;

        if (Number.isFinite(remaining) && remaining >= 0) {
          setRemainingCount(Math.max(0, remaining));
        }

        if (filtering) {
          if (Number.isFinite(remaining) && remaining >= 0) {
            setFilteredCount(Math.max(0, remaining));
            setFilteredCountExact(isExact);
          } else {
            setFilteredCount(null);
            setFilteredCountExact(false);
          }
        } else {
          setFilteredCount(null);
          setFilteredCountExact(false);
          const catalog = Number(countResponse?.catalogTotal);
          if (Number.isFinite(catalog) && catalog >= 0) {
            applyCatalogTotal(catalog);
          } else {
            void getTotalNamesCount({forceRefresh: true}).then(totalRes => {
              const total = Number(totalRes?.namesCount);
              if (Number.isFinite(total) && total >= 0) {
                applyCatalogTotal(total);
              }
            });
          }
        }

        hasMorePagesRef.current =
          filtering && isExact && Number.isFinite(remaining)
            ? names.length < remaining && !!response.hasMore
            : !!response.hasMore;
        setHasMorePages(hasMorePagesRef.current);
      } catch (error) {
        console.error(`Failed to fetch data: ${error}`);
      } finally {
        if (requestId === loadingRequestId.current) {
          setIsLoading(false);
          setIsRefreshingResults(false);
          setDiscoverFilterBusy(false);
        }
      }
    },
    [
      applyCatalogTotal,
      seachfilterData,
      userId,
      replaceDeck,
      setDiscoverFilterBusy,
    ],
  );

  const fetchNextPage = useCallback(
    cursor =>
      getExcludeReactionsPage(
        buildDiscoverQueryParams(seachfilterData, userId, {
          cursor,
          reactedIds: reactedIdsRef.current || [],
          excludeIds: [...sessionSeenIdsRef.current],
        }),
      ),
    [seachfilterData, userId],
  );

  const prefetchNextPage = useCallback(() => {
    const cursor = nextCursorRef.current;
    if (
      prefetchedPageRef.current ||
      prefetchPromiseRef.current ||
      !hasMorePagesRef.current ||
      !cursor
    ) {
      return;
    }

    const requestId = loadingRequestId.current;
    prefetchCursorRef.current = cursor;
    let pending;
    pending = fetchNextPage(cursor)
      .then(response => {
        if (
          requestId === loadingRequestId.current &&
          cursor === nextCursorRef.current
        ) {
          prefetchedPageRef.current = {requestId, cursor, response};
        }
        return response;
      })
      .catch(error => {
        console.error(`Failed to prefetch the next name page: ${error}`);
        return null;
      })
      .finally(() => {
        if (prefetchPromiseRef.current === pending) {
          prefetchPromiseRef.current = null;
          prefetchCursorRef.current = null;
        }
      });
    prefetchPromiseRef.current = pending;
  }, [fetchNextPage]);

  const loadNextPage = useCallback(async () => {
    if (
      loadingNextPageRef.current ||
      !hasMorePagesRef.current ||
      !nextCursorRef.current
    ) {
      return;
    }

    const requestId = loadingRequestId.current;
    loadingNextPageRef.current = true;
    const cursor = nextCursorRef.current;
    const prefetched = prefetchedPageRef.current;
    const hasPrefetchReady =
      prefetched?.requestId === requestId && prefetched.cursor === cursor;
    // Only show the deck loader when we must hit the network for the next page.
    if (!hasPrefetchReady) {
      setIsLoadingNextPage(true);
    }
    try {
      let response = hasPrefetchReady ? prefetched.response : null;
      if (!response && prefetchCursorRef.current === cursor) {
        response = await prefetchPromiseRef.current;
      }
      if (!response) {
        response = await fetchNextPage(cursor);
      }
      if (requestId !== loadingRequestId.current) {
        return;
      }
      prefetchedPageRef.current = null;
      nextCursorRef.current = response.nextCursor;
      hasMorePagesRef.current = !!response.hasMore;
      setHasMorePages(!!response.hasMore);
      reactedIdsRef.current = response.reactedIds || [];
      const reacted = new Set([
        ...(response.reactedIds || []),
        ...sessionSeenIdsRef.current,
      ].map(id => String(id)));
      const nextNames = (response.babyNames || []).filter(item => {
        const id = cardIdentity(item);
        return Boolean(id) && !reacted.has(id);
      });
      if (!nextNames.length) {
        hasMorePagesRef.current = false;
        setHasMorePages(false);
        return;
      }
      replaceDeck(nextNames);
    } catch (error) {
      console.error(`Failed to load the next name page: ${error}`);
    } finally {
      if (requestId === loadingRequestId.current) {
        setIsLoadingNextPage(false);
      }
      loadingNextPageRef.current = false;
    }
  }, [fetchNextPage, replaceDeck]);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }
    void fetchBabyNamesData();
  }, [fetchBabyNamesData, firebaseReady, userId, loginOccurred]);

  const releaseSwipingLock = useCallback(() => {
    setTimeout(() => {
      swipingLockRef.current = false;
    }, 350);
  }, []);

  const likeuser = useCallback(
    async card => {
      if (!card) {
        return;
      }
      try {
        const PAYLOAD = {
          userId: userId ?? 0,
          nameId: card.id,
          name: card.name,
          gender: card.gender,
          origin: card.origin,
          meaning: card.meaning,
          syllables: card.syllables,
          syllableCount: card.syllableCount,
        };
        rememberReactedId(card.id);
        bumpRemainingCount(-1);
        setSwipedCards(state => [...state, {card, action: 'liked'}]);
        await likeUser(PAYLOAD);
        setIsUndoEnabled(true);
      } catch (e) {
        console.log('err', e);
      }
    },
    [bumpRemainingCount, rememberReactedId, userId, setIsUndoEnabled],
  );

  const disLikeuser = useCallback(
    async card => {
      if (!card) {
        return;
      }
      try {
        const PAYLOAD = {
          userId: userId ?? 0,
          nameId: card.id,
          name: card.name,
          gender: card.gender,
          origin: card.origin,
          meaning: card.meaning,
          syllables: card.syllables,
          syllableCount: card.syllableCount,
        };
        rememberReactedId(card.id);
        bumpRemainingCount(-1);
        setSwipedCards(state => [...state, {card, action: 'disliked'}]);
        await disLikeUser(PAYLOAD);
        setIsUndoEnabled(true);
      } catch (e) {
        console.log('err', e);
      }
    },
    [bumpRemainingCount, rememberReactedId, userId, setIsUndoEnabled],
  );

  const undoLastSwipe = useCallback(() => {
    const stack = swipedCardsRef.current;
    if (!stack.length) {
      return;
    }
    const lastSwiped = stack[stack.length - 1];
    if (!lastSwiped?.card) {
      return;
    }
    const nextStack = stack.slice(0, -1);
    setSwipedCards(nextStack);
    const prevIndex = Math.max(0, cardIndexRef.current - 1);
    cardIndexRef.current = prevIndex;
    setDeckExhausted(false);
    swiperRef.current?.swipeBack?.();

    const undoneId = String(lastSwiped.card.id || '');
    if (undoneId && Array.isArray(reactedIdsRef.current)) {
      reactedIdsRef.current = reactedIdsRef.current.filter(
        id => String(id) !== undoneId,
      );
    }
    sessionSeenIdsRef.current.delete(undoneId);
    bumpRemainingCount(1);

    const PAYLOAD = {
      userId: userId ?? 0,
      nameId: lastSwiped.card.id,
    };

    const onUndoDone = () => {
      setIsUndoEnabled(nextStack.length > 0);
    };

    if (lastSwiped.action === 'liked') {
      undoLikeUser(PAYLOAD)
        .then(onUndoDone)
        .catch(error => console.log('Error undoing like:', error));
    } else if (lastSwiped.action === 'disliked') {
      undoDisLikeUser(PAYLOAD)
        .then(onUndoDone)
        .catch(error => console.log('Error undoing dislike:', error));
    }
  }, [bumpRemainingCount, userId, setIsUndoEnabled]);

  const openNameDetails = useCallback(
    item => navigation.navigate('NameInformation', {item}),
    [navigation],
  );

  const onShareName = useCallback(name => {
    void shareBabyName(name);
  }, []);

  const onSwipedLeft = useCallback(
    index => {
      const card = babyNamesDataRef.current[index];
      const nextIndex = index + 1;
      const reachedPageEnd = nextIndex >= babyNamesDataRef.current.length;
      cardIndexRef.current = nextIndex;
      releaseSwipingLock();
      if (
        nextIndex >=
        babyNamesDataRef.current.length - PREFETCH_REMAINING_CARDS
      ) {
        prefetchNextPage();
      }
      if (reachedPageEnd) {
        setDeckExhausted(true);
      }
      if (!card) {
        if (reachedPageEnd) {
          void loadNextPage();
        }
        return;
      }
      if (reachedPageEnd) {
        void disLikeuser(card).finally(loadNextPage);
      } else {
        void disLikeuser(card);
      }
    },
    [disLikeuser, loadNextPage, prefetchNextPage, releaseSwipingLock],
  );

  const onSwipedRight = useCallback(
    index => {
      const card = babyNamesDataRef.current[index];
      const nextIndex = index + 1;
      const reachedPageEnd = nextIndex >= babyNamesDataRef.current.length;
      cardIndexRef.current = nextIndex;
      releaseSwipingLock();
      if (
        nextIndex >=
        babyNamesDataRef.current.length - PREFETCH_REMAINING_CARDS
      ) {
        prefetchNextPage();
      }
      if (reachedPageEnd) {
        setDeckExhausted(true);
      }
      if (!card) {
        if (reachedPageEnd) {
          void loadNextPage();
        }
        return;
      }
      if (reachedPageEnd) {
        void likeuser(card).finally(loadNextPage);
      } else {
        void likeuser(card);
      }
    },
    [likeuser, loadNextPage, prefetchNextPage, releaseSwipingLock],
  );

  const onPassPress = useCallback(() => {
    if (swipingLockRef.current) {
      return;
    }
    if (cardIndexRef.current >= babyNamesDataRef.current.length) {
      return;
    }
    swipingLockRef.current = true;
    swiperRef.current?.swipeLeft?.();
  }, []);

  const onLikePress = useCallback(() => {
    if (swipingLockRef.current) {
      return;
    }
    if (cardIndexRef.current >= babyNamesDataRef.current.length) {
      return;
    }
    swipingLockRef.current = true;
    swiperRef.current?.swipeRight?.();
  }, []);

  const renderCard = useCallback(
    card => {
      if (!card) {
        return null;
      }
      const originLabel = card.origin || 'Name';
      const pronunciation = card.syllables || card.pronunciation || card.name;

      const speak = e => {
        e?.stopPropagation?.();
        void speakNamePronunciation(card.name, pronunciation);
      };

      // Detailed = Figma full card; Simple = name + meaning only
      return (
        <View
          style={[
            styles.card,
            {height: cardHeight},
            isSimple && styles.cardSimple,
          ]}>
          <View style={styles.cardTopActions}>
            <TouchableOpacity
              style={styles.cardIconBtn}
              onPress={() => onShareName(card.name)}
              accessibilityRole="button"
              accessibilityLabel="Share name"
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="share-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardIconBtn}
              onPress={() => openNameDetails(card)}
              accessibilityRole="button"
              accessibilityLabel="Name details"
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>

          <GenderBadge gender={card.gender} />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openNameDetails(card)}
            accessibilityRole="button"
            accessibilityLabel={`${card.name} details`}>
            <Text
              style={[styles.cardName, isSimple && styles.cardNameSimple]}
              numberOfLines={2}>
              {card.name}
            </Text>
          </TouchableOpacity>

          {!isSimple ? (
            <>
              <TouchableOpacity
                style={styles.pronunciationRow}
                onPress={speak}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Ionicons
                  name="volume-medium-outline"
                  size={18}
                  color={C.textMuted}
                />
                <Text style={styles.pronunciation}>{pronunciation}</Text>
              </TouchableOpacity>
              <View style={styles.originPill}>
                <Text style={styles.originText}>{originLabel}</Text>
              </View>
            </>
          ) : null}

          <Text
            style={[styles.meaning, isSimple && styles.meaningSimple]}
            numberOfLines={isSimple ? 3 : 5}>
            {card.meaning || 'Meaning coming soon'}
          </Text>
        </View>
      );
    },
    [openNameDetails, onShareName, isSimple, cardHeight],
  );

  const headerName = resolveDisplayName({
    localName,
    authDisplayName,
    isUserLoggedin,
  });
  const headerTitle = isUserLoggedin ? headerName : 'Guest user';
  const hasActiveFilters = hasSelectedFilters(seachfilterData);
  const displayRemaining =
    typeof remainingCount === 'number' && Number.isFinite(remainingCount)
      ? Math.max(0, remainingCount)
      : null;
  const countLabel = hasActiveFilters
    ? displayRemaining === 1
      ? 'matching name left'
      : 'matching names left'
    : displayRemaining === 1
      ? 'name left'
      : 'names left';
  const countDisplay =
    displayRemaining == null
      ? '…'
      : `${hasActiveFilters && !filteredCountExact ? '~' : ''}${displayRemaining.toLocaleString(
          'en-US',
        )}`;
  const showFilterLoader = isRefreshingResults || discoverFilterBusy;
  const showInitialLoader = isLoading && !hasLoadedOnce;
  // Full-deck loader only on first load / filter apply / real next-page fetch.
  const showDeckLoader =
    showInitialLoader ||
    showFilterLoader ||
    (deckExhausted && isLoadingNextPage);
  const useEmptyStage = showDeckLoader || deckExhausted;

  const clearFilters = useCallback(() => {
    // Drop filtered banner only — keep the stable catalog total so reset does
    // not flash the in-memory cache size (~25k) before the real count settles.
    setFilteredCount(null);
    setFilteredCountExact(false);
    setRemainingCount(null);
    setIsRefreshingResults(true);
    setDiscoverFilterBusy(true);
    void refreshCatalogCount();
    setSeachfilterData(prev => ({
      ...prev,
      firstLetter: '',
      lastLetter: '',
      contains: '',
      originQuery: '',
      nameLength: 'all',
      style: 'all',
      compoundLetter: false,
      gender: 'all',
      origins: [],
      search: false,
    }));
  }, [refreshCatalogCount, setDiscoverFilterBusy, setSeachfilterData]);
  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <LinearGradient
        colors={[T.colors.background, T.colors.backgroundEnd, T.colors.surfacePeach]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.blobCoral} pointerEvents="none" />
      <View style={styles.blobBlue} pointerEvents="none" />

      <View style={styles.header}>
        <BrandMark size={36} />
        <Text style={styles.headerMode} numberOfLines={1}>
          {headerTitle}
        </Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => navigation.navigate('NameFilterSearch')}
          accessibilityRole="button"
          accessibilityLabel="Filter names">
          <Ionicons name="options-outline" size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.countBanner, hasActiveFilters && styles.countBannerFiltered]}
        accessibilityRole="text"
        accessibilityLabel={`${countDisplay} ${countLabel}${
          hasActiveFilters ? ', filters applied' : ''
        }`}>
        <View style={styles.countGlow} />
        <View style={styles.countIconWrap}>
          <Ionicons name="sparkles" size={14} color={C.primary} />
        </View>
        <View style={styles.countTextCol}>
          <Text style={styles.countNumber}>{countDisplay}</Text>
          <Text style={styles.countCaption}>
            {hasActiveFilters ? 'filtered · ' : ''}
            {countLabel}
          </Text>
        </View>
        {hasActiveFilters ? (
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={clearFilters}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Reset filters">
            <Ionicons name="refresh" size={11} color="#FFFFFF" />
            <Text style={styles.clearFilterText}>Reset</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>Live</Text>
          </View>
        )}
      </View>

      <View style={styles.deckArea}>
        <View
          style={[
            styles.cardStage,
            useEmptyStage ? styles.cardStageEmpty : {height: cardHeight + 18},
          ]}>
          {!useEmptyStage ? (
            <>
              <View
                pointerEvents="none"
                style={[
                  styles.stackPeek,
                  {
                    width: CARD_WIDTH - 24,
                    height: cardHeight,
                    bottom: 0,
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.stackPeek,
                  {
                    width: CARD_WIDTH - 12,
                    height: cardHeight,
                    bottom: 6,
                  },
                ]}
              />
            </>
          ) : null}

          <View
            style={[
              styles.swiperWrap,
              useEmptyStage ? styles.swiperWrapEmpty : {height: cardHeight},
            ]}>
            {showInitialLoader ? (
              <NamesLoadingState message="Finding names…" />
            ) : showFilterLoader ? (
              <NamesLoadingState
                message={
                  hasActiveFilters ? 'Applying filters…' : 'Updating names…'
                }
              />
            ) : deckExhausted && isLoadingNextPage ? (
              <NamesLoadingState message="Loading more names…" />
            ) : deckExhausted ? (
              <DiscoverDeckEmpty
                title="No more names"
                subtitle={
                  hasMorePages
                    ? 'Continue searching for more matching names.'
                    : hasActiveFilters
                      ? 'Reset your filters to see more names, or check back later.'
                      : 'Check back later or adjust your preferences.'
                }
                primaryLabel={
                  hasMorePages
                    ? 'Search more'
                    : hasActiveFilters
                      ? 'Reset filters'
                      : 'Adjust preferences'
                }
                primaryIcon={
                  hasMorePages
                    ? 'search-outline'
                    : hasActiveFilters
                      ? 'refresh'
                      : 'options-outline'
                }
                onPrimaryPress={() => {
                  if (hasMorePages) {
                    void loadNextPage();
                    return;
                  }
                  if (hasActiveFilters) {
                    clearFilters();
                    return;
                  }
                  navigation.navigate('NameFilterSearch');
                }}
                secondaryLabel={
                  !hasMorePages && hasActiveFilters
                    ? 'Adjust filters'
                    : null
                }
                onSecondaryPress={
                  !hasMorePages && hasActiveFilters
                    ? () => navigation.navigate('NameFilterSearch')
                    : undefined
                }
              />
            ) : (
              <Swiper
                key={`swiper-${cardStyle}-${deckEpoch}`}
                ref={swiperRef}
                cards={babyNamesData}
                containerStyle={styles.swiperContainer}
                cardStyle={{width: CARD_WIDTH, height: cardHeight}}
                cardHorizontalMargin={CARD_H_MARGIN}
                cardVerticalMargin={0}
                backgroundColor="transparent"
                stackSize={Math.min(2, babyNamesData.length)}
                stackSeparation={10}
                stackScale={4}
                animateCardOpacity
                animateOverlayLabelsOpacity
                overlayOpacityHorizontalThreshold={OVERLAY_FADE_START}
                inputOverlayLabelsOpacityRangeX={OVERLAY_OPACITY_INPUT_X}
                outputOverlayLabelsOpacityRangeX={OVERLAY_OPACITY_OUTPUT_X}
                overlayLabelWrapperStyle={styles.overlayLabelWrapper}
                verticalSwipe={false}
                disableTopSwipe
                disableBottomSwipe
                swipeBackCard
                useViewOverflow={false}
                onSwiping={onSwiping}
                onSwiped={clearSwipeProgress}
                onSwipedAborted={clearSwipeProgress}
                onSwipedLeft={onSwipedLeft}
                onSwipedRight={onSwipedRight}
                renderCard={renderCard}
                overlayLabels={OVERLAY_LABELS}
              />
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.passBtnWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.actionOutline,
                styles.passOutline,
                {opacity: passOutlineOpacity},
              ]}
            />
            <TouchableOpacity
              style={styles.passBtn}
              onPress={onPassPress}
              accessibilityRole="button"
              accessibilityLabel="Pass">
              <Ionicons name="close" size={26} color={C.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.undoBtn,
              (!isUndoEnabled || swipedCards.length === 0) &&
                styles.undoDisabled,
            ]}
            onPress={undoLastSwipe}
            disabled={!isUndoEnabled || swipedCards.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Undo">
            <Ionicons name="arrow-undo" size={18} color={C.textMuted} />
          </TouchableOpacity>

          <View style={styles.likeBtnWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.actionOutline,
                styles.likeOutline,
                {opacity: likeOutlineOpacity},
              ]}
            />
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={onLikePress}
              accessibilityRole="button"
              accessibilityLabel="Like">
              <Ionicons name="heart" size={28} color={C.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>
  );
};

const softShadow = Platform.select({
  ios: {
    shadowColor: '#2D3436',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.1,
    shadowRadius: 22,
  },
  android: {elevation: 6},
});

const likeShadow = Platform.select({
  ios: {
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  android: {elevation: 5},
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  blobCoral: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  blobBlue: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(94, 194, 215, 0.14)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 10,
  },
  headerMode: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.text,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  countBanner: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.18)',
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {elevation: 3},
    }),
  },
  countBannerFiltered: {
    borderColor: 'rgba(255,107,107,0.42)',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 30,
    marginLeft: 'auto',
    marginRight: -4,
  },
  clearFilterText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countGlow: {
    position: 'absolute',
    right: -18,
    top: -22,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
  countIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTextCol: {
    flex: 1,
  },
  countNumber: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    color: C.text,
    letterSpacing: 0.2,
  },
  countCaption: {
    marginTop: 1,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: C.textMuted,
  },
  countPill: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  countPillText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: C.surface,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  deckArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  cardStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardStageEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  stackPeek: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: C.surface,
    borderRadius: 28,
    zIndex: 0,
  },
  swiperWrap: {
    width: '100%',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  swiperWrapEmpty: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayLabelWrapper: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 2,
    width: '100%',
    height: '100%',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: C.surface,
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 18,
    paddingBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  cardSimple: {
    paddingVertical: 28,
  },
  cardTopActions: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  cardIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
    marginBottom: 2,
  },
  genderBadgeExpanded: {
    paddingHorizontal: 10,
  },
  genderLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  cardName: {
    fontFamily: Fonts.bold,
    fontSize: 38,
    lineHeight: 44,
    color: C.text,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  cardNameSimple: {
    fontSize: 40,
    lineHeight: 46,
    marginBottom: 12,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  pronunciation: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: C.textMuted,
  },
  originPill: {
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  originText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: C.surface,
  },
  meaning: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: C.textMuted,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  meaningSimple: {
    marginTop: 0,
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 22,
    paddingBottom: 8,
    zIndex: 3,
  },
  passBtnWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtnWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOutline: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  passOutline: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: C.primary,
  },
  likeOutline: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderColor: C.success,
  },
  passBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  undoDisabled: {
    opacity: 0.35,
  },
  likeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...likeShadow,
  },
  empty: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyIconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: C.primaryMuted,
    opacity: 0.85,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193,123,116,0.22)',
    ...softShadow,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: C.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyPrimaryBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: C.primary,
    ...softShadow,
  },
  emptyPrimaryText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: C.surface,
  },
  emptySecondaryBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptySecondaryText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: C.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44,51,64,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: 22,
    paddingTop: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalIconWrap: {
    marginBottom: 12,
    position: 'relative',
  },
  modalBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.surface,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  modalSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.colors.divider,
    alignSelf: 'stretch',
    marginTop: 10,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  modalActionHalf: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalVDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: T.colors.divider,
  },
  modalPrimaryText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: C.primary,
  },
  modalSecondary: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: C.textMuted,
  },
});

export default DiscoverScreen;
