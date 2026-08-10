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
import {likeUser, getReactions} from '../../api';
import SafeScreen from '../../components/SafeScreen';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {styles} from './dislikeListScreenStyles';

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

const DislikeListScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {
    likeCount,
    dislikeCount,
    dislikeFilterScreen,
  } = useContext(AppContext);
  const [babyNamesData, setBabyNamesData] = useState([]);
  const [likedNames, setLikedNames] = useState([]);
  const {userId} = useContext(AuthContext);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  const contentContainerStyle = useMemo(
    () => ({flexGrow: 1, paddingBottom: insets.bottom + 24}),
    [insets.bottom],
  );

  const fetchBabyNamesData = useCallback(async () => {
    setIsLoading(true);
    const queryParams = {
      pageCount: 1000,
      page: 0,
      startWith: dislikeFilterScreen?.firstLetter ?? '',
      endsWith: dislikeFilterScreen?.lastLetter ?? '',
      compoundName: dislikeFilterScreen?.compoundLetter ?? false,
      gender: dislikeFilterScreen?.gender ?? 'all',
      contains: dislikeFilterScreen?.contains ?? '',
    };
    try {
      const response = await getReactions(userId, queryParams);
      setBabyNamesData(response?.disLikes ?? []);
      setIsLoading(false);
    } catch (error) {
      console.error(`Failed to fetch data: ${error}`);
      setIsLoading(false);
    }
  }, [dislikeFilterScreen, userId]);

  useEffect(() => {
    setCurrentPage(0);
    setHasMoreData(true);
    fetchBabyNamesData();
  }, [route.params, likeCount, dislikeCount, dislikeFilterScreen, userId]);

  const loadMoreData = useCallback(() => {
    if (!isLoading && hasMoreData) {
      fetchBabyNamesData();
    }
  }, [isLoading, hasMoreData, fetchBabyNamesData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchBabyNamesData();
      console.log('refresh dislike------>', res);
    } catch (error) {
      console.log(error, 'refresh error');
    }
    setIsRefreshing(false);
  }, [fetchBabyNamesData]);

  const likeuser = useCallback(
    async id => {
      console.log('dis Like id---->', id);

      const PAYLOAD = {
        userId: userId,
        nameId: id,
      };
      try {
        setLikedNames(prev => [...prev, id]);
        setBabyNamesData(prev => prev.filter(item => item.id !== id));
        let likes = await likeUser(PAYLOAD);
        console.log('Likes------>', likes);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId],
  );

  const renderNoMoreCardsText = useCallback(() => {
    if (babyNamesData.length === 0) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No results found</Text>
          </View>
        </View>
      );
    }
    return null;
  }, [babyNamesData.length]);

  const renderDivider = useCallback(
    () => <View style={styles.itemSeparator} />,
    [],
  );

  const renderBabyNameCard = useCallback(
    ({item}) => {
      const cardBackgroundColor = getCardBackgroundColor(item.gender);

      if (!likedNames.includes(item.id)) {
        return (
          <View style={styles.cardContainer}>
            <View style={styles.CompactdislikeButton} />
            <TouchableOpacity
              onPress={() => navigation.navigate('NameInformation', {item})}>
              <Text style={[styles.name, {color: cardBackgroundColor}]}>
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => likeuser(item.id)}
              style={[
                styles.CompactlikeButton,
                {backgroundColor: cardBackgroundColor},
              ]}>
              <AntDesign name="like2" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
        );
      }
      return null;
    },
    [likedNames, likeuser, navigation],
  );

  return (
    <SafeScreen backgroundColor="#454545">
      <View style={styles.container}>
        <FlatList
          data={babyNamesData}
          keyExtractor={keyExtractor}
          renderItem={renderBabyNameCard}
          ItemSeparatorComponent={renderDivider}
          ListEmptyComponent={renderNoMoreCardsText}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentContainerStyle}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
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

export default DislikeListScreen;
