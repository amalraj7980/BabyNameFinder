import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {Colors} from '../../styles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import {disLikeUser, getReactions} from '../../api';
import SafeScreen from '../../components/SafeScreen';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {styles} from './likeListScreenStyles';

const keyExtractor = item => String(item.id);

const getCardBackgroundColor = gender => {
  if (gender === 'Female') {
    return Colors.secondary;
  } else if (gender === 'Male') {
    return Colors.Boy;
  } else if (gender === 'Unisex') {
    return Colors.unisex;
  }
  return Colors.Boy;
};

const LikeListScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {
    locale: {locale},
    dislikeCount,
    likeCount,
    likeFilterScreen,
  } = useContext(AppContext);
  const [babyNamesData, setBabyNamesData] = useState([]);
  const [dislikedNames, setDislikedNames] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  const {userId} = useContext(AuthContext);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contentContainerStyle = useMemo(
    () => ({flexGrow: 1, paddingBottom: insets.bottom + 24}),
    [insets.bottom],
  );

  const fetchBabyNamesData = useCallback(async () => {
    setIsLoading(true);
    const queryParams = {
      pageCount: 1000,
      page: 0,
      startWith: likeFilterScreen?.firstLetter ?? '',
      endsWith: likeFilterScreen?.lastLetter ?? '',
      compoundName: likeFilterScreen?.compoundLetter ?? false,
      gender: likeFilterScreen?.gender ?? 'all',
      contains: likeFilterScreen?.contains ?? '',
    };
    try {
      const response = await getReactions(userId, queryParams);
      console.log('response------------>', response);
      setBabyNamesData(response?.likes ?? []);
      setIsLoading(false);
    } catch (error) {
      console.error(`Failed to fetch data: ${error}`);
      setIsLoading(false);
    }
  }, [likeFilterScreen, userId]);

  useEffect(() => {
    setCurrentPage(0);
    setHasMoreData(true);
    fetchBabyNamesData();
  }, [route.params, likeCount, dislikeCount, likeFilterScreen, userId]);

  const loadMoreData = useCallback(() => {
    if (!isLoading && hasMoreData) {
      fetchBabyNamesData();
    }
  }, [isLoading, hasMoreData, fetchBabyNamesData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchBabyNamesData();
      console.log('refresh like------>', res);
    } catch (error) {
      console.log(error);
    }
    setIsRefreshing(false);
  }, [fetchBabyNamesData]);

  const disLikeuser = useCallback(
    async id => {
      console.log('hellooooooo');
      console.log('dis Like id-vv--->', id);

      const PAYLOAD = {
        userId: userId,
        nameId: id,
      };
      try {
        setDislikedNames(prev => [...prev, id]);
        setBabyNamesData(prev => prev.filter(item => item.id !== id));
        let dislikes = await disLikeUser(PAYLOAD);
        console.log('Dislikes------>', dislikes);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId],
  );

  const renderNoMoreCardsText = useCallback(() => {
    if (babyNamesData?.length === 0) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No results found</Text>
          </View>
        </View>
      );
    }
    return null;
  }, [babyNamesData?.length]);

  const renderDivider = useCallback(
    () => <View style={styles.itemSeparator} />,
    [],
  );

  const renderBabyNameCard = useCallback(
    ({item}) => {
      const cardBackgroundColor = getCardBackgroundColor(item.gender);

      if (!dislikedNames.includes(item.id)) {
        return (
          <View style={styles.cardContainer}>
            <TouchableOpacity
              onPress={() => disLikeuser(item.id)}
              style={styles.CompactdislikeButton}>
              <AntDesign name="dislike2" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NameInformation', {item})}>
              <Text style={[styles.name, {color: cardBackgroundColor}]}>
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.CompactlikeButton} />
          </View>
        );
      }
      return null;
    },
    [dislikedNames, disLikeuser, navigation],
  );

  return (
    <SafeScreen backgroundColor="#454545">
      <View style={styles.container}>
        <FlatList
          data={babyNamesData}
          style={styles.listMargin}
          keyExtractor={keyExtractor}
          renderItem={renderBabyNameCard}
          ItemSeparatorComponent={renderDivider}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentContainerStyle}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderNoMoreCardsText}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
        />

        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </SafeScreen>
  );
};

export default LikeListScreen;
