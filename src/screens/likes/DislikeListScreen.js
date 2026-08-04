import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, {useContext, useState, useEffect, useCallback} from 'react';
import {Colors} from '../../styles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import {likeUser, getReactions} from '../../api';
import Flash from '../../util/Flash';
import {Storage} from '../../util';
import {styles} from './dislikeListScreenStyles';


const DislikeListScreen = ({navigation, route}) => {
  const {
    locale: {locale},
    likeCount,
    dislikeCount,
    seachfilterData,
    setDislikeFilterScreen, // Access setFilterData from AppContext
    dislikeFilterScreen,
  } = useContext(AppContext);
  const [babyNamesData, setBabyNamesData] = useState([]);
  const [likedNames, setLikedNames] = useState([]);
  const {userId} = useContext(AuthContext);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const filterParams = route?.params ?? [];

  const renderNoMoreCardsText = () => {
    if (babyNamesData.length === 0) {
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

  useEffect(() => {
    setCurrentPage(0);
    setHasMoreData(true);
    fetchBabyNamesData();
  }, [route.params, likeCount, dislikeCount, dislikeFilterScreen, userId]);

  const loadMoreData = () => {
    if (!isLoading && hasMoreData) {
      fetchBabyNamesData();
    }
  };

  const fetchBabyNamesData = useCallback(
    async () => {
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
    },
    [dislikeFilterScreen, userId],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true); // Set the refreshing state to true
    fetchBabyNamesData();

    try {
      const res = await fetchBabyNamesData(); // Fetch new data
      console.log('refresh dislike------>', res);
    } catch (error) {
      console.log(error, 'refresh error');
    }
    setIsRefreshing(false); // Set the refreshing state back to false
  };

  const likeuser = async id => {
    // console.log("Like User",isUserLoggedin,userId,access_token)
    console.log('dis Like id---->', id);

    const PAYLOAD = {
      userId: userId,
      nameId: id,
    };
    try {
      setLikedNames([...likedNames, id]);
      setBabyNamesData(babyNamesData.filter(item => item.id !== id));
      let likes = await likeUser(PAYLOAD);
      console.log('Likes------>', likes);
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

    if (!likedNames.includes(item.id)) {
      return (
        <>
          <View style={styles.cardContainer}>
            {/* Add like and dislike buttons here */}
            <View style={styles.CompactdislikeButton}></View>
            <TouchableOpacity
              onPress={() => navigation.navigate('NameInformation', {item})}>
              <Text style={{color: cardBackgroundColor}}>{item.name}</Text>
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
        </>
      );
    }
    return null;
  };

  return (
    <>
      {/* <View style={styles.container}>
        <FlatList data={babyNamesData} keyExtractor={(item) => item.id}
         renderItem={renderBabyNameCard}
         ItemSeparatorComponent={renderDivider} // Add the divider line
        showsVerticalScrollIndicator={false} // Remove the scroll bar line
        />
        <View style={styles.itemSeparator} />
  </View> */}
      <View style={styles.container}>
        {/* {babyNamesData.length === 0 ? (
          <View
            style={{alignItems: 'center', flex: 1, justifyContent: 'center'}}>
            <Text style={{color: Colors.BLACK, fontWeight: 'bold'}}>
              No data available
            </Text>
          </View>
        ) : (
          // Render the FlatList when babyNamesData has items */}
        <FlatList
          data={babyNamesData}
          keyExtractor={item => item.id}
          renderItem={renderBabyNameCard}
          ItemSeparatorComponent={renderDivider}
          ListEmptyComponent={renderNoMoreCardsText()} // Render when the list is empty
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{flexGrow: 1}} // Add this line
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]} // Customize the refreshing indicator color
            />
          }
        />
        {/* )} */}
        {/* <View style={styles.itemSeparator} /> */}
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        {/* {renderLoader()} */}
      </View>
    </>
  );
};

export default DislikeListScreen;

// import React, {useState, useEffect, useRef} from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   Dimensions,
//   TouchableOpacity,
//   Image,
//   Animated,
//   PanResponder,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import {Colors} from '../../styles';
// import Foundation from 'react-native-vector-icons/Foundation';
// import AntDesign from 'react-native-vector-icons/AntDesign';

// const SCREEN_HEIGHT = Dimensions.get('window').height;
// const SCREEN_WIDTH = Dimensions.get('window').width;

// const Users = [
//   {id: 1, name: 'Amal'},
//   {id: 2, name: 'Varun'},
//   {id: 3, name: 'Sarun'},
//   {id: 4, name: 'Vimal'},
// ];

// const DislikeListScreen = () => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [undoStack, setUndoStack] = useState([]); // New state for the undo stack
//   const position = useRef(new Animated.ValueXY()).current;

//   const rotate = position.x.interpolate({
//     inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
//     outputRange: ['-10deg', '0deg', '10deg'],
//     extrapolate: 'clamp',
//   });

//   const rotateAndTranslate = {
//     transform: [
//       {
//         rotate: rotate,
//       },
//       ...position.getTranslateTransform(),
//     ],
//   };

//   const likeOpacity = position.x.interpolate({
//     inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
//     outputRange: [0, 0, 1],
//     extrapolate: 'clamp',
//   });

//   const dislikeOpacity = position.x.interpolate({
//     inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
//     outputRange: [1, 0, 0],
//     extrapolate: 'clamp',
//   });

//   const nextCardOpacity = position.x.interpolate({
//     inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
//     outputRange: [1, 0, 1],
//     extrapolate: 'clamp',
//   });

