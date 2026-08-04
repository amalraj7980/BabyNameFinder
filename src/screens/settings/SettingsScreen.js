import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DeviceInfo from 'react-native-device-info';

import {Fonts} from '../../styles';
import {useTheme} from '../../theme';
import {rateAppFromSettings} from '../../services/rating/ratingService';
import {APP_DISPLAY_NAME, APP_VERSION} from '../../constants/appInfo';
import {AppContext} from '../../context/AppContext';

const SettingsScreen = ({navigation}) => {
  const {colors, isDark, setDarkModeEnabled} = useTheme();
  const {
    locale: {locale},
  } = useContext(AppContext);

  const versionLabel = (() => {
    try {
      return DeviceInfo.getVersion();
    } catch {
      return APP_VERSION;
    }
  })();

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <StatusBar
        barStyle={colors.statusBarStyle || 'dark-content'}
        backgroundColor={colors.headerBg || colors.primary}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.groupTitle, {color: colors.tintGray}]}>
          Preferences
        </Text>

        <View style={[styles.card, {backgroundColor: colors.card || colors.WHITE, borderColor: colors.border || colors.lightGray}]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="brightness-2" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, {color: colors.textGray}]}>
                  Dark mode
                </Text>
                <Text style={[styles.rowDesc, {color: colors.textLight}]}>
                  Switch between light and dark appearance
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDarkModeEnabled}
              trackColor={{false: colors.toggleGray, true: colors.primary}}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.groupTitle, {color: colors.tintGray}]}>
          Support
        </Text>

        <View style={[styles.card, {backgroundColor: colors.card || colors.WHITE, borderColor: colors.border || colors.lightGray}]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              void rateAppFromSettings();
            }}
            activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Icon name="star-rate" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, {color: colors.textGray}]}>
                  Rate the app
                </Text>
                <Text style={[styles.rowDesc, {color: colors.textLight}]}>
                  Share feedback on the Play Store
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={22} color={colors.tintGray} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, {color: colors.textLighter}]}>
          {APP_DISPLAY_NAME}
          {' · '}v{versionLabel}
          {locale?.settingsHint ? `\n${locale.settingsHint}` : ''}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {padding: 20, paddingBottom: 40},
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
    fontFamily: Fonts?.semibold,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLeft: {flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12},
  rowText: {marginLeft: 12, flex: 1},
  rowLabel: {fontSize: 16, fontWeight: '600', fontFamily: Fonts?.semibold},
  rowDesc: {fontSize: 12, marginTop: 2, lineHeight: 16},
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
});

export default SettingsScreen;
