import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
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
import {
  disLikeUser,
  likeUser,
  undoLikeUser,
  undoDisLikeUser,
  getExcludeReactionsPage,
  getFilteredNamesCount,
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

const hasSelectedFilters = filters =>
  Boolean(
    (filters?.firstLetter || '').trim() ||
      (filters?.lastLetter || '').trim() ||
      (filters?.contains || '').trim() ||
      (filters?.originQuery || '').trim() ||
      filters?.compoundLetter ||
      (filters?.gender && filters.gender !== 'all') ||
      (filters?.nameLength && filters.nameLength !== 'all') ||
      (filters?.style && filters.style !== 'all') ||
      (Array.isArray(filters?.origins) && filters.origins.length > 0),
  );

const C = {
  primary: '#FF6B6B',
  text: '#2C3340',
  textMuted: '#8B95A5',
  surface: '#FFFFFF',
  bg: '#FFF8F2',
  boy: '#5EC2D7',
  girl: '#FF6B6B',
  unisex: '#8B95A5',
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

const normalizeDeckCards = (names = []) => {
  const seen = new Set();
  return (Array.isArray(names) ? names : [])
    .filter(item => item && (item.id || item.slug || item.name))
    .map((item, index) => {
      const base =
        String(item.id || item.slug || item.name || `name-${index}`).trim() ||
        `name-${index}`;
      let uniqueId = base;
      let dup = 1;
      while (seen.has(uniqueId)) {
        uniqueId = `${base}__${dup++}`;
      }
      seen.add(uniqueId);
      return {
        ...item,
        id: uniqueId,
        key: uniqueId,
        _deckIndex: index,
      };
    });
};

const OVERLAY_LABELS = {
  left: {
    title: 'PASS',
    style: {
      label: {
        backgroundColor: 'transparent',
        borderColor: C.primary,
        color: C.primary,
        borderWidth: 2.5,
        fontSize: 22,
        fontWeight: '800',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        overflow: 'hidden',
      },
      wrapper: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        marginTop: 28,
        marginLeft: -18,
      },
    },
  },
  right: {
    title: 'LIKE',
    style: {
      label: {
        backgroundColor: 'transparent',
        borderColor: '#34C759',
        color: '#34C759',
        borderWidth: 2.5,
        fontSize: 22,
        fontWeight: '800',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        overflow: 'hidden',
      },
      wrapper: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginTop: 28,
        marginLeft: 18,
      },
    },
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
  const [localName, setLocalName] = useState('');

  const swiperRef = useRef(null);
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

  const refreshProfile = useCallback(async () => {
    const name = await getDisplayName();
    setLocalName(name || '');
  }, []);

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
        catalogCountRef.current = totalCount;
        // This is the catalog total, not a count of cards left after swiping.
        setBabyNamesCount(totalCount);
        void Storage.setBabyNamesCount(totalCount);
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
  }, [firebaseReady, setBabyNamesCount]);

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

  const replaceDeck = useCallback(
    (names, count) => {
      const deck = normalizeDeckCards(names || []);
      setBabyNamesData(deck);
      if (typeof count === 'number') {
        setBabyNamesCount(count);
      }
      cardIndexRef.current = 0;
      setDeckExhausted(deck.length === 0);
      setSwipedCards([]);
      setIsUndoEnabled(false);
      setDeckEpoch(e => e + 1);
    },
    [setBabyNamesCount, setIsUndoEnabled],
  );

  const fetchBabyNamesData = useCallback(
    async (options = {}) => {
      const {silent = false} = options;
      const requestId = ++loadingRequestId.current;
      nextCursorRef.current = null;
      hasMorePagesRef.current = true;
      setHasMorePages(false);
      reactedIdsRef.current = null;
      prefetchedPageRef.current = null;
      prefetchPromiseRef.current = null;
      prefetchCursorRef.current = null;
      if (!silent && !hasLoadedOnceRef.current) {
        setIsLoading(true);
      } else if (!silent) {
        setIsRefreshingResults(true);
      }
      const queryParams = {
        pageSize: DISCOVER_PAGE_SIZE,
        cursor: null,
        u: userId ?? 0,
        startWith: seachfilterData?.firstLetter ?? '',
        endsWith: seachfilterData?.lastLetter ?? '',
        compoundName: seachfilterData?.compoundLetter ?? false,
        gender: seachfilterData?.gender ?? 'all',
        contains: seachfilterData?.contains ?? '',
        originQuery: seachfilterData?.originQuery ?? '',
        nameLength: seachfilterData?.nameLength ?? 'all',
        style: seachfilterData?.style ?? 'all',
        origins: seachfilterData?.origins ?? [],
      };
      const filtering = hasSelectedFilters(queryParams);

      // Do not briefly show the previous filter's total while the new request is
      // still being evaluated.
      if (filtering) {
        setFilteredCount(null);
        setFilteredCountExact(false);
      }

      try {
        const [response, countResponse] = await Promise.all([
          getExcludeReactionsPage(queryParams),
          filtering
            ? getFilteredNamesCount(queryParams)
            : catalogCountRef.current === null
              ? getTotalNamesCount()
              : Promise.resolve({namesCount: catalogCountRef.current}),
        ]);
        if (requestId !== loadingRequestId.current) {
          return;
        }

        const namesCount = Number(countResponse?.namesCount);
        const hasExactFilteredCount =
          filtering &&
          countResponse?.exact === true &&
          Number.isFinite(namesCount);
        if (filtering) {
          setFilteredCount(hasExactFilteredCount ? namesCount : null);
          setFilteredCountExact(hasExactFilteredCount);
        } else if (Number.isFinite(namesCount)) {
          catalogCountRef.current = namesCount;
          setFilteredCount(null);
          setFilteredCountExact(false);
        }
        const names = response.babyNames || [];
        const count =
          !filtering && Number.isFinite(namesCount) ? namesCount : undefined;

        if (silent) {
          const idx = cardIndexRef.current;
          const len = babyNamesDataRef.current.length;
          const midDeck = idx > 0 && idx < len;
          if (midDeck || swipingLockRef.current) {
            if (typeof count === 'number') {
              setBabyNamesCount(count);
            }
            return;
          }
        }

        replaceDeck(names, count);
        if (typeof count === 'number') {
          void Storage.setBabyNamesCount(count);
        }
        nextCursorRef.current = response.nextCursor;
        hasMorePagesRef.current = !!response.hasMore;
        setHasMorePages(!!response.hasMore);
        reactedIdsRef.current = response.reactedIds || [];
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      } catch (error) {
        console.error(`Failed to fetch data: ${error}`);
      } finally {
        if (requestId === loadingRequestId.current) {
          setIsLoading(false);
          setIsRefreshingResults(false);
        }
      }
    },
    [seachfilterData, userId, replaceDeck],
  );

  const fetchNextPage = useCallback(
    cursor =>
      getExcludeReactionsPage({
        pageSize: DISCOVER_PAGE_SIZE,
        cursor,
        reactedIds: reactedIdsRef.current || [],
        u: userId ?? 0,
        startWith: seachfilterData?.firstLetter ?? '',
        endsWith: seachfilterData?.lastLetter ?? '',
        compoundName: seachfilterData?.compoundLetter ?? false,
        gender: seachfilterData?.gender ?? 'all',
        contains: seachfilterData?.contains ?? '',
        originQuery: seachfilterData?.originQuery ?? '',
        nameLength: seachfilterData?.nameLength ?? 'all',
        style: seachfilterData?.style ?? 'all',
        origins: seachfilterData?.origins ?? [],
      }),
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
    setIsLoadingNextPage(true);
    try {
      const cursor = nextCursorRef.current;
      const prefetched = prefetchedPageRef.current;
      let response =
        prefetched?.requestId === requestId && prefetched.cursor === cursor
          ? prefetched.response
          : null;
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
      replaceDeck(response.babyNames || []);
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
        const PAYLOAD = {userId: userId ?? 0, nameId: card.id};
        setSwipedCards(state => [...state, {card, action: 'liked'}]);
        await likeUser(PAYLOAD);
        setIsUndoEnabled(true);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId, setIsUndoEnabled],
  );

  const disLikeuser = useCallback(
    async card => {
      if (!card) {
        return;
      }
      try {
        const PAYLOAD = {userId: userId ?? 0, nameId: card.id};
        setSwipedCards(state => [...state, {card, action: 'disliked'}]);
        await disLikeUser(PAYLOAD);
        setIsUndoEnabled(true);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId, setIsUndoEnabled],
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
  }, [userId, setIsUndoEnabled]);

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
        if (hasMorePagesRef.current && nextCursorRef.current) {
          setIsLoadingNextPage(true);
        }
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
        if (hasMorePagesRef.current && nextCursorRef.current) {
          setIsLoadingNextPage(true);
        }
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
  const catalogCount =
    typeof babyNamesCount === 'number'
      ? Math.max(0, babyNamesCount)
      : babyNamesData.length;
  const hasActiveFilters = hasSelectedFilters(seachfilterData);
  const filteredReadyCount = babyNamesData.length;
  const countLabel = hasActiveFilters
    ? filteredCountExact
      ? filteredCount === 1
        ? 'matching name'
        : 'matching names'
      : filteredReadyCount === 1
      ? 'matching name ready'
      : 'matching names ready'
    : catalogCount === 1
      ? 'name in our catalog'
      : 'names in our catalog';
  const countDisplay = hasActiveFilters
    ? filteredCountExact
      ? filteredCount.toLocaleString('en-US')
      : filteredReadyCount.toLocaleString('en-US')
    : catalogCount.toLocaleString('en-US');
  const clearFilters = useCallback(() => {
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
  }, [setSeachfilterData]);
  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <LinearGradient
        colors={[T.colors.background, T.colors.backgroundEnd, '#FFE4D4']}
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
        {isRefreshingResults ? (
          <View
            style={styles.filterLoadingPill}
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel="Updating names">
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.filterLoadingText}>Updating names…</Text>
          </View>
        ) : null}
        <View
          style={[styles.cardStage, {height: cardHeight + 18}]}>
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

          <View style={[styles.swiperWrap, {height: cardHeight}]}>
            {isLoading && !hasLoadedOnce ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={C.primary} />
              </View>
            ) : deckExhausted && isLoadingNextPage ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.emptySub}>Loading more names…</Text>
              </View>
            ) : deckExhausted ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No more names</Text>
                <Text style={styles.emptySub}>
                  {hasMorePages
                    ? 'Continue searching for more matching names.'
                    : 'Check back later or adjust your preferences.'}
                </Text>
                {hasMorePages ? (
                  <TouchableOpacity
                    style={styles.continueSearchBtn}
                    onPress={() => void loadNextPage()}
                    accessibilityRole="button"
                    accessibilityLabel="Search more matching names">
                    <Text style={styles.continueSearchText}>Search more</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
                verticalSwipe={false}
                disableTopSwipe
                disableBottomSwipe
                swipeBackCard
                useViewOverflow={false}
                onSwipedLeft={onSwipedLeft}
                onSwipedRight={onSwipedRight}
                renderCard={renderCard}
                overlayLabels={OVERLAY_LABELS}
              />
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.passBtn}
            onPress={onPassPress}
            accessibilityRole="button"
            accessibilityLabel="Pass">
            <Ionicons name="close" size={26} color={C.primary} />
          </TouchableOpacity>

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

          <TouchableOpacity
            style={styles.likeBtn}
            onPress={onLikePress}
            accessibilityRole="button"
            accessibilityLabel="Like">
            <Ionicons name="heart" size={28} color={C.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !hasLoadedOnce ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : null}

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
  filterLoadingPill: {
    position: 'absolute',
    top: 2,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.24)',
    ...softShadow,
  },
  filterLoadingText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: C.textMuted,
  },
  cardStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  swiperContainer: {
    flex: 1,
    backgroundColor: 'transparent',
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
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: C.text,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  continueSearchBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: C.primary,
  },
  continueSearchText: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: C.surface,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,248,242,0.65)',
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
