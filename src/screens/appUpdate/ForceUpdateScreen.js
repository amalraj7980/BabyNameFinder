import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Animated,
  AppState,
  BackHandler,
  Easing,
  Image,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {Colors} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {
  openAppStoreListing,
  reapplyUpdateGateOnForeground,
  startAndroidFlexibleUpdate,
  useAppUpdateStore,
} from '../../services/appUpdate';
import {
  FORCE_UPDATE_ROCKET,
  APP_LOGO,
  forceUpdateScreenStyles as styles,
} from './forceUpdateScreenStyles';

/**
 * CareerMate-parity update gate UI —
 * force (blocking) + optional (Maybe later) + Android in-app flexible start.
 */
const ForceUpdateScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    locale: {locale},
  } = useContext(AppContext);
  const copy = locale?.appUpdate || {};
  const {decision, dismissOptionalIosUpdate} = useAppUpdateStore();
  const [openingStore, setOpeningStore] = useState(false);

  const isForce = decision?.severity === 'force';
  const titleLine1 = isForce
    ? copy.forceTitleLine1 || 'Update required for'
    : copy.optionalTitleLine1 || 'Update available for';
  const titleLine2 = isForce
    ? copy.forceTitleLine2 || 'Baby Names'
    : copy.optionalTitleLine2 || 'Baby Names';
  const message = isForce
    ? copy.forceMessage ||
      'The current version of this application is no longer supported. Please update to continue using Baby Names Together.'
    : copy.optionalMessage ||
      'A newer version of Baby Names Together is ready with improvements and fixes. You can update now, or continue and update later.';
  const secondaryLabel = isForce
    ? copy.closeApp || 'No, Thanks! Close the app'
    : copy.maybeLater || 'Maybe later';
  const updateNowLabel = copy.updateNow || 'Update now';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#EAF6FF');
    }
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(14);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (!isForce) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [isForce]);

  useEffect(() => {
    const onAppStateChange = next => {
      if (next !== 'active') {
        return;
      }
      void reapplyUpdateGateOnForeground();
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  const handleUpdate = async () => {
    if (openingStore) {
      return;
    }
    setOpeningStore(true);
    try {
      // Android flexible / optional → Play in-app download; iOS / force → store.
      if (
        Platform.OS === 'android' &&
        !__DEV__ &&
        decision?.severity === 'optional' &&
        decision?.androidUpdateType !== 'immediate'
      ) {
        try {
          await startAndroidFlexibleUpdate();
          dismissOptionalIosUpdate();
          return;
        } catch (e) {
          await openAppStoreListing();
          return;
        }
      }
      await openAppStoreListing();
    } finally {
      setOpeningStore(false);
    }
  };

  const handleSecondary = () => {
    if (isForce) {
      BackHandler.exitApp();
      return;
    }
    dismissOptionalIosUpdate();
  };

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.safe,
          {
            paddingBottom: Math.max(insets.bottom, 18),
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Image
              source={FORCE_UPDATE_ROCKET}
              style={styles.heroImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={styles.whiteSection}>
            <View style={styles.logoWrap}>
              <Image
                source={APP_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title} accessibilityRole="header">
              {titleLine1}
              {'\n'}
              {titleLine2}
            </Text>

            <Text style={styles.message}>{message}</Text>

            <View style={styles.spacer} />

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleUpdate}
                disabled={openingStore}
                style={[styles.primaryButton, openingStore && {opacity: 0.7}]}>
                <View
                  style={[
                    styles.primaryButtonInner,
                    {
                      backgroundColor: Colors.gradientBlue0 || Colors.primary,
                    },
                  ]}>
                  <Text style={styles.primaryButtonText}>{updateNowLabel}</Text>
                  <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <Pressable
                testID="force-update-secondary-button"
                accessibilityRole="button"
                accessibilityLabel={secondaryLabel}
                onPress={handleSecondary}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default ForceUpdateScreen;
