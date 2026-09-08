import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  initConnection,
  endConnection,
  getAvailablePurchases,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseErrorListener,
} from 'react-native-iap';

import {Fonts} from '../../styles';
import {DesignTokens as T} from '../../theme/designTokens';
import {AppContext} from '../../context/AppContext';
import {Storage} from '../../util';
import {getTabBarStyle} from '../../routes/tabBarStyles';
import {PRIVACY_POLICY_URL, TERMS_OF_USE_URL} from '../../constants/appInfo';

const LIFETIME_IDS = ['lifetime_iap_ios4'];

const HERITAGE_ITEMS = [
  {id: 'heritage_indian', title: 'Indian', price: '₹ 399'},
  {id: 'heritage_arabic', title: 'Arabic', price: '₹ 399'},
  {id: 'heritage_african', title: 'African', price: '₹ 399'},
  {id: 'heritage_celtic', title: 'Celtic', price: '₹ 399'},
  {id: 'heritage_scandi', title: 'Scandinavian', price: '₹ 399'},
  {id: 'heritage_hispanic', title: 'Hispanic', price: '₹ 399'},
  {id: 'heritage_asian', title: 'Asian', price: '₹ 399'},
  {id: 'heritage_hebrew', title: 'Hebrew', price: '₹ 399'},
];

const VIBE_ITEMS = [
  {id: 'vibe_soft', title: 'Soft & Sweet', price: '₹ 399'},
  {id: 'vibe_bold', title: 'Bold & Strong', price: '₹ 399'},
  {id: 'vibe_nature', title: 'Nature Inspired', price: '₹ 399'},
  {id: 'vibe_unique', title: 'Unique & Rare', price: '₹ 399'},
  {id: 'vibe_modern', title: 'Modern Edge', price: '₹ 399'},
];

const PREMIUM_ITEMS = [
  {id: 'premium_timeless', title: 'Timeless', price: '₹ 399'},
  {id: 'premium_rising', title: 'Rising Stars', price: '₹ 399'},
  {id: 'premium_rare', title: 'Rare Gems', price: '₹ 399'},
  {id: 'premium_exotic', title: 'Exotic & Beautiful', price: '₹ 399'},
  {id: 'premium_world', title: 'World Explorer', price: '₹ 399'},
];

const FEATURE_ITEMS = [
  {
    id: 'unlimited_suggestions',
    title: 'Unlimited Suggestions',
    subtitle: 'Explore unlimited name suggestions',
    icon: 'sparkles',
    price: '₹ 499',
  },
  {
    id: 'unlimited_undos',
    title: 'Unlimited Undos',
    subtitle: 'No limit to undo swipes',
    icon: 'arrow-undo',
    price: '₹ 299',
  },
  {
    id: 'popularity_charts',
    title: 'Popularity Charts',
    subtitle: 'Unlock additional country data on popularity charts',
    icon: 'bar-chart',
    price: '₹ 299',
  },
];

const PricePill = ({price, onPress, compact}) => (
  <TouchableOpacity
    style={[styles.pricePill, compact && styles.pricePillCompact]}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel={`Buy for ${price}`}>
    <Text style={[styles.priceText, compact && styles.priceTextCompact]}>
      {price}
    </Text>
  </TouchableOpacity>
);

const IconTile = ({name, tint = T.colors.primary}) => (
  <View style={[styles.iconTile, {backgroundColor: `${tint}18`}]}>
    <Ionicons name={name} size={18} color={tint} />
  </View>
);

