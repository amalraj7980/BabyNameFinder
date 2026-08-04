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
  Animated,
  Alert,
  PanResponder,
  Button,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import SwipeCards from 'react-native-swipe-cards';

import {Colors} from '../../styles';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {disLikeUser, likeUser, getExcludeReactions, subscribeBabyNames} from '../../api';
import {AppContext} from '../../context/AppContext';
import {AuthContext} from '../../context/AuthContext';
import {Storage} from '../../util';
import CustomPopup from '../../components/CustomPopup';
import RenderCardItem from '../../components/SwiperCard';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
import Share from 'react-native-share';
import useBackExit from '../../hooks/useBackExit';
import {styles} from './babyNamesScreenStyles';


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
        <Text style={{color: Colors.tintGray, fontSize: 18}}>
          No results found
        </Text>
      </View>
    </View>
  );
};
const BabyNamesScreen = ({navigation, route}) => {
  const {
    locale: {locale},
    setSeachfilterData,
    seachfilterData, //Home filter
    setIsUndoEnabled,
    isUndoEnabled,
    swipeBlocked,
    setSwipeBlocked,
    deviceId,
    setBabyNamesCount,
    babyNamesCount,
  } = useContext(AppContext);
  const {
    isUserLoggedin,
    access_token,
    loginOccurred,
    userId,
    firebaseReady,
    authStateLoading,
  } = useContext(AuthContext);
  const [babyNamesData, setBabyNamesData] = useState([]);
  const [page, setPage] = useState(0);

  const [likedNames, setLikedNames] = useState([]);
  const [dislikedNames, setDislikedNames] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [fetchFilterData, setFetchFilterData] = useState([]);

  const [filterParams, setFilterParams] = useState(route?.params ?? {});
  const [isFilterActive, setIsFilterActive] = useState(!!filterParams.filter);
  //console.log('wwwwww----->', filterParams);
  const [swipeCounter, setSwipeCounter] = useState(0);
  useBackExit();
  const getDeviceId = async () => {
    console.log('deviceId------------------------123-->', deviceId);
  };
  useEffect(() => {
    getDeviceId();
    console.log(
      'seachfilterData--------->context$$$$$$$$$$$$$-------->',
      seachfilterData,
      seachfilterData.compoundLetter,
    );
  }, [seachfilterData]);

  useEffect(() => {
    // You can use this effect to listen for changes in route.params
    // and update the filterParams and isFilterActive state accordingly.
    setFilterParams(route?.params ?? {});
    setIsFilterActive(!!route?.params?.filter);
  }, [route?.params]);

  const token = route.params?.token ?? null;

  console.log('Received Token:', token, 'userId:', userId);

  const [isLoading, setIsLoading] = useState(false);

  const fetchBabyNamesData = useCallback(
    async pageNumber => {
      setIsLoading(true);
      const queryParams = {
        pageCount: 1000,
        page: 0,
        u: userId ?? 0,
        startWith: seachfilterData?.firstLetter ?? '',
        endsWith: seachfilterData?.lastLetter ?? '',
        compoundName: seachfilterData?.compoundLetter ?? true,
        gender: seachfilterData?.gender ?? 'all',
        contains: seachfilterData?.contains ?? '',
      };

      console.log(
        'load names — guest or signed:',
        {isUserLoggedin, userId},
      );
      try {
        const response = await getExcludeReactions(queryParams);
        setBabyNamesData(response.babyNames || []);
        setBabyNamesCount(filterParams ? response.count : 0);
        setIsLoading(false);
      } catch (error) {
        console.error(`Failed to fetch data: ${error}`);
        setIsLoading(false);
      }
    },
    [page, seachfilterData, userId, isUserLoggedin, filterParams],
  );

  const fetchData = useCallback(
    async pageNumber => {
      const queryParams = {
        pageCount: 1,
        page: 0,
        u: userId ?? 0,
        startWith: seachfilterData?.firstLetter ?? '',
        endsWith: seachfilterData?.lastLetter ?? '',
        compoundName: seachfilterData?.compoundLetter ?? true,
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
    },
    [page, seachfilterData, userId],
  );

  // Catalog is public — load for guest (unsigned) and signed-in users alike
  useEffect(() => {
    if (authStateLoading) {
      return;
    }
    fetchBabyNamesData(page);
    fetchData(page);
    setFetchFilterData(filterParams);
  }, [
    fetchBabyNamesData,
    fetchData,
    filterParams,
    route.params,
    authStateLoading,
    firebaseReady,
    userId,
    loginOccurred,
  ]);

  // Live Firestore catalog — same name list for guest + signed-in
  useEffect(() => {
    const unsubscribe = subscribeBabyNames(() => {
      fetchBabyNamesData();
      fetchData();
    });
    return unsubscribe;
  }, [fetchBabyNamesData, fetchData]);

  const ClearFilter = async () => {
    console.log('hello world');
    setFilterParams({});
    setIsFilterActive(false);
    setSeachfilterData({
      firstLetter: '',
      lastLetter: '',
      gender: 'all',
      contains: '',
      compoundLetter: false,
    });
  };

  const [cards, setCards] = useState(babyNamesData);

  // Function to update local state optimistically for a "Yup" (like) action
  const updateLocalLikeState = cardId => {
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? {...card, isLiked: true} : card,
      ),
    );
  };

  // Function to revert local state in case of an error for a "Yup" (like) action
  const revertLikeLocalState = cardId => {
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? {...card, isLiked: false} : card,
      ),
    );
  };
  // Function to update local state optimistically for a "Nope" (dislike) action
  const updateLocalDislikeState = cardId => {
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? {...card, isDisliked: true} : card,
      ),
    );
  };

  // Function to revert local state in case of an error for a "Nope" (dislike) action
  const revertLocalDislikeState = cardId => {
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? {...card, isDisliked: false} : card,
      ),
    );
  };
  const likeuser = useCallback(
    async id => {
      try {
        const PAYLOAD = {
          userId: userId ?? 0,
          nameId: id,
        };
        const swipedCard = babyNamesData.find(item => item.id === id);
        setSwipedCards(state => [
          ...state,
          {card: swipedCard, action: 'liked'},
        ]);
        setLikedNames(state => [...state, id]);
        setBabyNamesData(state => state.filter(item => item.id !== id));
        // fetchData();
        const currentCount = await Storage.getBabyNamesCount();
        // Ensure the value is not null, and then decrease by 1
        if (currentCount !== null) {
          const updatedCount = currentCount - 1;
          setBabyNamesCount(updatedCount);
          await Storage.setBabyNamesCount(updatedCount);
        } else {
          console.log('No baby names count found in storage.');
        }
        //setBabyNamesCount(babyNamesCount - 1);
        const like = await likeUser(PAYLOAD);
        setIsUndoEnabled(true); // Re-enable the Undo button
        console.log('liked---->', like);
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId, babyNamesData],
  );

  const disLikeuser = useCallback(
    async id => {
      try {
        const PAYLOAD = {
          userId: userId ?? 0,
          nameId: id,
        };
        const swipedCard = babyNamesData.find(item => item.id === id);
        setSwipedCards(state => [
          ...state,
          {card: swipedCard, action: 'disliked'},
        ]);

        setDislikedNames(state => [...state, id]);
        setBabyNamesData(state => state.filter(item => item.id !== id));
        // fetchData();
        const currentCount = await Storage.getBabyNamesCount();
        // Ensure the value is not null, and then decrease by 1
        if (currentCount !== null) {
          const updatedCount = currentCount - 1;
          setBabyNamesCount(updatedCount);
          await Storage.setBabyNamesCount(updatedCount);
        } else {
          console.log('No baby names count found in storage.');
        }
        // setBabyNamesCount(babyNamesCount - 1);
        const dislike = await disLikeUser(PAYLOAD);
        console.log('disliked---->', dislike);

        setIsUndoEnabled(true); // Re-enable the Undo button
      } catch (e) {
        console.log('err', e);
      }
    },
    [userId, babyNamesData],
  );

  const undoLastSwipe = () => {
    if (swipedCards.length > 0) {
      // fetchData();
      setBabyNamesCount(babyNamesCount + 1);
      const lastSwiped = swipedCards.pop();
      setBabyNamesData([lastSwiped.card, ...babyNamesData]);
      setSwipedCards([...swipedCards]);

      const PAYLOAD = {
        userId: userId ?? 0,
        nameId: lastSwiped.card.id,
      };

      if (lastSwiped.action === 'liked') {
        likeUser(PAYLOAD)
          .then(() => {
            setLikedNames(state =>
              state.filter(id => id !== lastSwiped.card.id),
            );
            // setBabyNamesCount(babyNamesCount + 1);
            setIsUndoEnabled(false); // Disable the Undo button
          })
          .catch(error => {
            console.log('Error liking:', error);
          });
      } else if (lastSwiped.action === 'disliked') {
        disLikeUser(PAYLOAD)
          .then(() => {
            setDislikedNames(state =>
              state.filter(id => id !== lastSwiped.card.id),
            );
            //setBabyNamesCount(babyNamesCount + 1);
            setIsUndoEnabled(false); // Disable the Undo button
          })
          .catch(error => {
            console.log('Error disliking:', error);
          });
      }
    }
    if (babyNamesData.length <= 1) {
      // if this is the last card or no cards
      setIsUndoEnabled(false); // Disable the Undo button
    }
  };

  const shareNameList = async name => {
    const encodedName = encodeURIComponent(name); // Encode the name for URL
    const shareLink = `https://forking.riafy.in/babyname/babyName/details/${encodedName}`; // Replace with the actual long URL
    const shareMessage = `Hey! I've shortlisted the baby name "${name}". Discover more about it by clicking the link.`;
    const shareOptions = {
      title: 'Share via',
      message: shareMessage,
      url: shareLink,
    };
    console.log('name----->', name);
    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error(error);
    }
  };
  // <-----******* Swiper list data start *****---->
  const [swipedCards, setSwipedCards] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const Card = ({card, swipeDirection}) => {
    const cardBackgroundColor = getCardBackgroundColor(card.gender);
    return (
      <View style={styles.cardContainerCarosal}>
        <View style={[styles.card, {backgroundColor: cardBackgroundColor}]}>
          <TouchableOpacity onPress={() => shareNameList(card.name)}>
            <AntDesign name="sharealt" size={32} color={Colors.WHITE} />
          </TouchableOpacity>

          {/* Display the "Like" or "Dislike" text based on the action */}
          {/* {card.isLiked && <Text style={styles.likeText}>Like</Text>}
          {card.isDisliked && <Text style={styles.dislikeText}>Dislike</Text>} */}
          {swipeDirection == 'right' && (
            <Text style={styles.likeText}>Like</Text>
          )}
          {swipeDirection == 'left' && (
            <Text style={styles.dislikeText}>Dislike</Text>
          )}

          {/* <Text style={styles.name}>{card.name}</Text> */}
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <Text style={[styles.name, {fontSize: 50}]}>{card.name}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}>
            <TouchableOpacity
              onPress={() => {
                disLikeuser(card.id);
              }}
              style={{marginRight: 40, alignItems: 'flex-start'}}>
              <AntDesign name="dislike2" size={35} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('NameInformation', {item: card})
              }
              style={{marginLeft: 40, marginRight: 40, alignItems: 'center'}}>
              <AntDesign
                name="exclamationcircle"
                size={30}
                color={Colors.WHITE}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                likeuser(card.id);
              }}
              style={{marginLeft: 40, alignItems: 'flex-end'}}>
              <AntDesign name="like2" size={35} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    navigation.navigate('Auth');
  };
  const handleCancelPress = () => {
    setIsPopupVisible(false);
    // Additional actions for cancel button
  };

  //<-----******* Swiper list data end *****---->

  //<-----******* Compact list data start *****---->

  const renderDivider = () => <View style={styles.itemSeparator} />;
  const renderBabyNameCard = ({item}) => {
    const cardBackgroundColor = getCardBackgroundColor(item.gender);

    if (!likedNames.includes(item.id) && !dislikedNames.includes(item.id)) {
      return (
        <>
          <View style={styles.cardContainer}>
            {/* Add like and dislike buttons here */}
            <TouchableOpacity
              onPress={() => {
                disLikeuser(item.id);
              }}
              style={styles.CompactdislikeButton}>
              <AntDesign name="dislike2" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NameInformation', {item})}>
              <Text style={{color: cardBackgroundColor}}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                likeuser(item.id);
              }}
              style={styles.CompactlikeButton}>
              <AntDesign name="like2" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
        </>
      );
    }
    return null;
  };
  //<-----******* Compact list data end *****---->

  //<-----******* Grid View list data start *****---->

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
          <TouchableOpacity
            onPress={() => {
              disLikeuser(item.id);
            }}>
            <AntDesign name="dislike2" size={25} color={Colors.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('NameInformation', {item})}>
            <AntDesign
              name="exclamationcircle"
              size={20}
              color={Colors.WHITE}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              likeuser(item.id);
            }}>
            <AntDesign name="like2" size={25} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  //<-----******* Grid View list data end *****---->

  const [viewMode, setViewMode] = useState('CarouselView');

  const renderViewModeOption = (mode, label) => {
    const isSelected = viewMode === mode;
    const optionShapes = {
      CarouselView: (
        <View style={[styles.verticalRectangle, {height: 20, width: 8}]}>
          <View
            style={[
              styles.SwiperRectangle,
              isSelected && styles.selectedRectangle,
            ]}
          />
        </View>
      ),
      GridView: (
        <View style={[styles.verticalRectangle, {height: 20, width: 8}]}>
          <View
            style={[
              styles.GridRectangle,
              isSelected && styles.selectedRectangle,
            ]}
          />
          <View
            style={[
              styles.GridRectangle,
              isSelected && styles.selectedRectangle,
            ]}
          />
        </View>
      ),

      CompactList: (
        <View style={[styles.verticalRectangle, {height: 20, width: 8}]}>
          <View
            style={[
              styles.CompactRectangle,
              isSelected && styles.selectedRectangle,
            ]}
          />
          <View
            style={[
              styles.CompactRectangle,
              isSelected && styles.selectedRectangle,
            ]}
          />
          <View
            style={[
              styles.CompactRectangle,
              isSelected && styles.selectedRectangle,
            ]}
          />
        </View>
      ),
    };

    return (
      <TouchableOpacity
        style={[styles.viewModeOption, isSelected]}
        onPress={() => setViewMode(mode)}>
        {optionShapes[mode]}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          marginTop: 10,
        }}>
        <View style={styles.viewModeOptions}>
          {renderViewModeOption('CarouselView', 'Carousel View')}
          {renderViewModeOption('GridView', 'Grid View')}
          {renderViewModeOption('CompactList', 'Compact List')}
        </View>
        {isFilterActive ? (
          <TouchableOpacity
            onPress={ClearFilter}
            style={{
              marginRight: 10,
              padding: 5,
              borderColor: Colors.OrangeTint,
              borderWidth: 1.5,
              borderRadius: 3,
            }}>
            {filterParams.from ? (
              <Text style={{color: Colors.tintGray}}>Clear Search</Text>
            ) : (
              <Text style={{color: Colors.tintGray}}>Clear Filter</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {viewMode === 'CompactList' && (
        <>
          {/* // <View style={{marginBottom: 27}}> */}
          <FlatList
            data={babyNamesData}
            keyExtractor={item => String(item.id)}
            renderItem={renderBabyNameCard}
            ItemSeparatorComponent={renderDivider} // Add the divider line
            showsVerticalScrollIndicator={false} // Remove the scroll bar line
            onEndReached={() => {
              // Load more data when the end of the list is reached
              fetchBabyNamesData(page + 1); // Pass the next page number
              setPage(prevPage => prevPage + 1);
            }}
            ListEmptyComponent={renderNoMoreCardsText()} // Render when the list is empty
            onEndReachedThreshold={0.5} //Adjust this threshold as needed
            // onScroll={handleScroll} // Updated: Added onScroll
            // scrollEventThrottle={16} // Updated: Added scrollEventThrottle
          />
          {/* <View style={styles.itemSeparator} /> */}
          {/* {!isScrolling &&
            delayShowButton && ( // Updated: Hide button during scroll */}
          <View style={styles.transparentButtonContainer}>
            <TouchableOpacity
              onPress={async () => {
                const storedIsPrime = await Storage.getIsPrime();
                console.log('isstoredIsPrime------->', storedIsPrime);

                storedIsPrime
                  ? navigation.navigate('AiAssistant')
                  : navigation.navigate('InAppPurchase');
              }}>
              <Image
                source={require('../../assects/Ai.png')}
                style={{height: 135, width: 110, marginRight: 20}}
              />
            </TouchableOpacity>
          </View>
          {/* )} */}
        </>
      )}

      {viewMode === 'CarouselView' && (
        <>
          <View style={styles.Swipercontainer}>
            <SwipeCards
              cards={babyNamesData}
              cardKey="id"
              onSwipeLeft={() => setSwipeDirection('left')}
              onSwipeRight={() => setSwipeDirection('right')}
              renderCard={cardData => (
                <Card
                  card={cardData}
                  swipeDirection={swipeDirection}
                />
              )}
              loop={true}
              showYup={false} // Hide the Yup button
              showNope={false} // Hide the Nope button
              // yupText="Like"
              // nopeText="Dislike"
              noMoreCardsText={renderNoMoreCardsText()}
              handleNope={
                card => {
                  updateLocalDislikeState(card.id);
                  setSwipedCards([...swipedCards, {card, action: 'disliked'}]);
                  disLikeuser(card.id).then((err, data) => {
                    if (err) {
                      revertLocalDislikeState(card.id);
                    }
                    console.log('data---->', data);
                  }); // Using async/await here for better readability
                }
                // : swipeBlocked
                // ? async () => {
                //     if (swipeBlocked) {
                //       setIsPopupVisible(true);
                //       return;
                //     }
                //   }
                // : () => {
                //     // Increment the swipe counter
                //     setSwipeCounter(prev => {
                //       // If this is the 15th swipe
                //       if (prev === 14) {
                //         // Block further swiping
                //         // setSwipeBlocked(true);
                //         // Show the popup
                //         // setIsPopupVisible(true);
                //         return prev;
                //       }
                //       // Otherwise, just increment the swipe counter
                //       return prev + 1;
                //     });
                //   }
              }
              handleYup={
                card => {
                  updateLocalLikeState(card.id);
                  setSwipedCards([...swipedCards, {card, action: 'liked'}]);

                  likeuser(card.id).then((err, data) => {
                    if (err) {
                      revertLikeLocalState(card.id);
                    }
                    console.log('data---->', data);
                  }); // Using async/await here for better readability
                }
                // : swipeBlocked
                // ? async () => {
                //     if (swipeBlocked) {
                //       setIsPopupVisible(true);
                //       return;
                //     }
                //   }
                // : () => {
                //     // Increment the swipe counter
                //     setSwipeCounter(prev => {
                //       // If this is the 15th swipe
                //       if (prev === 14) {
                //         // Block further swiping
                //         //  setSwipeBlocked(true);
                //         // Show the popup
                //         // setIsPopupVisible(true);
                //         return prev;
                //       }
                //       // Otherwise, just increment the swipe counter
                //       return prev + 1;
                //     });
                //   }
              }
              stack={true}
              stackOffsetX={1}
              stackOffsetY={1}
              smoothTransition={true}
              outOfScreenOpacity={0.1}
              useNativeDriver={true}
              onClickHandler={() => {}}
              onCardRemoved={card => console.log('Card removed:', card)}
            />
          </View>
          {isUndoEnabled && babyNamesData.length > 0 ? (
            <TouchableOpacity
              onPress={undoLastSwipe}
              disabled={!isUndoEnabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                top: -5,
              }}>
              <Ionicons name="arrow-undo-sharp" size={23} color={'red'} />
              <Text style={{color: 'red', fontSize: 18}}>Undo</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      {viewMode === 'GridView' && (
        <>
          <FlatList
            data={babyNamesData}
            keyExtractor={item => String(item.id)}
            renderItem={renderGridItem}
            showsVerticalScrollIndicator={false} // Remove the scroll bar line
            onEndReached={() => {
              // Load more data when the end of the list is reached
              fetchBabyNamesData(page + 1); // Pass the next page number
              setPage(prevPage => prevPage + 1);
            }}
            onEndReachedThreshold={0.5} //Adjust this threshold as needed
            ListEmptyComponent={renderNoMoreCardsText()} // Render when the list is empty
            // onScroll={handleScroll} // Updated: Added onScroll
            // scrollEventThrottle={16} // Updated: Added scrollEventThrottle
          />

          {/* {!isScrolling &&
            delayShowButton && ( // Updated: Hide button during scroll */}
          <View style={styles.transparentButtonContainer}>
            <TouchableOpacity
              onPress={async () => {
                const storedIsPrime = await Storage.getIsPrime();
                console.log('isstoredIsPrime------->', storedIsPrime);

                storedIsPrime
                  ? navigation.navigate('AiAssistant')
                  : navigation.navigate('InAppPurchase');
              }}>
              <Image
                source={require('../../assects/Ai.png')}
                style={{height: 135, width: 110, marginRight: 20}}
              />
            </TouchableOpacity>
          </View>
          {/* )} */}
        </>
      )}
      {/* {filteredData.map((name) => (
        <Text key={name.id}>{name.name}</Text>
      ))} */}

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
  );
};
const {width, height} = Dimensions.get('window');


export default BabyNamesScreen;
