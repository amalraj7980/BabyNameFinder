import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {DesignTokens as T} from '../theme/designTokens';
import {getTabBarStyle, tabBarLabelStyle} from './tabBarStyles';

import DiscoverScreen from '../screens/discover/DiscoverScreen';
import MatchesScreen from '../screens/matches/MatchesScreen';
import PreferencesScreen from '../screens/preferences/PreferencesScreen';
import NameInformation from '../screens/home/NameInformation';
import NameFilterSearch from '../screens/search/NameFilterSearch';
import InAppPurchase from '../screens/premium/InAppPurchase';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PrivacyPolicy from '../screens/legal/PrivacyPolicy';
import TermsOfService from '../screens/legal/TermsOfService';

const Tab = createBottomTabNavigator();
const DiscoverStackNav = createStackNavigator();
const MatchesStackNav = createStackNavigator();
const PreferencesStackNav = createStackNavigator();

const stackScreenOptions = {
  headerShown: false,
};

const DiscoverStack = () => (
  <DiscoverStackNav.Navigator screenOptions={stackScreenOptions}>
    <DiscoverStackNav.Screen name="DiscoverHome" component={DiscoverScreen} />
    <DiscoverStackNav.Screen
      name="NameInformation"
      component={NameInformation}
      options={{headerShown: false}}
    />
    <DiscoverStackNav.Screen
      name="NameFilterSearch"
      component={NameFilterSearch}
      options={{headerShown: false}}
    />
    <DiscoverStackNav.Screen
      name="InAppPurchase"
      component={InAppPurchase}
      options={{headerShown: false}}
    />
  </DiscoverStackNav.Navigator>
);

const MatchesStack = () => (
  <MatchesStackNav.Navigator screenOptions={stackScreenOptions}>
    <MatchesStackNav.Screen name="MatchesHome" component={MatchesScreen} />
    <MatchesStackNav.Screen
      name="NameInformation"
      component={NameInformation}
      options={{headerShown: false}}
    />
  </MatchesStackNav.Navigator>
);

const PreferencesStack = () => (
  <PreferencesStackNav.Navigator screenOptions={stackScreenOptions}>
    <PreferencesStackNav.Screen
      name="PreferencesHome"
      component={PreferencesScreen}
    />
    <PreferencesStackNav.Screen
      name="InAppPurchase"
      component={InAppPurchase}
      options={{headerShown: false}}
    />
    <PreferencesStackNav.Screen
      name="Settings"
      component={SettingsScreen}
      options={{headerShown: true, title: 'Settings'}}
    />
    <PreferencesStackNav.Screen
      name="PrivacyPolicy"
      component={PrivacyPolicy}
      options={{headerShown: true, title: 'Privacy'}}
    />
    <PreferencesStackNav.Screen
      name="TermsOfService"
      component={TermsOfService}
      options={{headerShown: true, title: 'Terms of Use'}}
    />
  </PreferencesStackNav.Navigator>
);

const tabIcon = (routeName, focused, color, size) => {
  let iconName = 'albums-outline';
  if (routeName === 'Discover') {
    iconName = focused ? 'albums' : 'albums-outline';
  } else if (routeName === 'Matches') {
    iconName = focused ? 'heart' : 'heart-outline';
  } else if (routeName === 'Preferences') {
    iconName = focused ? 'person' : 'person-outline';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
};

const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      safeAreaInsets={{bottom: 0}}
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: T.colors.primary,
        tabBarInactiveTintColor: T.colors.tabInactive,
        tabBarHideOnKeyboard: true,
        tabBarStyle: getTabBarStyle(insets.bottom),
        tabBarLabelStyle,
        tabBarIconStyle: styles.tabIcon,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({focused, color, size}) =>
          tabIcon(route.name, focused, color, Math.min(size, 24)),
      })}>
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Matches" component={MatchesStack} />
      <Tab.Screen name="Preferences" component={PreferencesStack} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    justifyContent: 'center',
  },
  tabIcon: {
    marginTop: 2,
  },
});

export default MainTabs;