const CollectionCard = ({
  title,
  subtitle,
  icon,
  packPrice,
  items,
  expanded,
  onToggle,
  onBuyPack,
  onBuyItem,
}) => (
  <View style={styles.card}>
    <View style={styles.cardMainRow}>
      <IconTile name={icon} />
      <View style={styles.cardTextCol}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        <Text style={styles.cardHint}>Or purchase individually</Text>
      </View>
      <PricePill price={packPrice} onPress={onBuyPack} />
    </View>

    {expanded ? (
      <View style={styles.itemList}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              index < items.length - 1 && styles.itemRowBorder,
            ]}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <PricePill
              price={item.price}
              compact
              onPress={() => onBuyItem(item)}
            />
          </View>
        ))}
      </View>
    ) : null}

    <TouchableOpacity
      style={styles.chevronHit}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
      accessibilityState={{expanded}}>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={T.colors.textTertiary}
      />
    </TouchableOpacity>
  </View>
);

const FeatureCard = ({title, subtitle, icon, price, onBuy, highlight}) => (
  <View style={[styles.card, highlight && styles.cardHighlight]}>
    <View style={styles.cardMainRow}>
      <IconTile name={icon} />
      <View style={styles.cardTextCol}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <PricePill price={price} onPress={onBuy} />
    </View>
  </View>
);

