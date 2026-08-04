import React, {createContext, useEffect, useState, useRef} from 'react';
import {I18nManager, AppState} from 'react-native';
import RNRestart from 'react-native-restart';
import Storage from '../util/Storage'; // Use 'storage' instead of 'Storage'
import {
  initConnection,
  getProducts,
  getPurchaseHistory,
  getSubscriptions,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
  endConnection,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
} from 'react-native-iap';
import DeviceInfo from 'react-native-device-info';

import en from '../locale/en.json';
import ar from '../locale/ar.json';

import 'moment/locale/ar';
import 'moment/locale/en-in';

const subscriptionIds = ['monthly_premium_ios4'];
const lifetimeIds = ['lifetime_iap_ios4'];
export const AppContext = createContext();

const LOCALES = [
  {lan: 'English', locale: en, rtl: false, code: 'en'},
  {lan: 'عربى', locale: ar, rtl: true, code: 'ar'},
];

export const AppContextProvider = ({children}) => {
  const [languages, setLanguages] = useState();
  const [locale, setLocale] = useState(LOCALES[0]);
  const [countryCode] = useState('91');

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isUndoEnabled, setIsUndoEnabled] = useState(false);

  const [seachfilterDataWholeNames, setSeachfilterDataWholeNames] = useState({
    firstLetter: '',
    lastLetter: '',
    gender: 'all',
    contains: '',
    compoundLetter: false,
  });
  const [dislikeFilterScreen, setDislikeFilterScreen] = useState({
    firstLetter: '',
    lastLetter: '',
    gender: 'all',
    contains: '',
    compoundLetter: false,
  });
  const [likeFilterScreen, setLikeFilterScreen] = useState({
    firstLetter: '',
    lastLetter: '',
    gender: 'all',
    contains: '',
    compoundLetter: false,
  });
  const [mainSeachfilterData, setMainSeachfilterData] = useState({
    firstLetter: '',
    lastLetter: '',
    gender: 'all',
    contains: '',
    compoundLetter: false,
  });

  const [seachfilterData, setSeachfilterData] = useState({
    firstLetter: '',
    lastLetter: '',
    gender: 'all',
    contains: '',
    compoundLetter: false,
    search: false,
  });
  const [isPrime, setIsPrime] = useState(false); // Initialize to false
  const [swipeBlocked, setSwipeBlocked] = useState(false);
  const [deviceId, setDeviceId] = useState();
  const [babyNamesCount, setBabyNamesCount] = useState();

  const getDeviceId = async () => {
    const deviceId = await DeviceInfo.getUniqueId();
    setDeviceId(deviceId);
    if (deviceId) {
      let DeviceId = await Storage.setDeviceId(deviceId);
    }
  };

  // const getDeviceId = async () => {
  //   try {
  //     let deviceId = await Storage.getDeviceId(); // First try to get the deviceId from storage
  //     if (!deviceId) {
  //       // If not found in storage, get it from DeviceInfo and then store it
  //       deviceId = await DeviceInfo.getUniqueId();
  //       await Storage.setDeviceId(deviceId);
  //     }
  //     setDeviceId(deviceId);
  //   } catch (error) {
  //     console.log('Error in getting Device ID:', error);
  //   }
  // };
  useEffect(() => {
    getDeviceId();
    const loadIsPrimeFromStorage = async () => {
      try {
        const storedIsPrime = await Storage.getIsPrime();
        setIsPrime(storedIsPrime);
      } catch (error) {
        console.error('Error loading isPrime from storage:', error);
      }
    };

    loadIsPrimeFromStorage();
  }, []);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const initIAP = async () => {
      try {
        await initConnection();
        if (subscriptionIds.length) {
          const subscriptions = await getSubscriptions({skus: subscriptionIds});
          console.log(
            'Available subscriptions in context------>:',
            subscriptions,
          );
        } else {
          console.warn('"subscriptionIds" is empty or not initialized.');
        }
        // Fetch one-time purchase products
        if (lifetimeIds.length) {
          const products = await getProducts({skus: lifetimeIds});
          console.log(
            'Available one-time purchase products in context------>:',
            products,
          );
        } else {
          console.warn('"lifetimeIds" is empty or not initialized.');
        }
      } catch (err) {
        // console.warn('IAP initialization error:--->', err);
      }
    };

    const purchaseErrorSubscription = purchaseErrorListener(error => {
      console.warn('Purchase error:', error);
    });

    initIAP();

    return () => {
      purchaseErrorSubscription.remove();
      endConnection();
    };
  }, []);

  // const checkIAPSubscriptionValidity = async () => {
  //   try {
  //     const purchaseHistory = await getPurchaseHistory();
  //     const latestPurchase = purchaseHistory[1]; // Assuming sorted by date
  //     const isSubscriptionActive = subscriptionIds.includes(
  //       latestPurchase?.productId,
  //     );
  //     // ||
  //     // lifetimeIds.includes(latestPurchase?.productId);
  //     console.log(
  //       'my dep lifetime---->',
  //       lifetimeIds.includes(latestPurchase?.productId),
  //     );
  //     console.log(
  //       'my dep subscriptionIds---->',
  //       subscriptionIds.includes(latestPurchase?.productId),
  //     );

  //     console.log('purchaseHistory------->', purchaseHistory);
  //     console.log('isSubscriptionActive------->', isSubscriptionActive);

  //     if (isSubscriptionActive) {
  //       setIsPrime(true);
  //       await Storage.setIsPrime(true);
  //     } else {
  //       setIsPrime(false);
  //       await Storage.setIsPrime(false);
  //     }
  //   } catch (error) {
  //     console.error('Error checking IAP subscription:', error);
  //   }
  // };
  // const checkIAPSubscriptionValidity = async () => {
  //   try {
  //     // Gets the list of all purchased items that have not been consumed.
  //     const availablePurchases = await getAvailablePurchases();

  //     // Find if the user has any active subscriptions
  //     const activeSubscription = availablePurchases.find(purchase =>
  //       subscriptionIds.includes(purchase.productId),
  //     );

  //     // Find if the user has any lifetime purchases
  //     const lifetimePurchase = availablePurchases.find(purchase =>
  //       lifetimeIds.includes(purchase.productId),
  //     );
  //     console.log('availablePurchases---->@@@@@@@@@@@@', availablePurchases);

  //     console.log(
  //       'activeSubscription---->@@@@@@@',
  //       activeSubscription.autoRenewingAndroid,
  //     );
  //     console.log('lifetimePurchase---->@@@@@@@', lifetimePurchase);

  //     // If an active subscription or lifetime purchase is found, mark as Prime
  //     if (activeSubscription.autoRenewingAndroid || lifetimePurchase) {
  //       setIsPrime(true);
  //       await Storage.setIsPrime(true);
  //     } else {
  //       setIsPrime(false);
  //       await Storage.setIsPrime(false);
  //     }
  //   } catch (error) {
  //     console.error('Error checking IAP subscription:', error);
  //   }
  // };

  useEffect(() => {
    const subscriptionInterval = setInterval(() => {
      checkIAPSubscriptionValidity(); // Check IAP subscription as well
    }, 5000); // check every minute

    return () => {
      clearInterval(subscriptionInterval);
    };
  }, []);
  // // Set up a ref to keep track of the timer
  // const subscriptionCheckTimer = useRef(null);

  // // When component mounts and unmounts
  // useEffect(() => {
  //   // Start the periodic check when the component mounts
  //   subscriptionCheckTimer.current = setInterval(
  //     checkIAPSubscriptionValidity,
  //     1 * 60 * 1000,
  //   ); // every 5 minutes

  //   // Clear the timer when the component unmounts
  //   return () => {
  //     if (subscriptionCheckTimer.current) {
  //       clearInterval(subscriptionCheckTimer.current);
  //     }
  //   };
  // }, []);

  const checkIAPSubscriptionValidity = async () => {
    try {
      const availablePurchases = await getAvailablePurchases();
      const activeSubscription = availablePurchases.find(purchase =>
        subscriptionIds.includes(purchase.productId),
      );
      const lifetimePurchase = availablePurchases.find(purchase =>
        lifetimeIds.includes(purchase.productId),
      );
      //console.log('availablePurchases------->', availablePurchases);
      //console.log('lifetimePurchase------->', lifetimePurchase);

      // console.log('activeSubscription------->', activeSubscription);
      const isAutoRenewing = activeSubscription
        ? activeSubscription.autoRenewingAndroid
        : false;
      //console.log('isAutoRenewing----->', isAutoRenewing);
      if (isAutoRenewing || lifetimePurchase) {
        setIsPrime(true);
        await Storage.setIsPrime(true);
      } else {
        setIsPrime(false);
        await Storage.setIsPrime(false);
      }
    } catch (error) {
      console.error('Error checking IAP subscription:', error);
    }
  };

  /** This function is used to load owner languages */
  const loadLocale = async () => {
    try {
      let localeFromStorage = await Storage.getLocale();
      let _locale = LOCALES.find(item => item?.lan === localeFromStorage?.lan);
      setLocale(_locale ?? LOCALES[0]);
    } catch (e) {
      changeLocale(LOCALES[0]?.lan);
    }
  };

  /** This is used for app should be restart accordingly to change the language*/
  const languageRestart = async rtl => {
    if (rtl) {
      if (!I18nManager.isRTL) {
        I18nManager.forceRTL(true);
      }
    } else {
      if (I18nManager.isRTL) {
        I18nManager.forceRTL(false);
      }
    }
    RNRestart.Restart();
  };

  useEffect(() => {
    let _languages = LOCALES.map(item => {
      let {lan, rtl, code} = item;
      return {lan, rtl, code};
    });
    setLanguages(_languages);
    loadLocale();
  }, []);

  /*This function is used to change owner language*/
  const changeLocale = async lan => {
    let _locale = LOCALES.find(item => item?.lan === lan);
    await Storage.setLocale({
      lan: _locale?.lan,
      rtl: _locale?.rtl,
      code: _locale?.code,
    });
    setLocale(_locale);
    languageRestart(_locale?.rtl ?? LOCALES[0].rtl);
  };

  const value = {
    locale,
    languages,
    countryCode,
    changeLocale,
    seachfilterDataWholeNames, // Include filter data in the context(WholeName)
    setSeachfilterDataWholeNames, // Function to update filter data
    seachfilterData, //Home filter
    setSeachfilterData, ////Home filter
    mainSeachfilterData, //drawer search
    setMainSeachfilterData, //drawer search
    likeCount,
    dislikeCount,
    setLikeCount,
    setDislikeCount,
    isPrime,
    setIsPrime,
    setIsUndoEnabled,
    isUndoEnabled,
    dislikeFilterScreen,
    setDislikeFilterScreen,
    likeFilterScreen,
    setLikeFilterScreen,
    swipeBlocked,
    setSwipeBlocked,
    deviceId,
    setDeviceId,
    babyNamesCount,
    setBabyNamesCount,
    // ... other context values ...
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
