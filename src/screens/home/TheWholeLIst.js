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
  ActivityIndicator
} from 'react-native';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import CustomPopup from '../../components/CustomPopup';
import {toggleLikeUser, getAllBabyNames, subscribeBabyNames, getReactions} from '../../api';
import {Colors} from '../../styles';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Toast from 'react-native-toast-message';
import {styles} from './theWholeLIstStyles';
import SafeScreen from '../../components/SafeScreen';
import {useSafeAreaInsets} from 'react-native-safe-area-context';


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

const TheWholeLIst = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {
    locale: {locale},
    seachfilterDataWholeNames, // Access filterData from AppContext
  } = useContext(AppContext);
  const [babyNamesData, setBabyNamesData] = useState([]);
  const [page, setPage] = useState(1);
  const [liked, setLiked] = useState(false);

  const [likedNames, setLikedNames] = useState([]);
  const [dislikedNames, setDislikedNames] = useState([]);
  const {userId} = useContext(AuthContext);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [fetchFilterData, setFetchFilterData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const filterParams = route?.params ?? [];
  const renderNoMoreCardsText = () => {
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
          {route?.params ? (
            <Text style={{color: Colors.tintGray, fontSize: 18}}>
              No results found
            </Text>
          ) : null}
        </View>
      </View>
    );
  };
  const fetchBabyNamesData = useCallback(
    async pageNumber => {
      setIsLoading(true);
      const queryParams = {
        pageCount: 1000,
        page: 0,
        startWith: seachfilterDataWholeNames?.firstLetter ?? '',
        endsWith: seachfilterDataWholeNames?.lastLetter ?? '',
        compoundName: seachfilterDataWholeNames?.compoundLetter ?? true,
        gender: seachfilterDataWholeNames?.gender ?? 'all',
        contains: seachfilterDataWholeNames?.contains ?? '',
        forceRefresh: true,
      };
      try {
        const data = await getAllBabyNames(queryParams);
        let likedIds = new Set();
        try {
          const reactions = await getReactions(userId ?? 0, {});
          likedIds = new Set((reactions?.likes || []).map(n => String(n.id)));
        } catch (e) {
          // guest / no reactions yet
        }
        console.log('whole list names:', data?.length, data);
        const newData = (data || []).map(item => ({
          ...item,
          liked: likedIds.has(String(item.id)),
        }));
        setBabyNamesData(newData);
        setIsLoading(false);
      } catch (error) {
        console.error(`Failed to fetch data: ${error}`);
        setIsLoading(false);
      }
    },
    [filterParams?.filter, page, seachfilterDataWholeNames, userId],
  );

  useEffect(() => {
    fetchBabyNamesData(page);
    setFetchFilterData(filterParams);
  }, [fetchBabyNamesData, page, route.params]);

  useEffect(() => {
    const unsubscribe = subscribeBabyNames(() => {
      fetchBabyNamesData(page);
    });
    return unsubscribe;
  }, [fetchBabyNamesData, page]);

  const likeuser = useCallback(
    async id => {
      try {
        const PAYLOAD = {
          userId: userId ?? 0,
          nameId: id,
        };

        const likedData = await toggleLikeUser(PAYLOAD);

        console.log(likedData.liked);
        setLiked(likedData.liked);
        // Display a toast on successful like
        setBabyNamesData(prevData =>
          prevData.map(item =>
            item.id === id ? {...item, liked: likedData.liked} : item,
          ),
        );
        if (likedData.liked) {
          // Toast.show({
          //   type: 'success',
          //   position: 'bottom',
          //   // text1: 'Liked',
          //   text1: 'Name added in your favourites!',
          //   visibilityTime: 4000,
          //   autoHide: true,
          //   bottomOffset: 50,
          //   style: {backgroundColor: 'green'},
          // });

          Toast.show({
            type: 'success',
            position: 'bottom',
            text1: 'Name added in your favourites!',
            visibilityTime: 4000,
            autoHide: true,
            bottomOffset: 50,
            style: {backgroundColor: 'red'},
          });
        } else {
          Toast.show({
            type: 'error',
            position: 'bottom',
            // text1: 'Disiked',
            text1: 'Name removed from your favourites!',
            visibilityTime: 4000,
            autoHide: true,
            bottomOffset: 50,
          });
        }
        // setLikedNames(state => [...state, id]);
        // setBabyNamesData(state => state.filter(item => item.id !== id));
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId],
  );
  const closePopup = () => {
    setIsPopupVisible(false);
    navigation.navigate('Auth');
  };
  const handleCancelPress = () => {
    setIsPopupVisible(false);
    // Additional actions for cancel button
  };
  const renderGridItem = ({item}) => {
    const cardBackgroundColor = getCardBackgroundColor(item.gender);

    return (
      <View style={[styles.gridCard, {backgroundColor: cardBackgroundColor}]}>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          <Text style={styles.name}>{item.name}</Text>
        </View>
        {/* <Text style={styles.details}>{`Gender: ${item.gender} | Meaning: ${item.meaning}`}</Text> */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}>
          <Text></Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NameInformation', {item})}>
            <AntDesign
              name="exclamationcircle"
              size={20}
              color={Colors.WHITE}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              zIndex: 5,
              // height: 80,
              // width: 80,
              // alignItems: 'center',
              // justifyContent: 'center',
            }}
            onPress={() => {
              likeuser(item.id);
            }}>
            {item.liked ? (
              <AntDesign name="like1" size={32} color={Colors.WHITE} />
            ) : (
              <AntDesign name="like2" size={32} color={Colors.WHITE} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeScreen backgroundColor={Colors.background || Colors.WHITE}>
      <View style={styles.container}>
        <FlatList
          data={babyNamesData}
          keyExtractor={item => `${item.id}_${Math.random()}`} // Use a random value to ensure uniqueness
          renderItem={renderGridItem}
          showsVerticalScrollIndicator={false} // Remove the scroll bar line
          contentContainerStyle={{paddingBottom: insets.bottom + 24}}
          onEndReached={() => {
            // Load more data when the end of the list is reached
            fetchBabyNamesData(page + 1); // Pass the next page number
            setPage(prevPage => prevPage + 1);
          }}
          onEndReachedThreshold={0.5} //Adjust this threshold as needed
          ListEmptyComponent={renderNoMoreCardsText()} // Render when the list is empty
        />
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        <CustomPopup
          isVisible={isPopupVisible}
          onClose={closePopup}
          message={locale.notloginedMessage}
          title={locale.notLoginedTitle}
          onCancel={handleCancelPress} // Optional cancel button action
          cancelText="Cancel" // Optional cancel button text
          style={{width: '80%'}}
        />
      </View>
    </SafeScreen>
  );
};

export default TheWholeLIst;