//   const nextCardScale = position.x.interpolate({
//     inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
//     outputRange: [1, 0.8, 1],
//     extrapolate: 'clamp',
//   });

//   const undoLastAction = () => {
//     if (undoStack.length > 0) {
//       const lastAction = undoStack.pop();
//       setCurrentIndex(lastAction);
//       setUndoStack([...undoStack]);
//     }
//   };
//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: (evt, gestureState) => true,
//       onPanResponderMove: (evt, gestureState) => {
//         position.setValue({x: gestureState.dx, y: gestureState.dy});
//       },
//       onPanResponderRelease: (evt, gestureState) => {
//         if (gestureState.dx > 120) {
//           Animated.spring(position, {
//             toValue: {x: SCREEN_WIDTH + 100, y: gestureState.dy},
//           }).start(() => {
//             setUndoStack([...undoStack, currentIndex]); // Add the current index to undoStack
//             setCurrentIndex(currentIndex + 1); // Increment the current index
//             position.setValue({x: 0, y: 0}); // Reset the card position
//           });
//         } else if (gestureState.dx < -120) {
//           Animated.spring(position, {
//             toValue: {x: -SCREEN_WIDTH - 100, y: gestureState.dy},
//           }).start(() => {
//             setUndoStack([...undoStack, currentIndex]); // Add the current index to undoStack
//             setCurrentIndex(currentIndex + 1); // Increment the current index
//             position.setValue({x: 0, y: 0}); // Reset the card position
//           });
//         } else {
//           Animated.spring(position, {
//             toValue: {x: 0, y: 0},
//             friction: 4,
//           }).start();
//         }
//       },
//     }),
//   ).current;

//   const renderCardItem = (item, i) => {
//     if (i < currentIndex || i >= Users.length) {
//       return null;
//     }

//     const isCurrentCard = i === currentIndex;
//     const animatedStyle = isCurrentCard ? rotateAndTranslate : {};
//     const opacityStyle = isCurrentCard ? likeOpacity : nextCardOpacity;
//     const transformStyle = isCurrentCard ? '-40deg' : '40deg';

//     return (
//       <Animated.View
//         {...panResponder.panHandlers}
//         key={item.id}
//         style={[
//           animatedStyle,
//           {
//             height: SCREEN_HEIGHT - 120,
//             width: SCREEN_WIDTH,
//             padding: 10,
//             position: 'absolute',
//           },
//         ]}>
//         {isCurrentCard && (
//           <>
//             <Animated.View
//               style={{
//                 opacity: likeOpacity,
//                 transform: [{rotate: '-30deg'}],
//                 position: 'absolute',
//                 top: 50,
//                 left: 40,
//                 zIndex: 1000,
//               }}>
//               <Text
//                 style={{
//                   borderWidth: 1,
//                   borderColor: 'green',
//                   color: 'green',
//                   fontSize: 32,
//                   fontWeight: '800',
//                   padding: 10,
//                 }}>
//                 LIKE
//               </Text>
//             </Animated.View>

//             <Animated.View
//               style={{
//                 opacity: dislikeOpacity,
//                 transform: [{rotate: '30deg'}],
//                 position: 'absolute',
//                 top: 50,
//                 right: 40,
//                 zIndex: 1000,
//               }}>
//               <Text
//                 style={{
//                   borderWidth: 1,
//                   borderColor: 'red',
//                   color: 'red',
//                   fontSize: 32,
//                   fontWeight: '800',
//                   padding: 10,
//                 }}>
//                 Dislike
//               </Text>
//             </Animated.View>
//           </>
//         )}

//         <View
//           style={{
//             height: '95%',
//             width: '100%',
//             backgroundColor: Colors.secondary,
//             borderRadius: 15,
//           }}>
//           <View
//             style={{
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               flex: 1,
//               paddingBottom: 20,
//               paddingTop: 20,
//             }}>
//             <TouchableOpacity>
//               <AntDesign name="sharealt" size={32} color={Colors.WHITE} />
//             </TouchableOpacity>
//             <Text style={{color: Colors.WHITE, fontSize: 38}}>{item.name}</Text>
//             <View
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 justifyContent: 'space-around',
//               }}>
//               <TouchableOpacity
//                 style={{marginRight: 40, alignItems: 'flex-start'}}>
//                 <Foundation name="dislike" size={40} color={Colors.WHITE} />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={{marginLeft: 40, marginRight: 40, alignItems: 'center'}}>
//                 <AntDesign
//                   name="exclamationcircle"
//                   size={30}
//                   color={Colors.WHITE}
//                 />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={{marginLeft: 40, alignItems: 'flex-end'}}>
//                 <Foundation name="like" size={40} color={Colors.WHITE} />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Animated.View>
//     );
//   };

//   // Step 2: Modify the renderUsers function to iterate over the Users array
//   const renderUsers = () => {
//     if (currentIndex >= Users.length) {
//       return <Text>No more cards!</Text>; // Show a message when no more cards are available
//     }

//     return Users.map((item, i) => {
//       return renderCardItem(item, i);
//     }).reverse();
//   };

//   return (
//     <View style={{flex: 1}}>
//       <View style={{height: 60}}></View>
//       <View style={{flex: 1}}>{renderUsers()}</View>
//       <View style={{height: 60}}></View>
//       <View style={{height: 60}}>
//         <TouchableOpacity
//           style={{
//             backgroundColor: 'blue',
//             height: '100%',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//           onPress={undoLastAction}>
//           <Text style={{color: 'white', fontSize: 18}}>Undo</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default DislikeListScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });
