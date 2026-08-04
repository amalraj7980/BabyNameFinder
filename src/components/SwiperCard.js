import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  PanResponder,
  Dimensions,
  Share,
} from 'react-native';
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {Colors} from '../styles';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const getCardBackgroundColor = gender => {
  if (gender === 'Female') {
    return Colors.secondary;
  } else if (gender === 'Male') {
    return Colors.primary;
  } else if (gender === 'Neutral') {
    return Colors.unisex; // You can use the specific brown color value here
  }
  return Colors.primary; // A default color if none of the conditions match
};
const RenderCardItem = ({
  item,
  index,
  navigation,
  userId,
  likeuser,
  disLikeuser,
  setIsPopupVisible,
  shareNameList,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const rotateAndTranslate = {
    transform: [
      {
        rotate: rotate,
      },
      ...position.getTranslateTransform(),
    ],
  };

  const likeOpacity = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
      }),
    [position.x],
  );

  const dislikeOpacity = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [1, 0, 0],
        extrapolate: 'clamp',
      }),
    [position.x],
  );

  const nextCardOpacity = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [1, 0, 1],
        extrapolate: 'clamp',
      }),
    [position.x],
  );

  const nextCardScale = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: [1, 0.8, 1],
        extrapolate: 'clamp',
      }),
    [position.x],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({x: gestureState.dx, y: gestureState.dy});
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          Animated.spring(position, {
            toValue: {x: SCREEN_WIDTH + 100, y: gestureState.dy},
          }).start(() => {
            setCurrentIndex(state => state + 1);
            position.setValue({x: 0, y: 0});
          });
        } else if (gestureState.dx < -120) {
          Animated.spring(position, {
            toValue: {x: -SCREEN_WIDTH - 100, y: gestureState.dy},
          }).start(() => {
            setCurrentIndex(state => state + 1);
            position.setValue({x: 0, y: 0});
          });
        } else {
          Animated.spring(position, {
            toValue: {x: 0, y: 0},
            friction: 2, // Adjust this value to control animation speed
          }).start();
        }
      },
    }),
  ).current;

  if (index < currentIndex) {
    return null;
  }
  const cardBackgroundColor = getCardBackgroundColor(item.gender);

  const isCurrentCard = index === currentIndex;
  const animatedStyle = isCurrentCard ? rotateAndTranslate : {};
  const opacityStyle = isCurrentCard ? likeOpacity : nextCardOpacity;
  const transformStyle = isCurrentCard ? '-30deg' : '30deg';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      key={`${item.id}_${Math.random()}`}
      style={[
        animatedStyle,
        {
          height: SCREEN_HEIGHT - 120,
          width: SCREEN_WIDTH,
          padding: 10,
          position: 'absolute',
        },
      ]}>
      {isCurrentCard && (
        <>
          <Animated.View
            style={{
              opacity: likeOpacity,
              transform: [{rotate: '-30deg'}],
              position: 'absolute',
              top: 50,
              left: 0,
              zIndex: 1000,
            }}>
            <Text
              style={{
                borderWidth: 1,
                borderColor: 'green',
                color: 'green',
                fontSize: 32,
                fontWeight: '800',
                padding: 10,
              }}>
              LIKE
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: dislikeOpacity,
              transform: [{rotate: '30deg'}],
              position: 'absolute',
              top: 50,
              right: 40,
              zIndex: 1000,
            }}>
            <Text
              style={{
                borderWidth: 1,
                borderColor: 'red',
                color: 'red',
                fontSize: 32,
                fontWeight: '800',
                padding: 10,
              }}>
              Dislike
            </Text>
          </Animated.View>
        </>
      )}

      <View
        style={{
          height: '95%',
          width: '100%',
          backgroundColor: cardBackgroundColor,
          borderRadius: 15,
        }}>
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            paddingBottom: 20,
            paddingTop: 20,
          }}>
          <TouchableOpacity onPress={() => shareNameList(item.name)}>
            <AntDesign name="sharealt" size={32} color={Colors.WHITE} />
          </TouchableOpacity>
          <Text style={{color: Colors.WHITE, fontSize: 38}}>{item.name}</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}>
            <TouchableOpacity
              onPress={() => {
                if (userId) {
                  disLikeuser(item.id);
                } else {
                  setIsPopupVisible(true);
                  console.log('user not logined');
                }
              }}
              style={{marginRight: 40, alignItems: 'flex-start'}}>
              <Foundation name="dislike" size={40} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('NameInformation', {item: item})
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
                if (userId) {
                  likeuser(item.id);
                } else {
                  setIsPopupVisible(true);
                  console.log('user not logined');
                }
              }}
              style={{marginLeft: 40, alignItems: 'flex-end'}}>
              <Foundation name="like" size={40} color={Colors.WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default RenderCardItem;
