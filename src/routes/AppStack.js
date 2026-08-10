import React, {useEffect, useState, useContext, useCallback} from 'react';
import {View, Alert, Text, TouchableOpacity} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors} from '../styles';
import BabyNamesScreen from '../screens/home/BabyNamesScreen';
import NameInformation from '../screens/home/NameInformation';
import AiAssistant from '../screens/home/AiAssistant';
import TheWholeLIst from '../screens/home/TheWholeLIst';
import LikeListScreen from '../screens/likes/LikeListScreen';
import DislikeListScreen from '../screens/likes/DislikeListScreen';
import LikeFilterScreen from '../screens/likes/LikeFilterScreen';
import DislikeFilterScreen from '../screens/likes/DislikeFilterScreen';
import NameFilterSearch from '../screens/search/NameFilterSearch';
import SearchScreen from '../screens/search/SearchScreen';
import MainSearchScreen from '../screens/search/MainSearchScreen';
import PrivacyPolicy from '../screens/legal/PrivacyPolicy';
import TermsOfService from '../screens/legal/TermsOfService';
import SpreadTheWord from '../screens/share/SpreadTheWord';
import InAppPurchase from '../screens/premium/InAppPurchase';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import {Storage} from '../util';
import {getTotalNamesCount, ensureSeedData} from '../api';
import {
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  getAvailablePurchases,
  endConnection,
} from 'react-native-iap';

import {AppContext} from '../context/AppContext';
import {appStackStyles as styles} from './appStackStyles';

const Stack = createStackNavigator();
const SUBSCRIPTION_IDS = ['monthly_premium_ios4'];
const LIFETIME_IDS = ['lifetime_iap_ios4'];