const InAppPurchase = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {setIsPrime} = useContext(AppContext);
  const [expandedId, setExpandedId] = useState('premium');
  const [bundlePrice, setBundlePrice] = useState('₹ 2,999');

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: {display: 'none', height: 0},
      });
      return () => {
        parent?.setOptions({
          tabBarStyle: getTabBarStyle(insets.bottom),
        });
      };
    }, [navigation, insets.bottom]),
  );

  useEffect(() => {
    let purchaseErrorSubscription;
    const initIAP = async () => {
      try {
        await initConnection();
        if (LIFETIME_IDS.length) {
          const products = await getProducts({skus: LIFETIME_IDS});
          const price = products?.[0]?.localizedPrice || products?.[0]?.price;
          if (price) {
            setBundlePrice(price);
          }
        }
      } catch (err) {
        console.warn('IAP initialization error:', err);
      }
    };

    purchaseErrorSubscription = purchaseErrorListener(error => {
      console.warn('Purchase error:', error);
    });
    initIAP();

    return () => {
      purchaseErrorSubscription?.remove?.();
      endConnection();
    };
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    try {
      const restoredPurchases = await getAvailablePurchases();
      if (restoredPurchases?.length > 0) {
        const match = restoredPurchases.find(p =>
          LIFETIME_IDS.includes(p.productId),
        );
        if (match) {
          setIsPrime(true);
          Storage.setIsPrime(true);
          Alert.alert('Restored', 'Your purchases have been restored.');
          return;
        }
      }
      Alert.alert('Restore', 'No purchases found to restore.');
    } catch (err) {
      console.log('restorePurchases Error', err);
      Alert.alert('Restore', 'Could not restore purchases. Please try again.');
    }
  }, [setIsPrime]);

  const handleLifetimePurchase = useCallback(async () => {
    const sku = LIFETIME_IDS[0];
    try {
      await requestPurchase({skus: [sku]});
      const availablePurchases = await getAvailablePurchases();
      if (Array.isArray(availablePurchases) && availablePurchases.length) {
        const pending = availablePurchases.find(
          p => p.productId === sku && p.isAcknowledgedAndroid === false,
        );
        if (pending) {
          try {
            await finishTransaction({purchase: pending, isConsumable: false});
          } catch (e) {
            // ignore ack errors
          }
        }
      }
      setIsPrime(true);
      Storage.setIsPrime(true);
      Alert.alert('Success', 'Purchase completed.');
    } catch (err) {
      console.warn('Lifetime purchase request error:', err);
    }
  }, [setIsPrime]);

  const onBuyPlaceholder = useCallback((title, price) => {
    Alert.alert(
      title,
      `Purchase ${title} for ${price}?\n\nStore product IDs can be wired when catalogs are ready.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Continue', onPress: () => handleLifetimePurchase()},
      ],
    );
  }, [handleLifetimePurchase]);

  const toggleExpand = useCallback(id => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={20} color={T.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collections</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: bottomPad + 8}]}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroTitle}>Unlock More Names</Text>
          <Text style={styles.heroSub}>
            One-time purchases. No subscriptions.
          </Text>
        </View>

        <View style={styles.shareBanner}>
          <Ionicons name="people" size={18} color="#2F9E5B" />
          <Text style={styles.shareBannerText}>
            Restore your purchases anytime from Preferences.
          </Text>
        </View>

        <CollectionCard
          title="Heritage Collection"
          subtitle="8 cultural collections"
          icon="globe-outline"
          packPrice="₹ 1,499"
          items={HERITAGE_ITEMS}
          expanded={expandedId === 'heritage'}
          onToggle={() => toggleExpand('heritage')}
          onBuyPack={() => onBuyPlaceholder('Heritage Collection', '₹ 1,499')}
          onBuyItem={item => onBuyPlaceholder(item.title, item.price)}
        />

        <CollectionCard
          title="Vibe Collection"
          subtitle="5 vibe collections"
          icon="color-wand-outline"
          packPrice="₹ 1,499"
          items={VIBE_ITEMS}
          expanded={expandedId === 'vibe'}
          onToggle={() => toggleExpand('vibe')}
          onBuyPack={() => onBuyPlaceholder('Vibe Collection', '₹ 1,499')}
          onBuyItem={item => onBuyPlaceholder(item.title, item.price)}
        />

        <CollectionCard
          title="Premium Collection"
          subtitle={`5 exceptional collections`}
          icon="diamond"
          packPrice="₹ 1,499"
          items={PREMIUM_ITEMS}
          expanded={expandedId === 'premium'}
          onToggle={() => toggleExpand('premium')}
          onBuyPack={() => onBuyPlaceholder('Premium Collection', '₹ 1,499')}
          onBuyItem={item => onBuyPlaceholder(item.title, item.price)}
        />

        {FEATURE_ITEMS.map(item => (
          <FeatureCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            price={item.price}
            onBuy={() => onBuyPlaceholder(item.title, item.price)}
          />
        ))}

        <FeatureCard
          title="Everything Bundle"
          subtitle="Everything listed above, in one go"
          icon="star"
          price={bundlePrice}
          highlight
          onBuy={handleLifetimePurchase}
        />

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestorePurchases}
          activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By purchasing you agree to our{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(TERMS_OF_USE_URL)}>
            Terms of Use
          </Text>
          {' '}and{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            Privacy Policy
          </Text>
          . Purchases are one-time and non-subscription.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...T.shadow.soft,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: T.colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  heroCard: {
    backgroundColor: T.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 12,
    overflow: 'hidden',
    ...T.shadow.soft,
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245, 215, 110, 0.35)',
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: T.colors.textPrimary,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: T.colors.textSecondary,
    maxWidth: '92%',
  },
  shareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  shareBannerText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#2C5A3D',
  },
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: 20,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 6,
    marginBottom: 12,
    ...T.shadow.soft,
  },
  cardHighlight: {
    borderWidth: 1.5,
    borderColor: T.colors.accentYellow,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
    paddingRight: 4,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: T.colors.textPrimary,
  },
  cardSubtitle: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: T.colors.textSecondary,
  },
  cardHint: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: T.colors.textTertiary,
  },
  pricePill: {
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.pill,
    paddingHorizontal: 12,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePillCompact: {
    minHeight: 30,
    paddingHorizontal: 10,
  },
  priceText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: T.colors.textOnPrimary,
  },
  priceTextCompact: {
    fontSize: 12,
  },
  chevronHit: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  itemList: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.colors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.colors.divider,
  },
  itemTitle: {
    flex: 1,
    paddingRight: 12,
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: T.colors.textPrimary,
  },
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  restoreText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: '#6B7C93',
  },
  legal: {
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: T.colors.textTertiary,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  legalLink: {
    color: T.colors.textSecondary,
    fontFamily: Fonts.semibold,
    textDecorationLine: 'underline',
  },
});

export default InAppPurchase;
