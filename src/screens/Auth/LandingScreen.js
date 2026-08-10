import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import PagerView from 'react-native-pager-view';
import {Colors} from '../../styles';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SafeScreen from '../../components/SafeScreen';
import {styles} from './landingScreenStyles';

const LandingScreen = ({handleStart}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const insets = useSafeAreaInsets();

  return (
    <SafeScreen
      edges={['top', 'bottom', 'left', 'right']}
      backgroundColor={Colors.primary}>
      <View style={styles.container}>
        <PagerView
          style={styles.wrapper}
          initialPage={0}
          onPageSelected={e => setActiveIndex(e.nativeEvent.position)}>
          {/** Swiper1*/}
          <View key="1" style={styles.slide}>
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
              <Text style={styles.text}>Baby Names</Text>
              <View style={styles.imageContainer}>
                <FastImage
                  source={require('../../assects/card4.gif')}
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
              <Text style={styles.slideText}>
                Select Your Preferred Names from Our Vast 30,000-Name Database.
                <Text> </Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={styles.slideText}>Swipe to left</Text>
                <Ionicons
                  name="arrow-back"
                  size={23}
                  color={Colors.OrangeTint}
                  style={{paddingLeft: 10}}
                />
              </View>
            </View>
          </View>
          {/** Swiper2*/}
          <View key="2" style={styles.slide}>
            <View style={{flexDirection: 'column'}}>
              <Text style={styles.text}>Baby Names</Text>
              <View style={styles.imageContainer}>
                <FastImage
                  source={require('../../assects/card3.gif')}
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
              <Text style={styles.slideText}>
                Easily compare your selected names in the app to discover the
                perfect one for your newborn.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={styles.slideText}>Swipe to left</Text>
                <Ionicons
                  name="arrow-back"
                  size={23}
                  color={Colors.OrangeTint}
                  style={{paddingLeft: 10}}
                />
              </View>
            </View>
          </View>
          {/**Swiper3 */}
          <View key="3" style={styles.slide3}>
            <View style={styles.startButtonContainer}>
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Text style={styles.startButtonText}>START</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.slide}>
              <View
                style={{
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                <Text
                  style={[
                    styles.text,
                    {marginTop: -35, textAlign: 'center', marginRight: 0},
                  ]}>
                  Baby Names
                </Text>
                <View style={styles.imageContainer}>
                  <FastImage
                    source={require('../../assects/card2.gif')}
                    style={styles.image}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                </View>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    flexDirection: 'row',
                    marginRight: 0,
                    marginTop: -22,
                  }}>
                  <Text style={styles.slideText3}>
                    Subscribe to Unlock the Power of AI in finding the Ideal Name
                    for Your Baby
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </PagerView>

        <View
          style={[
            styles.customPagination,
            {bottom: Math.max(insets.bottom, 24)},
          ]}>
          <View
            style={activeIndex === 0 ? styles.activeDot : styles.inactiveDot}
          />
          <View
            style={activeIndex === 1 ? styles.activeDot : styles.inactiveDot}
          />
          <View
            style={activeIndex === 2 ? styles.activeDot : styles.inactiveDot}
          />
        </View>
      </View>
    </SafeScreen>
  );
};

export default LandingScreen;