const AppStack = ({navigation}) => {
  const [filteredData] = useState([]);
  const [nameCount, setNamecount] = useState(0);
  const {
    setIsPrime,
    setIsUndoEnabled,
    setSeachfilterData,
    seachfilterData,
    babyNamesCount,
  } = useContext(AppContext);

  useEffect(() => {
    const loadCount = async () => {
      try {
        await ensureSeedData();
        const ResData = await getTotalNamesCount();
        setNamecount(ResData.namesCount ?? 0);
      } catch (error) {
        // ignore seed/count errors on header
      }
    };
    loadCount();
  }, []);

  useEffect(() => {
    initConnection().catch(err => {
      console.warn('initConnection', err.message);
    });

    const purchaseUpdateSubscription = purchaseUpdatedListener(() => {});
    const purchaseErrorSubscription = purchaseErrorListener(error => {
      console.log('purchaseErrorListener', error);
    });

    return () => {
      purchaseUpdateSubscription?.remove?.();
      purchaseErrorSubscription.remove();
      endConnection();
    };
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    try {
      const restoredPurchases = await getAvailablePurchases();
      if (restoredPurchases.length > 0) {
        for (const purchase of restoredPurchases) {
          if (
            SUBSCRIPTION_IDS.includes(purchase.productId) ||
            LIFETIME_IDS.includes(purchase.productId)
          ) {
            setIsPrime(true);
            Storage.setIsPrime(true);
            navigation.navigate('AiAssistant');
            break;
          }
        }
      } else {
        Alert.alert(
          '',
          'No Subscription to Restore. Please subscribe to access premium features!',
          [{text: 'OK'}],
        );
      }
    } catch (err) {
      console.log('restorePurchases Error', err);
    }
  }, [navigation, setIsPrime]);

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
      // cancelled
    }
  }, []);

  const openDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const renderMenuIcon = useCallback(
    () => (
      <TouchableOpacity onPress={openDrawer} style={styles.headerIconBtn}>
        <Icon name="menu" size={25} color={Colors.WHITE} />
      </TouchableOpacity>
    ),
    [openDrawer],
  );

  const renderBackOrMenu = useCallback(
    stackNavigation => {
      const canGoBack = stackNavigation?.canGoBack?.() ?? false;
      return (
        <TouchableOpacity
          onPress={() => {
            if (canGoBack) {
              stackNavigation.goBack();
            } else {
              navigation.openDrawer();
            }
          }}
          style={styles.headerIconBtn}>
          <Icon
            name={canGoBack ? 'arrow-back' : 'menu'}
            size={25}
            color={Colors.WHITE}
          />
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  const openFilter = useCallback(
    stackNavigation => {
      setIsUndoEnabled(false);
      if (seachfilterData.search) {
        setSeachfilterData({
          firstLetter: '',
          lastLetter: '',
          gender: 'all',
          contains: '',
          compoundLetter: false,
          search: false,
        });
      }
      stackNavigation.navigate('NameFilterSearch');
    },
    [seachfilterData.search, setIsUndoEnabled, setSeachfilterData],
  );

  const ListNamesRightIcons = useCallback(
    ({stackNavigation}) => (
      <View style={styles.headerRightWrap}>
        <TouchableOpacity
          onPress={() => openFilter(stackNavigation)}
          style={styles.headerFilterBtn}>
          <Icon name="filter-alt" size={25} color={Colors.WHITE} />
        </TouchableOpacity>
      </View>
    ),
    [openFilter],
  );

  const filterScreenOptions = useCallback(
    title =>
      ({navigation: stackNavigation}) => ({
        headerTitle: () => null,
        headerLeft: () => (
          <View style={styles.filterTitleWrap}>
            <Text style={styles.filterTitle}>{title}</Text>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => stackNavigation.goBack()}
            style={styles.filterCloseBtn}>
            <AntDesign name="close" size={20} color={Colors.WHITE} />
          </TouchableOpacity>
        ),
      }),
    [],
  );

  const headerTitleWithCount = useCallback((label, count, semibold = false) => {
    return (
      <View style={styles.headerTitleRow}>
        <Text
          style={
            semibold ? styles.headerTitleTextSemibold : styles.headerTitleText
          }>
          {label}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </View>
    );
  }, []);

  const simpleHeaderTitle = useCallback(
    label => (
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitleText}>{label}</Text>
      </View>
    ),
    [],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.headerBg || Colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.WHITE,
        headerTitleStyle: {
          fontSize: 18,
        },
        headerTitleAlign: 'left',
        contentStyle: {
          backgroundColor: Colors.background || Colors.WHITE,
        },
      }}>
      <Stack.Screen
        name="BabyNames"
        component={BabyNamesScreen}
        initialParams={{filteredData}}
        options={({navigation: stackNavigation}) => ({
          headerTitle: () => headerTitleWithCount('List', babyNamesCount),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <ListNamesRightIcons stackNavigation={stackNavigation} />
          ),
        })}
      />
      <Stack.Screen
        name="TheWholeLIst"
        component={TheWholeLIst}
        options={({navigation: stackNavigation}) => ({
          headerTitle: () => headerTitleWithCount('List', nameCount, true),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <View style={styles.headerRightWrap}>
              <TouchableOpacity
                onPress={() => stackNavigation.navigate('SearchScreen')}
                style={styles.headerFilterBtn}>
                <Icon name="search" size={25} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="AiAssistant"
        component={AiAssistant}
        options={{
          headerTitle: () => simpleHeaderTitle('Ai Assistant'),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{
          headerTitle: () => simpleHeaderTitle('Privacy Policy'),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfService}
        options={{
          headerTitle: () => simpleHeaderTitle('Terms of service'),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="InAppPurchase"
        component={InAppPurchase}
        options={({navigation: stackNavigation}) => ({
          headerTitle: () => simpleHeaderTitle('PRO Version'),
          headerLeft: () => renderBackOrMenu(stackNavigation),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleRestorePurchases}
              style={styles.restoreBtn}>
              <Text style={styles.restoreText}>RESTORE</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({navigation: stackNavigation}) => ({
          headerTitle: () => simpleHeaderTitle('Settings'),
          headerLeft: () => renderBackOrMenu(stackNavigation),
        })}
      />
      <Stack.Screen
        name="SpreadTheWord"
        component={SpreadTheWord}
        options={{
          headerTitle: () => simpleHeaderTitle('Spread The Word'),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="LikeList"
        component={LikeListScreen}
        options={({navigation: stackNavigation}) => ({
          headerTitle: () => simpleHeaderTitle('Favourites'),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <View style={styles.headerRightWrap}>
              <TouchableOpacity
                onPress={() => stackNavigation.navigate('LikeFilterScreen')}
                style={styles.headerFilterBtn}>
                <Icon name="search" size={25} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="DisLikeList"
        component={DislikeListScreen}
        options={({navigation: stackNavigation}) => ({
          headerTitle: () => simpleHeaderTitle('Disliked'),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <View style={styles.headerRightWrap}>
              <TouchableOpacity
                onPress={() => stackNavigation.navigate('DislikeFilterScreen')}
                style={styles.headerFilterBtn}>
                <Icon name="search" size={25} color={Colors.WHITE} />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="NameInformation"
        component={NameInformation}
        options={({route: infoRoute, navigation: stackNavigation}) => ({
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => stackNavigation.goBack()}
                style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
              <Text style={styles.nameInfoTitle}>
                Name {infoRoute.params.item?.name}
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => shareNameList(infoRoute.params.item?.name)}
              style={styles.shareBtn}>
              <AntDesign name="sharealt" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="NameFilterSearch"
        component={NameFilterSearch}
        options={filterScreenOptions('Filter')}
      />
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={filterScreenOptions('Search')}
      />
      <Stack.Screen
        name="MainSearchScreen"
        component={MainSearchScreen}
        options={filterScreenOptions('Search')}
      />
      <Stack.Screen
        name="LikeFilterScreen"
        component={LikeFilterScreen}
        options={filterScreenOptions('Search')}
      />
      <Stack.Screen
        name="DislikeFilterScreen"
        component={DislikeFilterScreen}
        options={filterScreenOptions('Search')}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
