import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import React, {useContext, useState, useEffect, useCallback} from 'react';
import {Colors} from '../../styles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import {disLikeUser, getReactions} from '../../api';
import {Flash} from '../../util';
import {styles} from './likeListScreenStyles';


const LikeListScreen = ({navigation, route}) => {
  const {
    locale: {locale},
    dislikeCount,
    likeCount,
    seachfilterData,
    likeFilterScreen,
  } = useContext(AppContext);
  const [babyNamesData, setBabyNamesData] = useState([]);
  const [dislikedNames, setDislikedNames] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  const {
    isUserLoggedin,
    checkAuthState,
    authStateLoading,
    userId,
    access_token,
  } = useContext(AuthContext);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const filterParams = route?.params ?? [];

  const renderNoMoreCardsText = () => {
    if (babyNamesData?.length === 0) {
      // check if data is empty
      return (
        <View style={styles.container}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              position: 'relative',
              top: 1,
            }}>
            <Text style={{color: Colors.tintGray, fontSize: 18}}>
              No results found
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };
  // useEffect(() => {
  //   fetchBabyNamesData();
  // }, [dislikeCount, likeCount]);
  useEffect(() => {
    fetchBabyNamesData(); // Call on component mount.
  }, []);
  useEffect(() => {
    console.log('FFFFFF=----------->', babyNamesData);
    console.log('MMMMM=----------->', likeFilterScreen);
  }, [likeFilterScreen]);
  useEffect(() => {
    setCurrentPage(0); // Reset to the first page whenever filters change or counts change
    setHasMoreData(true); // Reset the assumption of more data
    fetchBabyNamesData();
  }, [route.params]);

  const loadMoreData = () => {
    if (!isLoading && hasMoreData) {
      fetchBabyNamesData();
    }
  };

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
      setBabyNamesData(response.likes);
      setIsLoading(false);
      console.log(
        'After setting state lastLetter',
        filterParams.filter?.lastLetter,
      );
    } catch (error) {
      console.error(`Failed to fetch data: ${error}`);
      setIsLoading(false);
    }
  }, [filterParams?.filter, likeFilterScreen, userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true); // Set the refreshing state to true
    fetchBabyNamesData();
    try {
      const res = await fetchBabyNamesData(); // Fetch new data
      console.log('refresh like------>', res);
    } catch (error) {
      console.log(error);
    }
    setIsRefreshing(false); // Set the refreshing state back to false
  };

  const disLikeuser = async id => {
    // console.log("Like User",isUserLoggedin,userId,access_token)
    console.log('hellooooooo');
    console.log('dis Like id-vv--->', id);

    const PAYLOAD = {
      userId: userId,
      nameId: id,
    };
    try {
      setDislikedNames([...dislikedNames, id]);
      setBabyNamesData(babyNamesData.filter(item => item.id !== id));
      let dislikes = await disLikeUser(PAYLOAD);
      console.log('Dislikes------>', dislikes);
    } catch (e) {
      console.log('err', e);
    }
  };
  // Render loader only during initial loading
  const renderLoader = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    return null;
  };
  const getCardBackgroundColor = gender => {
    if (gender === 'Female') {
      return Colors.secondary;
    } else if (gender === 'Male') {
      return Colors.Boy;
    } else if (gender === 'Unisex') {
      return Colors.unisex; // You can use the specific brown color value here
    }
    return Colors.Boy; // A default color if none of the conditions match
  };

  const renderDivider = () => <View style={styles.itemSeparator} />;
  const renderBabyNameCard = ({item}) => {
    const cardBackgroundColor = getCardBackgroundColor(item.gender);

    if (!dislikedNames.includes(item.id)) {
      return (
        <>
          <View style={styles.cardContainer}>
            {/* Add like and dislike buttons here */}
            <TouchableOpacity
              onPress={() => disLikeuser(item.id)}
              style={styles.CompactdislikeButton}>
              <AntDesign name="dislike2" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NameInformation', {item})}>
              <Text style={{color: cardBackgroundColor}}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.CompactlikeButton}>
              {/* <AntDesign name="like2" size={20} color={Colors.WHITE} /> */}
            </TouchableOpacity>
          </View>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={babyNamesData}
          style={{margin: 0}}
          keyExtractor={item => item.id}
          renderItem={renderBabyNameCard}
          ItemSeparatorComponent={renderDivider} // Add the divider line
          showsVerticalScrollIndicator={false} // Remove the scroll bar line
          contentContainerStyle={{flexGrow: 1}} // Add this line
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderNoMoreCardsText()} // Render when the list is empty
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
        />

        {/* <View style={styles.itemSeparator} /> */}
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </>
  );
};

export default LikeListScreen;
