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
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import Share from 'react-native-share';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {Colors} from '../../styles';
import {
  disLikeUser,
  likeUser,
  undoLikeUser,
  undoDisLikeUser,
  getExcludeReactions,
  subscribeBabyNames,
} from '../../api';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {Storage} from '../../util';
import CustomPopup from '../../components/CustomPopup';
import useBackExit from '../../hooks/useBackExit';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SafeScreen from '../../components/SafeScreen';
import {
  styles,
  CARD_H_MARGIN,
  SWIPER_CARD_STYLE,
  SWIPER_CONTAINER_STYLE,
  SWIPER_OVERLAY_LABELS,
} from './babyNamesScreenStyles';
import {
  CompactNameRow,
  EmptyNamesState,
  GridNameCard,
  SwipeNameCard,
} from './babyNameListItems';

const keyExtractor = item => String(item.id);
const swiperKeyExtractor = item => String(item?.id ?? '');

const BabyNamesScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  const {
    locale: {locale},
    setSeachfilterData,
    seachfilterData,
    setIsUndoEnabled,
    isUndoEnabled,
    setBabyNamesCount,
  } = useContext(AppContext);

  const {loginOccurred, userId, firebaseReady} = useContext(AuthContext);

  const [babyNamesData, setBabyNamesData] = useState([]);
  const [likedNames, setLikedNames] = useState([]);
  const [dislikedNames, setDislikedNames] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [filterParams, setFilterParams] = useState(route?.params ?? {});
  const [isFilterActive, setIsFilterActive] = useState(!!filterParams.filter);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [swipedCards, setSwipedCards] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [viewMode, setViewMode] = useState('CarouselView');

  const {ExitConfirmModal} = useBackExit();
  const loadingRequestId = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const babyNamesDataRef = useRef(babyNamesData);
  const swipedCardsRef = useRef(swipedCards);

  babyNamesDataRef.current = babyNamesData;
  swipedCardsRef.current = swipedCards;

  useEffect(() => {
    setFilterParams(route?.params ?? {});
    setIsFilterActive(!!route?.params?.filter);
  }, [route?.params]);

  const fetchBabyNamesData = useCallback(
    async (_pageNumber, options = {}) => {
      const {silent = false} = options;
      const requestId = ++loadingRequestId.current;
      if (!silent && !hasLoadedOnceRef.current) {
        setIsLoading(true);
      }
      const queryParams = {
        pageCount: 1000,
        page: 0,
        u: userId ?? 0,
        startWith: seachfilterData?.firstLetter ?? '',
        endsWith: seachfilterData?.lastLetter ?? '',
        compoundName: seachfilterData?.compoundLetter ?? false,
        gender: seachfilterData?.gender ?? 'all',
        contains: seachfilterData?.contains ?? '',
      };

      try {
        const response = await getExcludeReactions({
          ...queryParams,
          forceRefresh: !silent,
        });
        if (requestId !== loadingRequestId.current) {
          return;
        }
        setBabyNamesData(response.babyNames || []);
        setBabyNamesCount(response.count ?? 0);
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      } catch (error) {
        console.error(`Failed to fetch data: ${error}`);
      } finally {
        if (requestId === loadingRequestId.current) {
          setIsLoading(false);
        }
      }
    },
    [seachfilterData, userId, setBabyNamesCount],
  );

  const fetchData = useCallback(async () => {
    const queryParams = {
      pageCount: 1,
      page: 0,
      u: userId ?? 0,
      startWith: seachfilterData?.firstLetter ?? '',
      endsWith: seachfilterData?.lastLetter ?? '',
      compoundName: seachfilterData?.compoundLetter ?? false,
      gender: seachfilterData?.gender ?? 'all',
      contains: seachfilterData?.contains ?? '',
    };

    try {
      const response = await getExcludeReactions(queryParams);
      setBabyNamesCount(response.count ?? 0);
      Storage.setBabyNamesCount(response.count);
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  }, [seachfilterData, userId, setBabyNamesCount]);

  // Catalog load when filters / auth change — not on view-mode switch
  useEffect(() => {
    fetchBabyNamesData(0);
    fetchData();
  }, [fetchBabyNamesData, fetchData, firebaseReady, userId, loginOccurred]);

  useEffect(() => {
    const unsubscribe = subscribeBabyNames(names => {
      if (Array.isArray(names)) {
        fetchBabyNamesData(0, {silent: true});
        fetchData();
      }
    });
    return unsubscribe;
  }, [fetchBabyNamesData, fetchData]);

  const ClearFilter = useCallback(() => {
    setFilterParams({});
    setIsFilterActive(false);
    setSeachfilterData({
      firstLetter: '',
      lastLetter: '',
      gender: 'all',
      contains: '',
      compoundLetter: false,
      search: false,
    });
    navigation.setParams({filter: undefined, from: undefined});
  }, [navigation, setSeachfilterData]);

  const bumpCountDown = useCallback(async () => {
    const currentCount = await Storage.getBabyNamesCount();
    if (currentCount !== null) {
      const updatedCount = currentCount - 1;
      setBabyNamesCount(updatedCount);
      await Storage.setBabyNamesCount(updatedCount);
    }
  }, [setBabyNamesCount]);

  const likeuser = useCallback(
    async id => {
      try {
        const PAYLOAD = {userId: userId ?? 0, nameId: id};
        const swipedCard = babyNamesDataRef.current.find(item => item.id === id);
        setSwipedCards(state => [...state, {card: swipedCard, action: 'liked'}]);
        setLikedNames(state => [...state, id]);
        setBabyNamesData(state => state.filter(item => item.id !== id));
        await bumpCountDown();
        await likeUser(PAYLOAD);
        setIsUndoEnabled(true);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId, bumpCountDown, setIsUndoEnabled],
  );

  const disLikeuser = useCallback(
    async id => {
      try {
        const PAYLOAD = {userId: userId ?? 0, nameId: id};
        const swipedCard = babyNamesDataRef.current.find(item => item.id === id);
        setSwipedCards(state => [
          ...state,
          {card: swipedCard, action: 'disliked'},
        ]);
        setDislikedNames(state => [...state, id]);
        setBabyNamesData(state => state.filter(item => item.id !== id));
        await bumpCountDown();
        await disLikeUser(PAYLOAD);
        setIsUndoEnabled(true);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId, bumpCountDown, setIsUndoEnabled],
  );

  const undoLastSwipe = useCallback(() => {
    const stack = swipedCardsRef.current;
    if (!stack.length) {
      return;
    }
    const lastSwiped = stack[stack.length - 1];
    setSwipedCards(stack.slice(0, -1));
    setBabyNamesCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
    setBabyNamesData(prev => [lastSwiped.card, ...prev]);

    const PAYLOAD = {
      userId: userId ?? 0,
      nameId: lastSwiped.card.id,
    };

    if (lastSwiped.action === 'liked') {
      undoLikeUser(PAYLOAD)
        .then(() => {
          setLikedNames(state => state.filter(id => id !== lastSwiped.card.id));
          setIsUndoEnabled(false);
        })
        .catch(error => console.log('Error undoing like:', error));
    } else if (lastSwiped.action === 'disliked') {
      undoDisLikeUser(PAYLOAD)
        .then(() => {
          setDislikedNames(state =>
            state.filter(id => id !== lastSwiped.card.id),
          );
          setIsUndoEnabled(false);
        })
        .catch(error => console.log('Error undoing dislike:', error));
    }
  }, [userId, setBabyNamesCount, setIsUndoEnabled]);

  const shareNameList = useCallback(async name => {
    const encodedName = encodeURIComponent(name);
    const shareLink = `https://forking.riafy.in/babyname/babyName/details/${encodedName}`;
    try {
      await Share.open({
        title: 'Share via',
        message: `Hey! I've shortlisted the baby name "${name}". Discover more about it by clicking the link.`,
        url: shareLink,
      });
    } catch (error) {
      // user cancelled share — ignore
    }
  }, []);

  const openNameDetails = useCallback(
    item => navigation.navigate('NameInformation', {item}),
    [navigation],
  );

  const closePopup = useCallback(() => {
    setIsPopupVisible(false);
    navigation.getParent()?.navigate('Auth') ?? navigation.navigate('Auth');
  }, [navigation]);

  const handleCancelPress = useCallback(() => {
    setIsPopupVisible(false);
  }, []);

  const openAiOrPro = useCallback(async () => {
    const storedIsPrime = await Storage.getIsPrime();
    if (storedIsPrime) {
      navigation.navigate('AiAssistant');
    } else {
      navigation.navigate('InAppPurchase');
    }
  }, [navigation]);

  const listContentStyle = useMemo(
    () => [styles.listContent, {paddingBottom: bottomPad + 24}],
    [bottomPad],
  );
  const gridContentStyle = useMemo(
    () => [styles.listContent, {paddingBottom: bottomPad + 140}],
    [bottomPad],
  );
  const aiFabStyle = useMemo(
    () => [styles.transparentButtonContainer, {bottom: bottomPad}],
    [bottomPad],
  );

  const renderDivider = useCallback(
    () => <View style={styles.itemSeparator} />,
    [],
  );

  const renderCompactItem = useCallback(
    ({item}) => {
      if (likedNames.includes(item.id) || dislikedNames.includes(item.id)) {
        return null;
      }
      return (
        <CompactNameRow
          item={item}
          onLike={likeuser}
          onDislike={disLikeuser}
          onOpenDetails={openNameDetails}
        />
      );
    },
    [likedNames, dislikedNames, likeuser, disLikeuser, openNameDetails],
  );

  const renderGridItem = useCallback(
    ({item}) => (
      <GridNameCard
        item={item}
        onLike={likeuser}
        onDislike={disLikeuser}
        onOpenDetails={openNameDetails}
      />
    ),
    [likeuser, disLikeuser, openNameDetails],
  );

  const renderSwipeCard = useCallback(
    cardData => (
      <SwipeNameCard
        card={cardData}
        swipeDirection={swipeDirection}
        onLike={likeuser}
        onDislike={disLikeuser}
        onOpenDetails={openNameDetails}
        onShare={shareNameList}
      />
    ),
    [swipeDirection, likeuser, disLikeuser, openNameDetails, shareNameList],
  );

  const onSwiping = useCallback(x => {
    if (x < -20) {
      setSwipeDirection('left');
    } else if (x > 20) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  }, []);

  const clearSwipeDirection = useCallback(() => setSwipeDirection(null), []);

  const onSwipedLeft = useCallback(
    cardIndex => {
      const card = babyNamesDataRef.current[cardIndex];
      if (!card) {
        return;
      }
      setSwipeDirection(null);
      disLikeuser(card.id);
    },
    [disLikeuser],
  );

  const onSwipedRight = useCallback(
    cardIndex => {
      const card = babyNamesDataRef.current[cardIndex];
      if (!card) {
        return;
      }
      setSwipeDirection(null);
      likeuser(card.id);
    },
    [likeuser],
  );

  const selectCarousel = useCallback(() => setViewMode('CarouselView'), []);
  const selectGrid = useCallback(() => setViewMode('GridView'), []);
  const selectCompact = useCallback(() => setViewMode('CompactList'), []);

  const emptyComponent = isLoading ? null : EmptyNamesState;

  return (
    <SafeScreen
      style={styles.container}
      backgroundColor={Colors.background || Colors.WHITE}>
      <View style={styles.toolbar}>
        <View style={styles.viewModeOptions}>
          <TouchableOpacity
            style={styles.viewModeOption}
            onPress={selectCarousel}>
            <View style={styles.viewModeIconWrap}>
              <View
                style={[
                  styles.SwiperRectangle,
                  viewMode === 'CarouselView' && styles.selectedRectangle,
                ]}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewModeOption} onPress={selectGrid}>
            <View style={styles.viewModeIconWrap}>
              <View
                style={[
                  styles.GridRectangle,
                  viewMode === 'GridView' && styles.selectedRectangle,
                ]}
              />
              <View
                style={[
                  styles.GridRectangle,
                  viewMode === 'GridView' && styles.selectedRectangle,
                ]}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewModeOption}
            onPress={selectCompact}>
            <View style={styles.viewModeIconWrap}>
              <View
                style={[
                  styles.CompactRectangle,
                  viewMode === 'CompactList' && styles.selectedRectangle,
                ]}
              />
              <View
                style={[
                  styles.CompactRectangle,
                  viewMode === 'CompactList' && styles.selectedRectangle,
                ]}
              />
              <View
                style={[
                  styles.CompactRectangle,
                  viewMode === 'CompactList' && styles.selectedRectangle,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
        {isFilterActive ? (
          <TouchableOpacity onPress={ClearFilter} style={styles.clearFilterChip}>
            <Text style={styles.clearFilterText}>
              {filterParams.from ? 'Clear Search' : 'Clear Filter'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {viewMode === 'CompactList' ? (
        <>
          <FlatList
            data={babyNamesData}
            keyExtractor={keyExtractor}
            renderItem={renderCompactItem}
            ItemSeparatorComponent={renderDivider}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyComponent}
            contentContainerStyle={listContentStyle}
            initialNumToRender={16}
            maxToRenderPerBatch={16}
            updateCellsBatchingPeriod={50}
            windowSize={7}
            removeClippedSubviews
            getItemLayout={(_data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
          />
          <View style={aiFabStyle}>
            <TouchableOpacity onPress={openAiOrPro}>
              <Image
                source={require('../../assects/Ai.png')}
                style={styles.aiFabImage}
              />
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {viewMode === 'CarouselView' ? (
        <>
          <View style={styles.Swipercontainer}>
            {babyNamesData.length === 0 ? (
              <EmptyNamesState />
            ) : (
              <Swiper
                cards={babyNamesData}
                keyExtractor={swiperKeyExtractor}
                containerStyle={SWIPER_CONTAINER_STYLE}
                cardStyle={SWIPER_CARD_STYLE}
                cardHorizontalMargin={CARD_H_MARGIN}
                cardVerticalMargin={12}
                backgroundColor="transparent"
                stackSize={2}
                stackSeparation={10}
                stackScale={8}
                animateCardOpacity
                verticalSwipe={false}
                disableTopSwipe
                disableBottomSwipe
                useViewOverflow={false}
                onSwiping={onSwiping}
                onSwiped={clearSwipeDirection}
                onSwipedAborted={clearSwipeDirection}
                onSwipedLeft={onSwipedLeft}
                onSwipedRight={onSwipedRight}
                renderCard={renderSwipeCard}
                overlayLabels={SWIPER_OVERLAY_LABELS}
              />
            )}
          </View>
          {isUndoEnabled && babyNamesData.length > 0 ? (
            <TouchableOpacity
              onPress={undoLastSwipe}
              style={styles.undoButton}>
              <Ionicons name="arrow-undo-sharp" size={23} color="red" />
              <Text style={styles.undoLabel}>Undo</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}

      {viewMode === 'GridView' ? (
        <>
          <FlatList
            data={babyNamesData}
            keyExtractor={keyExtractor}
            renderItem={renderGridItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyComponent}
            contentContainerStyle={gridContentStyle}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            updateCellsBatchingPeriod={50}
            windowSize={7}
            removeClippedSubviews
          />
          <View style={aiFabStyle}>
            <TouchableOpacity onPress={openAiOrPro}>
              <Image
                source={require('../../assects/Ai.png')}
                style={styles.aiFabImage}
              />
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {isLoading && !hasLoadedOnce ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : null}

      <CustomPopup
        isVisible={isPopupVisible}
        onClose={closePopup}
        message={locale.notloginedMessage}
        title={locale.notLoginedTitle}
        onCancel={handleCancelPress}
        cancelText="Cancel"
        style={styles.popupWidth}
      />
      <ExitConfirmModal />
    </SafeScreen>
  );
};

export default BabyNamesScreen;
