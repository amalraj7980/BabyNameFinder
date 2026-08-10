import React, {useState, useContext, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Foundation from 'react-native-vector-icons/Foundation';
import {Colors} from '../../styles';
import {Svg, Path} from 'react-native-svg';
import {AuthContext} from '../../context/AuthContext';
import {AppContext} from '../../context/AppContext';
import CustomPopup from '../../components/CustomPopup';
import Share from 'react-native-share';
import {likedNamesCollection, dislikedNamesCollection} from '../../firebase/firestore';
import {getLikeDislikeCount} from '../../api';
import {Storage} from '../../util';
import DeviceInfo from 'react-native-device-info';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const CustomDrawerContent = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets), [insets]);
  const {logoutUser} = useContext(AuthContext);
  const {
    locale: {locale},
    likeCount,
    dislikeCount,
    setLikeCount,
    setDislikeCount,
    isPrime,
    setIsUndoEnabled,
    setSeachfilterData,
    seachfilterData,
    isUndoEnabled,
  } = useContext(AppContext);

  const [selectedItem, setSelectedItem] = useState(null);
  const {isUserLoggedin, authStateLoading, userId, access_token, isAnonymous} =
    useContext(AuthContext);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleDrawerItemPress = screen => {
    setSelectedItem(screen);
    // Screens live inside the Home stack (AppStack), not as drawer routes.
    navigation.navigate('Home', {screen});
    navigation.closeDrawer?.();
  };
  // user not logined
  const closePopup = () => {
    setIsPopupVisible(false);
    navigation.navigate('Auth');
  };
  const handleCancelPress = () => {
    setIsPopupVisible(false);
  };

  const showLogoutPrompt = () => {
    Alert.alert(
      locale?.alert?.logout?.title,
      locale?.alert?.logout?.description,
      [
        {
          text: 'No',
          onPress: () => {},
        },
        {
          text: 'Yes',
          onPress: async () => {
            await logoutUser();
            navigation.navigate('Auth');
          },
        },
      ],
      {cancelable: true},
    );
  };
  const shareLink =
    'https://play.google.com/apps/internaltest/4701588407774598849';
  const shareMessage =
    "Hey there! 👶📱 Discover the perfect name for your baby with this app. It's a fun and easy way to explore a wide range of baby names. Get it now on the Play Store:" +
    shareLink +
    'and start your exciting naming journey!';
  const shareOptions = {
    title: 'Share via',
    message: shareMessage,
    // url: shareLink,
    // imageUrl: 'https://your-image-url-goes-here.com/image.png',
  };

  const handleSpreadTheWordShare = async platform => {
    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error(error);
    }
  };
  // const [likeCount, setLikeCount] = useState(0);
  // const [disLikeCount, setDisLikeCount] = useState(0);
  useEffect(() => {
    if (!userId) {
      return undefined;
    }
    fetchLikeDislikeCount();
    // Live Firestore listeners — counts update dynamically
    const unsubLikes = likedNamesCollection(String(userId)).onSnapshot(
      snap => setLikeCount(snap.size),
      err => console.log('likes listener', err?.message || err),
    );
    const unsubDislikes = dislikedNamesCollection(String(userId)).onSnapshot(
      snap => setDislikeCount(snap.size),
      err => console.log('dislikes listener', err?.message || err),
    );
    return () => {
      unsubLikes();
      unsubDislikes();
    };
  }, [userId]);

  const fetchLikeDislikeCount = useCallback(async () => {
    try {
      const response = await getLikeDislikeCount(userId);
      setLikeCount(response?.likes ?? 0);
      setDislikeCount(response?.disLikes ?? 0);
    } catch (error) {
      console.error(error);
    }
  }, [userId]);

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left']}
      style={{flex: 1, backgroundColor: Colors.primary}}>
      <View style={styles.drawerHeader}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '90%',
            paddingLeft: 10,
          }}>
          {!isPrime ? (
            <TouchableOpacity
              style={styles.drawerTopUnlockFeatureBtn}
              onPress={() => {
                setSelectedItem('InAppPurchase');
                navigation.navigate('Home', {screen: 'InAppPurchase'});
                navigation.closeDrawer?.();
              }}>
              <Icon name="lock" size={15} color={Colors.WHITE} />
              <Text style={{color: Colors.WHITE, marginLeft: 5, fontSize: 12}}>
                Unlock features
              </Text>
            </TouchableOpacity>
          ) : (
            <View></View>
          )}
          <TouchableOpacity
            onPress={() => {
              setIsUndoEnabled(false);
              console.log('seachfilterData.search========', seachfilterData);
              if (!seachfilterData.search) {
                setSeachfilterData({
                  firstLetter: '',
                  lastLetter: '',
                  gender: 'all',
                  contains: '',
                  compoundLetter: false,
                });
              }
              navigation.navigate('Home', {screen: 'MainSearchScreen'});
              navigation.closeDrawer?.();
            }}
            style={styles.drawerTopIcons}>
            <Icon name="search" size={30} color={Colors.WHITE} />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.drawerTopIcons}>
            <Icon name="settings" size={30} color={Colors.WHITE} />
          </TouchableOpacity> */}
        </View>
      </View>
      <CustomPopup
        isVisible={isPopupVisible}
        onClose={closePopup}
        message={locale.notloginedMessage}
        title={locale.notLoginedTitle}
        onCancel={handleCancelPress} // Optional cancel button action
        cancelText="Cancel" // Optional cancel button text
        style={{width: '80%'}}
      />
      <View style={styles.container}>
        {/* Custom Drawer Header */}
        <View style={styles.header}>
          <View>
            {!isUserLoggedin ? (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  borderRadius: 3,
                  height: 35,
                  width: 90,
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  backgroundColor: Colors.OrangeTint,
                }}
                onPress={() => navigation.navigate('Auth')}>
                <Ionicons
                  name="person-circle-outline"
                  size={30}
                  color={Colors.WHITE}
                />
                <Text style={{color: Colors.WHITE, fontSize: 12}}>LOGIN</Text>
              </TouchableOpacity>
            ) : null}

            {isUserLoggedin ? (
              <View style={{alignItems: 'center', marginTop: -5}}>
                <Ionicons
                  name="person-circle-outline"
                  size={50}
                  color={Colors.WHITE}
                  style={{marginBottom: 5}}
                />
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    borderRadius: 3,
                    height: 20,
                    width: 70,
                    justifyContent: 'center',
                    paddingBottom: 4,
                    alignItems: 'center',
                    backgroundColor: Colors.OrangeTint,
                    marginBottom: 0,
                  }}
                  onPress={() => showLogoutPrompt()}>
                  <Text style={{color: Colors.WHITE, fontSize: 12}}>
                    LOG OUT
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          <View style={styles.likeDislikeButtons}>
            {/* Add like and dislike buttons here */}
            <TouchableOpacity
              style={styles.dislikeButton}
              onPress={() => {
                navigation.navigate('Home', {screen: 'DisLikeList'});
                navigation.closeDrawer?.();
              }}>
              <AntDesign name="dislike2" size={20} color={Colors.WHITE} />
              <Text style={styles.LikeDisLikecount}>{dislikeCount ?? 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => {
                navigation.navigate('Home', {screen: 'LikeList'});
                navigation.closeDrawer?.();
              }}>
              <AntDesign name="like2" size={20} color={Colors.WHITE} />

              <Text style={styles.LikeDisLikecount}>{likeCount ?? 0}</Text>
            </TouchableOpacity>
          </View>
          <Svg
            xmlns="http://www.w3.org/2000/svg"
            style={{position: 'absolute', bottom: -10}}
            viewBox="0 0 100 20"
            height={50}
            width={'60%'}>
            <Path
              fill={Colors.WHITE}
              d="M0 20c10-5 30-10 50-10s40 5 50 10v10H0z"
            />
          </Svg>
        </View>

        {/* Custom Drawer Items */}
        <View style={styles.drawerItems}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => {
              setSeachfilterData({
                firstLetter: '',
                lastLetter: '',
                gender: 'all',
                contains: '',
                compoundLetter: false,
              });
              handleDrawerItemPress('BabyNames');
            }}>
            <Icon name="home" size={25} color={Colors.primary} />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'BabyNames'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              Name List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            // onPress={() => handleDrawerItemPress('AiAssistant')
            // }
            onPress={async () => {
              console.log('is------->', isPrime);
              const storedIsPrime = await Storage.getIsPrime();
              console.log('isstoredIsPrime------->', storedIsPrime);

              storedIsPrime
                ? handleDrawerItemPress('AiAssistant')
                : handleDrawerItemPress('InAppPurchase');
            }}>
            <Icon name="headset-mic" size={25} color={Colors.primary} />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'AiAssistant' ||
                selectedItem === 'InAppPurchase'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              AI Assistant
            </Text>
            <View
              style={{
                padding: 3,
                backgroundColor: Colors.statusGreenLight,
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginLeft: 60,
                borderRadius: 11,
                width: 35,
              }}>
              <Text style={{color: Colors.statusGreenDarker}}>Pro</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => handleDrawerItemPress('Settings')}>
            <Icon name="settings" size={25} color={Colors.primary} />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'Settings'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => handleSpreadTheWordShare()}>
            <Icon name="favorite" size={23} color={Colors.primary} />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'SpreadTheWord'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              Spread the word
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={async () => handleDrawerItemPress('PrivacyPolicy')}>
            <Icon name="lock-outline" size={25} color={Colors.primary} />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'PrivacyPolicy'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => handleDrawerItemPress('TheWholeLIst')}>
            <Icon
              name="format-list-bulleted"
              size={25}
              color={Colors.primary}
            />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'TheWholeLIst'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              The whole list
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => handleDrawerItemPress('TermsOfService')}>
            <Icon
              name="admin-panel-settings"
              size={25}
              color={Colors.primary}
            />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'TermsOfService'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              Terms of Service
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => handleDrawerItemPress('InAppPurchase')}>
            <Icon name="star" size={25} color={Colors.primary} />
            <Text
              style={[
                styles.drawerItemText,
                selectedItem === 'PrivacyPolicy'
                  ? {color: Colors.primary}
                  : {color: Colors.drawerTextGray},
              ]}>
              In App feature
            </Text>
          </TouchableOpacity> */}
        </View>

        {/* Bottom Image */}
        <View style={{backgroundColor: Colors.primary}}>
          <Image
            source={require('../../assects/Splash.png')}
            style={styles.bottomImage}
          />
          <Text
            style={{textAlign: 'center', color: 'white', paddingBottom: 20}}>
            V {DeviceInfo.getVersion()}
          </Text>
        </View>

        {/* <ImageBackground
          source={require('../../assects/Splash.png')}
          style={styles.bottomImage}> */}
        {/* Social Media Icons and Links */}
        {/* <View style={styles.followContainer}>
            <Text
              style={{color: Colors.WHITE, fontSize: 20, fontWeight: 'bold'}}>
              Follow us
            </Text>
          </View>
          <View style={styles.socialMedia}>
            <TouchableOpacity style={styles.socialMediaIcon}>
              <Icon name="facebook" size={30} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaIcon}>
              <AntDesign name="instagram" size={30} color={Colors.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialMediaIcon}>
              <Ionicons name="logo-twitter" size={30} color={Colors.WHITE} />
            </TouchableOpacity>
          </View> */}
        {/* </ImageBackground> */}
      </View>
    </SafeAreaView>
  );
};

