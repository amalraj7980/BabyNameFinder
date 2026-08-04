import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
// import * as RNIap from 'react-native-iap';
import {
  initConnection,
  getProducts,
  getSubscriptions,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
  endConnection,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
} from 'react-native-iap';

import {Colors} from '../../styles';
import Feather from 'react-native-vector-icons/Feather';
import {AppContext} from '../../context/AppContext';
import {Storage} from '../../util';
import {styles} from './inAppPurchaseStyles';


const InAppPurchase = ({navigation}) => {
  const subscriptionIds = ['monthly_premium_ios4'];
  const lifetimeIds = ['lifetime_iap_ios4'];
  const [lifeTimeProductPrice, setLifeTimeProductPrice] = useState('');
  const [subscriptionProductPrice, setSubscriptionProductPrice] = useState('');
  const {isPrime, setIsPrime} = useContext(AppContext);

  useEffect(() => {
    const initIAP = async () => {
      try {
        console.log('Initializing IAP');
        await initConnection();
        console.log('IAP Initialized');

        // console.log('subscriptionIds========>', typeof subscriptionIds);
        // console.log('lifetimeIds========>', lifetimeIds);

        // Fetch subscription products
        if (subscriptionIds.length) {
          const subscriptions = await getSubscriptions({skus: subscriptionIds});
          console.log('Available subscriptions:', subscriptions);
          setSubscriptionProductPrice(
            subscriptions[0].subscriptionOfferDetails[0].pricingPhases
              .pricingPhaseList[0].formattedPrice ?? '500',
          );
        } else {
          console.warn('"subscriptionIds" is empty or not initialized.');
        }

        // Fetch one-time purchase products
        if (lifetimeIds.length) {
          const products = await getProducts({skus: lifetimeIds});
          console.log('Available one-time purchase products:', products);
          setLifeTimeProductPrice(products[0].price ?? '₹2000');
        } else {
          console.warn('"lifetimeIds" is empty or not initialized.');
        }
      } catch (err) {
        console.warn('IAP initialization error:--->', err);
      }
    };

    const purchaseErrorSubscription = purchaseErrorListener(error => {
      console.warn('Purchase error:', error);
    });

    initIAP();

    return () => {
      // purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
      endConnection();
    };
  }, []);

  const purchaseUpdateSubscription = purchaseUpdatedListener(purchase => {
    console.log('New purchase:', purchase);
  });

  // const handleSubscription = async sku => {
  //   try {
  //     if (typeof sku === 'string') {
  //       const subscriptions = await getSubscriptions({skus: [sku]});

  //       if (subscriptions && subscriptions.length > 0) {
  //         const subscription = subscriptions[0];

  //         if (
  //           subscription.subscriptionOfferDetails &&
  //           subscription.subscriptionOfferDetails.length > 0
  //         ) {
  //           const offerDetails = subscription.subscriptionOfferDetails[0];

  //           await requestSubscription({
  //             sku, // the product id
  //             ...(offerDetails.offerToken && {
  //               subscriptionOffers: [
  //                 {sku: sku, offerToken: offerDetails.offerToken},
  //               ],
  //             }),
  //           });
  //           // Acknowledge the purchase
  //           const purchase = await finishTransaction(purchase.transactionId);
  //           console.log('Subscription purchase acknowledged:', purchase);
  //           setIsPremium(true);
  //           Storage.setIsPrime(true);
  //         } else {
  //           console.warn('No subscription offers found for the provided SKU.');
  //         }
  //       } else {
  //         console.warn('Subscription details not found for the provided SKU.');
  //       }
  //     }
  //   } catch (err) {
  //     console.warn('Subscription request error:', err);
  //   }
  // };

  const handleSubscription = async sku => {
    try {
      if (typeof sku === 'string') {
        const subscriptions = await getSubscriptions({skus: [sku]});

        if (subscriptions && subscriptions.length > 0) {
          const subscription = subscriptions[0];

          if (
            subscription.subscriptionOfferDetails &&
            subscription.subscriptionOfferDetails.length > 0
          ) {
            const offerDetails = subscription.subscriptionOfferDetails[0];

            // Request the subscription
            await requestSubscription({
              sku, // the product id
              ...(offerDetails.offerToken && {
                subscriptionOffers: [
                  {sku: sku, offerToken: offerDetails.offerToken},
                ],
              }),
            });

            // navigation.navigate('AiAssistant');
            // Save the current time to the local storage.
            // const currentTime = new Date().getTime();
            // Storage.setPurchaseTime(currentTime);
            const availablePurchases = await getAvailablePurchases();

            if (availablePurchases.isAcknowledgedAndroid === false) {
              // Acknowledge purchase
              const ackResult = await finishTransaction(availablePurchases);
              console.log('ackResult---------------->', ackResult);
              console.log('ackResult---------------->dddddd');
            }
            setIsPrime(true);
            Storage.setIsPrime(true);
            await handleRestorePurchases();

            // // Acknowledge the purchase
            // const purchase = await finishTransaction(purchase.transactionId);
            // console.log('Subscription purchase acknowledged:', purchase);

            // // Check if the subscription is active
            // handleRestorePurchases();
            // const activeSubscriptions = availablePurchases.filter(
            //   purchase =>
            //     purchase.productId === sku && purchase.transactionReceipt,
            // );

            // if (activeSubscriptions.length > 0) {
            //   // Subscription is active
            //   setIsPrime(true);
            //   Storage.setIsPrime(true);
            //   // Navigate to the AI Assistant screen here
            //   navigation.navigate('AiAssistant');
            // } else {
            //   console.warn('Subscription not active.');
            // }
          } else {
            console.warn('No subscription offers found for the provided SKU.');
          }
        } else {
          console.warn('Subscription details not found for the provided SKU.');
        }
      }
    } catch (err) {
      console.warn('Subscription request error:', err);
    }
  };

  // const handleLifetimePurchase = async sku => {
  //   console.log('lifetime------>', {skus: [sku]});

  //   // try {
  //   //   await RNIap.requestPurchase(sku);
  //   // } catch (err) {
  //   //   console.warn('Lifetime purchase request error:', err);
  //   // }
  //   try {
  //     if (typeof sku === 'string') {
  //       console.log('haii da');
  //       // await RNIap.requestPurchase({skus: [sku]}); // Wrap SKU in an object with a "skus" property
  //       await requestPurchase({skus: [sku]}); // Pass the SKU as an array
  //       // Acknowledge the purchase
  //       const purchase = await finishTransaction(purchase.transactionId);
  //       console.log('Lifetime purchase acknowledged:', purchase);
  //       setIsPrime(true);
  //       Storage.setIsPrime(true);
  //     }
  //   } catch (err) {
  //     console.warn('lifetime request error:', err.code, err.message);
  //   }
  // };

  // const handleLifetimePurchase = async sku => {
  //   console.log(sku, '----------');

  //   try {
  //     if (typeof sku === 'string') {
  //       // Request the purchase
  //       await requestPurchase({skus: [sku]}); // Request the purchase of the lifetime product

  //       // Acknowledge the purchase
  //       const purchase = await finishTransaction(purchase.transactionId);
  //       console.log('Lifetime purchase acknowledged:', purchase);

  //       // Check if the purchase is active
  //       const availablePurchases = await getAvailablePurchases();
  //       handleRestorePurchases();
  //       const lifetimePurchases = availablePurchases.filter(
  //         purchase => purchase.productId === sku && purchase.transactionReceipt,
  //       );

  //       if (lifetimePurchases.length > 0) {
  //         // Lifetime purchase is active
  //         setIsPrime(true);
  //         Storage.setIsPrime(true);
  //         // Navigate to the AI Assistant screen here
  //         navigation.navigate('AiAssistant');
  //       } else {
  //         console.warn('Lifetime purchase not active.');
  //       }
  //     }
  //   } catch (err) {
  //     console.warn('Lifetime purchase request error:', err);
  //   }
  // };
  const handleLifetimePurchase = async sku => {
    console.log(sku, '----------');

    try {
      if (typeof sku === 'string') {
        // Request the purchase
        const purchase = await requestPurchase({skus: [sku]}); // Make sure you store the result here
        //console.log('WWWWWWWW------', purchase.transactionId);
        // setIsPrime(true);
        // Storage.setIsPrime(true);
        // navigation.navigate('AiAssistant');
        // handleRestorePurchases();
        const availablePurchases = await getAvailablePurchases();

        if (availablePurchases.isAcknowledgedAndroid === false) {
          // Acknowledge purchase
          const ackResult = await finishTransaction(availablePurchases);
          console.log('ackResult---------------->', ackResult);
          console.log('ackResult---------------->dddddd');
        }
        setIsPrime(true);
        Storage.setIsPrime(true);
        await handleRestorePurchases();

        // // Check if the purchase object and its transactionId exists
        // if (!purchase || !purchase.transactionId) {
        //   console.warn('Purchase or transactionId is missing.');
        //   return;
        // }

        // // Acknowledge the purchase
        // const acknowledgedPurchase = await finishTransaction(
        //   purchase.transactionId,
        // );
        // console.log('Lifetime purchase acknowledged:', acknowledgedPurchase);

        // // Check if the purchase is active
        // //const availablePurchases = await getAvailablePurchases();
        // const lifetimePurchases = availablePurchases.filter(
        //   p => p.productId === sku && p.transactionReceipt,
        // );

        // if (lifetimePurchases.length > 0) {
        //   // Lifetime purchase is active
        //   setIsPrime(true);
        //   Storage.setIsPrime(true);
        //   // Navigate to the AI Assistant screen here
        // } else {
        //   console.warn('Lifetime purchase not active.');
        // }
      }
    } catch (err) {
      console.warn('Lifetime purchase request error:', err);
    }
  };

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
      }
    } catch (err) {
      console.log('restorePurchases Error', err);
    }
  };

  const itemList = [
    {
      id: '1',
      title: 'Chat with your Personal Assistant',
      description:
        'Thanks to artificial intelligence, get help and accurate answers to find a unique name.',
      image: require('../../assects/robot-assistant.png'),
    },
    // {
    //   id: '2',
    //   title: 'See over 15700 names added by other parents',
    //   description:
    //     'Discover new names added by the community using this application!',
    //   image: require('../../assects/diamond.png'),
    // },
    // {
    //   id: '3',
    //   title: 'Extract your list',
    //   description: 'Send your favorite names to your email address',
    //   image: 'send',
    // },
  ];

  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={itemList}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.itemContent}>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              {item.image == 'send' ? (
                <Feather name="send" size={30} color={Colors.primary} />
              ) : (
                <Image source={item.image} style={styles.itemImage} />
              )}
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: 'lightgray',
                marginVertical: 10,
              }}
            />
          )}
        />
      </View>
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.lifetimeaccess}
          onPress={() => handleLifetimePurchase(lifetimeIds[0])}>
          <Image
            source={require('../../assects/star.png')}
            style={{height: 25, width: 25}}
          />
          <Text style={[styles.buttonText, {paddingLeft: 15}]}>
            Lifetime access{' '}
            <Text
              style={[styles.buttonText, {fontWeight: 'bold', paddingLeft: 5}]}>
              {lifeTimeProductPrice}
            </Text>
          </Text>
          <Text></Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.monthlyaccess}
          onPress={() => handleSubscription(subscriptionIds[0])}>
          <Image
            source={require('../../assects/trophy.png')}
            style={{height: 25, width: 25}}
          />
          {/* <Text style={styles.buttonText}>Monthly access</Text> */}
          <Text style={[styles.buttonText]}>
            3 days free trial then{' '}
            <Text style={[styles.buttonText, {fontWeight: 'bold'}]}>
              {subscriptionProductPrice}
            </Text>
          </Text>
          <Text></Text>
        </TouchableOpacity>
      </View>
    </>
  );
};


export default InAppPurchase;
