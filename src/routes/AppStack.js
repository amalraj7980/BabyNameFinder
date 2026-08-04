import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, Fonts} from '../styles';
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
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import {Storage} from '../util';
import {getTotalNamesCount, ensureSeedData} from '../api';

// import {
//   requestPurchase,
//   initConnection,
//   finishTransaction,
//   getAvailablePurchases,
// } from 'react-native-iap';
import {
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  getAvailablePurchases,
  endConnection,
} from 'react-native-iap';

import {AppContext} from '../context/AppContext';

const Stack = createStackNavigator();

const AppStack = ({navigation}) => {
  const [filteredData, setFilteredData] = useState([]);
  const [nameCount, setNamecount] = useState(0);
  const {
    locale: {locale},
    isPrime,
    setIsPrime,
    setIsUndoEnabled,
    setSeachfilterData,
    seachfilterData,
    babyNamesCount,
    isUndoEnabled,
  } = useContext(AppContext);
  const subscriptionIds = ['monthly_premium_ios4'];
  const lifetimeIds = ['lifetime_iap_ios4'];
  useEffect(
    () => console.log('Data was changed', filteredData),

    [filteredData],
  );

  useEffect(() => {
    featchNamesCount();
  }, []);

  const featchNamesCount = async () => {
    try {
      await ensureSeedData();
      const ResData = await getTotalNamesCount();
      console.log('name res---ResData---->', ResData.namesCount);
      setNamecount(ResData.namesCount ?? 0);
    } catch (error) {
      // Flash.showError(error);
    }
  };

  const handleFilterApplied = data => {
    setFilteredData(data);
  };

  useEffect(() => {
    initConnection().catch(err => {
      console.warn('initConnection', err.message);
    });

    const purchaseUpdateSubscription = purchaseUpdatedListener(purchase => {
      console.log('purchaseUpdatedListener', purchase);
      // Handle the logic of a new purchase here.
      // Unlock premium features or whatever you're offering.
    });

    const purchaseErrorSubscription = purchaseErrorListener(error => {
      console.log('purchaseErrorListener', error);
    });

    return () => {
      // purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
      endConnection();
    };
  }, []);
  const handleRestorePurchases = async () => {
    try {
      const restoredPurchases = await getAvailablePurchases();
      console.log('Restored Purchases', restoredPurchases);
      console.log(
        'Restored Purchases',
        JSON.stringify(restoredPurchases, null, 2),
      );

      if (restoredPurchases.length > 0) {
        for (const purchase of restoredPurchases) {
          if (
            subscriptionIds.includes(purchase.productId) ||
            lifetimeIds.includes(purchase.productId)
          ) {
            // Handle the logic here to mark the user as 'premium' or 'lifetime premium'
            // Update your UI accordingly
            setIsPrime(true);
            Storage.setIsPrime(true);
            console.log('User has a valid subscription or lifetime purchase');
            console.log('Product ID:', purchase.productId);
            console.log('Transaction ID:', purchase.transactionId);
            console.log('Transaction Date:', purchase.transactionDate);
            navigation.navigate('AiAssistant');
            break;
          }
        }
      } else {
        console.log('No purchases to restore');
        Alert.alert(
          '',
          'No Subscription to Restore. Please subscribe to access premium features!',
          [{text: 'OK'}], // Button to dismiss the alert
        );
      }
    } catch (err) {
      console.log('restorePurchases Error', err);
    }
  };
  // const handleRestorePurchases = async () => {
  //   try {
  //     // Request the restoration of purchases
  //     const restoredPurchases = await getAvailablePurchases();

  //     console.log('restoredPurchases------------>', restoredPurchases);

  //     // Iterate through the restored purchases
  //     for (const purchase of restoredPurchases) {
  //       // Process each purchase (e.g., acknowledge it if necessary)
  //       await finishTransaction(purchase.transactionId);

  //       // Handle the restored purchase (e.g., unlock content)
  //       handleRestoredPurchase(purchase);
  //     }
  //     setIsPrime(true);
  //     Storage.setIsPrime(true);
  //     // Inform the user that purchases have been restored successfully
  //     Alert.alert(
  //       'Purchases Restored',
  //       'Your purchases have been restored successfully.',
  //     );

  //     // Navigate to the AI Assistant screen
  //     // navigation.navigate('AiAssistant'); // Replace 'AiAssistant' with the actual name of your AI Assistant screen.
  //   } catch (error) {
  //     console.warn('Error restoring purchases:', error);
  //     // Handle the error (e.g., show an error message to the user)
  //     Alert.alert('Error', 'There was an error restoring your purchases.');
  //     setIsPrime(false);
  //     Storage.setIsPrime(false);
  //   }
  // };

  // const handleRestoredPurchase = purchase => {
  //   // Handle the restored purchase here
  //   // For example, you can unlock premium content or update your app's UI
  //   console.log('purchase------------>', purchase);
  // };

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

  const renderMenuIcon = () => {
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.openDrawer();
        }}
        style={{marginLeft: 10}}>
        <Icon name="menu" size={25} color={Colors.WHITE} />
      </TouchableOpacity>
    );
  };

  const ListNamesRightIcons = () => {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {/* <TouchableOpacity
          onPress={async () => {
            console.log('is------->', isPrime);
            const storedIsPrime = await Storage.getIsPrime();
            console.log('isstoredIsPrime------->', storedIsPrime);

            storedIsPrime
              ? navigation.navigate('AiAssistant')
              : navigation.navigate('InAppPurchase');
          }}
          style={{marginLeft: 20}}>
          <Image
            source={require('../assects/Ai.png')}
            style={{height: 40, width: 40, marginRight: 20}}
          />
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={() => {
            setIsUndoEnabled(false);
            // setSeachfilterData({
            //   firstLetter: '',
            //   lastLetter: '',
            //   gender: 'all',
            //   contains: '',
            //   compoundLetter: false,
            // });
            console.log('seachfilterData.search========', seachfilterData);
            if (seachfilterData.search) {
              setSeachfilterData({
                firstLetter: '',
                lastLetter: '',
                gender: 'all',
                contains: '',
                compoundLetter: false,
              });
            }
            navigation.navigate('NameFilterSearch', {
              onFilterApplied: handleFilterApplied,
            });
          }}
          style={{marginRight: 25}}>
          <Icon name="filter-alt" size={25} color={Colors.WHITE} />
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="more-vert" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
      </View>
    );
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary, // Add your desired background color
        },
        headerTintColor: Colors.WHITE, // Set the color for back button and title
        headerTitleStyle: {
          fontSize: 18,
        },
      }}>
      <Stack.Screen
        name="BabyNames"
        component={BabyNamesScreen}
        initialParams={{filteredData}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                List
              </Text>
              <TouchableOpacity
                style={{
                  height: 18,
                  width: 40,
                  backgroundColor: Colors.OrangeTint,
                  borderRadius: 10,
                  alignItems: 'center',
                }}>
                <Text style={{color: Colors.WHITE, fontSize: 11}}>
                  {/* {nameCount} */}
                  {babyNamesCount}
                </Text>
              </TouchableOpacity>
            </View>
          ),

          headerLeft: () => renderMenuIcon(),
          headerRight: () => <ListNamesRightIcons />,
        }}
      />
      <Stack.Screen
        name="TheWholeLIst"
        component={TheWholeLIst}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{
                  fontSize: 18,
                  marginRight: 10,
                  color: Colors.WHITE,
                  fontFamily: Fonts.semibold,
                }}>
                List
              </Text>
              <TouchableOpacity
                style={{
                  height: 18,
                  width: 40,
                  backgroundColor: Colors.OrangeTint,
                  borderRadius: 10,
                  alignItems: 'center',
                }}>
                <Text style={{color: Colors.WHITE, fontSize: 11}}>
                  {nameCount}
                </Text>
              </TouchableOpacity>
            </View>
          ),

          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="star-border" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('SearchScreen')}
                  style={{marginRight: 25}}>
                  <Icon name="search" size={25} color={Colors.WHITE} />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="more-vert" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
              </View>
            </>
          ),
        }}
      />
      <Stack.Screen
        name="AiAssistant"
        component={AiAssistant}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                Ai Assistant
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                Privacy Policy
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfService}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                Terms of service
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
        }}
      />
      <Stack.Screen
        name="InAppPurchase"
        component={InAppPurchase}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                PRO Version
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={handleRestorePurchases}
                style={{
                  marginRight: 15,
                  padding: 6,
                  borderRadius: 20,
                  borderColor: Colors.WHITE,
                  borderWidth: 1,
                }}>
                <Text style={{color: Colors.WHITE}}>RESTORE</Text>
              </TouchableOpacity>
            </>
          ),
        }}
      />
      <Stack.Screen
        name="SpreadTheWord"
        component={SpreadTheWord}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                Spread The Word
              </Text>
            </View>
          ),
        }}
      />

      <Stack.Screen
        name="LikeList"
        component={LikeListScreen}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                Favourites
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="star-border" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('LikeFilterScreen')}
                  style={{marginRight: 25}}>
                  <Icon name="search" size={25} color={Colors.WHITE} />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="more-vert" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
              </View>
            </>
          ),
        }}
      />
      <Stack.Screen
        name="DisLikeList"
        component={DislikeListScreen}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{fontSize: 18, marginRight: 10, color: Colors.WHITE}}>
                Disliked
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="star-border" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('DislikeFilterScreen')}
                  style={{marginRight: 25}}>
                  <Icon name="search" size={25} color={Colors.WHITE} />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() =>{}} style={{ marginLeft: 20 }}>
          <Icon name="more-vert" size={25} color={Colors.WHITE} />
        </TouchableOpacity> */}
              </View>
            </>
          ),
        }}
      />
      <Stack.Screen
        name="NameInformation"
        component={NameInformation}
        options={({route, navigation}) => ({
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={Colors.WHITE} />
              </TouchableOpacity>

              <Text style={{color: Colors.WHITE, fontSize: 18}}>
                Name {route.params.item?.name}
              </Text>
            </View>
          ),
          headerLeft: () => renderMenuIcon(),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={() => shareNameList(route.params.item?.name)}
                style={{marginRight: 20}}>
                <AntDesign name="sharealt" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
            </>
          ),
        })}
      />

      <Stack.Screen
        name="NameFilterSearch"
        component={NameFilterSearch}
        options={{
          headerTitle: () => <></>,
          headerLeft: () => (
            <View style={{marginLeft: 20}}>
              <Text style={{color: Colors.WHITE, fontSize: 18}}>Filter</Text>
            </View>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{marginRight: 20}}>
                <AntDesign name="close" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
            </>
          ),
        }}
        initialParams={{onFilterApplied: handleFilterApplied}}
      />
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{
          headerTitle: () => <></>,
          headerLeft: () => (
            <View style={{marginLeft: 20}}>
              <Text style={{color: Colors.WHITE, fontSize: 18}}>Search</Text>
            </View>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{marginRight: 20}}>
                <AntDesign name="close" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
            </>
          ),
        }}
        initialParams={{onFilterApplied: handleFilterApplied}}
      />
      <Stack.Screen
        name="MainSearchScreen"
        component={MainSearchScreen}
        options={{
          headerTitle: () => <></>,
          headerLeft: () => (
            <View style={{marginLeft: 20}}>
              <Text style={{color: Colors.WHITE, fontSize: 18}}>Search</Text>
            </View>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{marginRight: 20}}>
                <AntDesign name="close" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
            </>
          ),
        }}
        initialParams={{onFilterApplied: handleFilterApplied}}
      />

      <Stack.Screen
        name="LikeFilterScreen"
        component={LikeFilterScreen}
        options={{
          headerTitle: () => <></>,
          headerLeft: () => (
            <View style={{marginLeft: 20}}>
              <Text style={{color: Colors.WHITE, fontSize: 18}}>Search</Text>
            </View>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{marginRight: 20}}>
                <AntDesign name="close" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
            </>
          ),
        }}
        initialParams={{onFilterApplied: handleFilterApplied}}
      />
      <Stack.Screen
        name="DislikeFilterScreen"
        component={DislikeFilterScreen}
        options={{
          headerTitle: () => <></>,
          headerLeft: () => (
            <View style={{marginLeft: 20}}>
              <Text style={{color: Colors.WHITE, fontSize: 18}}>Search</Text>
            </View>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{marginRight: 20}}>
                <AntDesign name="close" size={20} color={Colors.WHITE} />
              </TouchableOpacity>
            </>
          ),
        }}
        initialParams={{onFilterApplied: handleFilterApplied}}
      />
      {/* Add more screens for the main app navigation */}
    </Stack.Navigator>
  );
};
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center', // Center horizontally
  },
  title: {
    color: Colors.primary,
  },
});

export default AppStack;