const createStyles = insets =>
  StyleSheet.create({
  container: {
    flexGrow: 1, // Allow the content to expand to fill available space
    backgroundColor: Colors.WHITE,
  },
  drawerHeader: {
    padding: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  drawerTopUnlockFeatureBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 5,
    backgroundColor: Colors.unlockGreen,
    borderRadius: 16,
    marginLeft: -20,
  },
  LikeDisLikecount: {
    color: Colors.WHITE,
  },
  header: {
    padding: 16,
    height: 150,
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: Colors.primary,
  },
  profileBackground: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    color: Colors.WHITE,
    marginTop: 8,
  },
  babyNamesBackground: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeDislikeButtons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 16,
    marginBottom: 5,
  },
  likeButton: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    zIndex: 5,
    borderColor: Colors.WHITE,
    borderRadius: 30,
    width: 90,
  },
  dislikeButton: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.WHITE,
    padding: 4,
    zIndex: 5,
    width: 90,
    borderRadius: 30,
  },
  drawerItems: {
    marginTop: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 25,
    color: Colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 80 + insets.bottom,
    left: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    marginLeft: 16,
    color: Colors.primary,
  },
  bottomImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
  },
  socialMedia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10 + insets.bottom,
  },
  followContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: 10,
  },
  socialMediaIcon: {
    marginHorizontal: 8,
  },
});

export default CustomDrawerContent;
