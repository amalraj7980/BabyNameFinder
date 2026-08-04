// Wrapper for AsyncStorage library

import AsyncStorage from '@react-native-async-storage/async-storage';

/*This function is used to set items in AsyncStorage*/
// const setItem = async (key, value) => {
//   try {
//     await AsyncStorage.setItem(key, value);
//     // console.log(`${key} & ${value} set successfully in localStorage`);
//   } catch (e) {
//     console.log(e);
//     throw e;
//   }
// };

const setItem = async (key, value) => {
  try {
    if (value !== null && value !== undefined) {
      await AsyncStorage.setItem(key, value);
      // console.log(`${key} & ${value} set successfully in localStorage`);
    } else {
      console.log(`Value is null or undefined, removing item "${key}"`);
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};

/*This function is used to get items in AsyncStorage*/
const getItem = async key => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      throw `No Value for "${key}" in Storage`;
    }
    return value;
  } catch (e) {
    //console.log(e);
    //  throw e;
    return null; // return null in case of an error
  }
};
/*This function is used to remove items in AsyncStorage*/
const removeItem = async key => {
  try {
    await AsyncStorage.removeItem(key);
    // console.log(`${key} removed  successfully from localStorage`);
  } catch (e) {
    console.log(e);
  }
};

// Non Util Functions
const getUserAccessToken = async () => await getItem('user_access_token');
const setUserAccessToken = async access_token =>
  await setItem('user_access_token', access_token);

const getAppSetUpComplete = async () => await getItem('app_setup_complete');

const setAppSetUpComplete = async app_setup =>
  await setItem('app_setup_complete', app_setup);

const setIsPrime = async isPrime => {
  try {
    const stringValue = isPrime.toString();
    await AsyncStorage.setItem('isPrime', stringValue);
  } catch (e) {
    console.log(e);
  }
};
const getIsPrime = async () => {
  try {
    const value = await AsyncStorage.getItem('isPrime');
    return value === 'true';
  } catch (e) {
    console.log(e);
    return false; // Return false in case of an error or if the value is not found
  }
};

// Add these to your STORAGE_KEY object to use as key for storage
const STORAGE_KEY = {
  PURCHASE_TIME: '@purchase_time',
};

const setPurchaseTime = async time => {
  try {
    // Convert time to string before saving
    await setItem(STORAGE_KEY.PURCHASE_TIME, time.toString());
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const getPurchaseTime = async () => {
  try {
    // Parse the string back to a number before returning
    const storedTime = await getItem(STORAGE_KEY.PURCHASE_TIME);
    return storedTime ? parseInt(storedTime, 10) : null;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
const removePurchaseTime = async () => {
  try {
    await removeItem(STORAGE_KEY.PURCHASE_TIME);
  } catch (e) {
    console.log(e);
    throw e;
  }
};
// Update setUserID function (supports Firebase string UIDs and legacy numeric IDs)
const setUserID = async user_id => {
  try {
    if (user_id === null || user_id === undefined) {
      await removeItem('user_id');
      return;
    }
    await setItem('user_id', String(user_id));
  } catch (e) {
    console.error('Error setting user ID:', e);
    throw e;
  }
};
const setDeviceId = async deviceId => {
  try {
    await setItem('device_id', deviceId);
  } catch (e) {
    console.log('Error setting Device ID:', e);
    throw e;
  }
};

const getDeviceId = async () => {
  try {
    const deviceId = await getItem('device_id');
    if (deviceId !== null) {
      return deviceId;
    } else {
      throw 'No device ID found in Storage';
    }
  } catch (e) {
    console.log('Error retrieving Device ID:', e);
    throw e;
  }
};

const setBabyNamesCount = async count => {
  try {
    await setItem(STORAGE_KEYS.BABY_NAMES_COUNT, count.toString());
  } catch (e) {
    console.log('Error setting Baby Names Count:', e);
    throw e;
  }
};
const getBabyNamesCount = async () => {
  try {
    const count = await getItem(STORAGE_KEYS.BABY_NAMES_COUNT);
    return count ? parseInt(count, 10) : null;
  } catch (e) {
    console.log('Error retrieving Baby Names Count:', e);
    throw e;
  }
};

// Update getUserID function (returns string UID for Firebase, or legacy numeric string)
const getUserID = async () => {
  try {
    const userId = await getItem('user_id');
    if (userId !== null && userId !== undefined && userId !== '') {
      return userId;
    }
    return null;
  } catch (e) {
    return null;
  }
};

const getLocale = async () => {
  let jsonValue = await getItem('locale');
  return jsonValue != null ? JSON.parse(jsonValue) : null;
};
const setLocale = async locale => {
  const jsonValue = JSON.stringify(locale);
  await setItem('locale', jsonValue);
};

const logOut = async () => {
  await removeItem('user_access_token');
  await removeItem('user_id');
  await removeItem('user_verified');
  // await removeItem('app_setup_complete');
};
const STORAGE_KEYS = {
  IS_FULL_APP_PURCHASED: '@is_full_app_purchased',
  BABY_NAMES_COUNT: '@baby_names_count',
};
const storeBooleanData = async (key, value) => {
  try {
    const stringValue = value.toString();
    await AsyncStorage.setItem(key, stringValue);
  } catch (e) {
    console.log(e);
  }
};
// getItem returns a promise that either resolves to stored value when data is found for given key, or returns null otherwise.
const getBooleanData = async key => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (e) {
    console.log(e);
  }
};
export default {
  getLocale,
  setLocale,
  logOut,
  getUserAccessToken,
  setUserAccessToken,
  getUserID,
  setUserID,
  getAppSetUpComplete,
  setAppSetUpComplete,
  STORAGE_KEYS,
  setPurchaseTime,
  getPurchaseTime,
  removePurchaseTime,
  storeBooleanData,
  getBooleanData,
  setIsPrime,
  getIsPrime,
  setDeviceId,
  getDeviceId,
  setBabyNamesCount,
  getBabyNamesCount,
};
