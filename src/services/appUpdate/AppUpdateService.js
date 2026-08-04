import {Linking, Platform} from 'react-native';

import {APP_NATIVE_VERSION, IOS_APP_STORE_ID} from '../../constants/appInfo';
import {ANDROID_PACKAGE_NAME, FIRESTORE_COLLECTIONS} from '../../firebase/config';
import {
  appVersionConfigDocument,
  serverTimestamp,
} from '../../firebase/firestore';
import {decideUpdate} from './decideUpdate';
import {isOptionalUpdateSnoozedToday} from './optionalUpdateSnooze';
import {appUpdateStore} from './appUpdateStore';

const LOG_TAG = '[AppUpdate]';
const DEFAULT_TITLE = 'Update Available';
const DEFAULT_MESSAGE =
  'A new version of Baby Names Together is available. Please update to continue.';

const DEFAULT_VERSION_SEED = {
  android: {
    latestVersion: '2.2.0',
    minimumVersion: '2.0.0',
    forceUpdate: false,
    updateType: 'flexible',
  },
  ios: {
    latestVersion: '2.2.0',
    minimumVersion: '2.0.0',
    forceUpdate: false,
  },
  title: 'Update Available (Test)',
  message:
    'This is a test update prompt from Firestore. Tap Update or Later to continue.',
  lastUpdated: serverTimestamp(),
};

let cachedConfig = null;
let startupCheckPromise = null;
let inAppUpdates = null;
let androidStatusListenerAttached = false;
let seedAttempted = false;

function getInAppUpdates() {
  if (!inAppUpdates) {
    const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
    inAppUpdates = new SpInAppUpdates(__DEV__);
  }
  return inAppUpdates;
}

function asNonEmptyString(value, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function pickField(data, ...keys) {
  for (const key of keys) {
    if (
      key in data &&
      data[key] !== undefined &&
      data[key] !== null &&
      data[key] !== ''
    ) {
      return data[key];
    }
  }
  return undefined;
}

function parsePlatformConfig(raw, platform) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const updateTypeRaw = asNonEmptyString(
    pickField(data, 'updateType', `${platform}.updateType`),
    'flexible',
  ).toLowerCase();
  const updateType = updateTypeRaw === 'immediate' ? 'immediate' : 'flexible';

  return {
    latestVersion: asNonEmptyString(
      pickField(data, 'latestVersion', `${platform}.latestVersion`),
      '0.0.0',
    ),
    minimumVersion: asNonEmptyString(
      pickField(data, 'minimumVersion', `${platform}.minimumVersion`),
      '0.0.0',
    ),
    forceUpdate: Boolean(
      pickField(data, 'forceUpdate', `${platform}.forceUpdate`),
    ),
    updateType,
  };
}

function parseVersionConfig(raw) {
  return {
    android: parsePlatformConfig(raw.android, 'android'),
    ios: parsePlatformConfig(raw.ios, 'ios'),
    title: asNonEmptyString(raw.title, DEFAULT_TITLE),
    message: asNonEmptyString(raw.message, DEFAULT_MESSAGE),
  };
}

export async function getInstalledAppVersion() {
  try {
    const DeviceInfo = require('react-native-device-info');
    const version = DeviceInfo?.getVersion?.();
    const resolved = asNonEmptyString(version, '');
    if (resolved) {
      return resolved;
    }
  } catch (error) {
    console.warn(
      `${LOG_TAG} device-info unavailable, using APP_NATIVE_VERSION=${APP_NATIVE_VERSION}`,
      error,
    );
  }
  return APP_NATIVE_VERSION;
}

async function seedDefaultVersionConfigIfMissing() {
  if (seedAttempted) {
    return false;
  }
  seedAttempted = true;
  try {
    await appVersionConfigDocument().set(DEFAULT_VERSION_SEED);
    console.log(
      `${LOG_TAG} Seeded ${FIRESTORE_COLLECTIONS.appConfig}/version`,
    );
    return true;
  } catch (error) {
    console.warn(
      `${LOG_TAG} Could not create app_config/version. Publish rules or create doc in Console.`,
      error,
    );
    return false;
  }
}

export async function fetchAppVersionConfig(options = {}) {
  if (cachedConfig && !options.forceRefresh) {
    return cachedConfig;
  }

  try {
    let snapshot = await appVersionConfigDocument().get();

    if (!snapshot.exists) {
      console.warn(`${LOG_TAG} app_config/version missing — attempting seed`);
      const seeded = await seedDefaultVersionConfigIfMissing();
      if (seeded) {
        snapshot = await appVersionConfigDocument().get();
      }
    }

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();
    if (!data || typeof data !== 'object') {
      return null;
    }

    cachedConfig = parseVersionConfig(data);
    console.log(`${LOG_TAG} Loaded version config`, {
      android: cachedConfig.android,
      ios: cachedConfig.ios,
      title: cachedConfig.title,
    });
    return cachedConfig;
  } catch (error) {
    console.warn(`${LOG_TAG} Failed to fetch version config`, error);
    return null;
  }
}

function ensureAndroidFlexibleInstallListener() {
  if (androidStatusListenerAttached || Platform.OS !== 'android') {
    return;
  }
  androidStatusListenerAttached = true;
  const {IAUInstallStatus} = require('sp-react-native-in-app-updates');
  const client = getInAppUpdates();
  const onStatus = event => {
    if (event.status === IAUInstallStatus.DOWNLOADED) {
      try {
        client.installUpdate();
      } catch (error) {
        console.warn(`${LOG_TAG} installUpdate failed`, error);
      } finally {
        client.removeStatusUpdateListener(onStatus);
        androidStatusListenerAttached = false;
      }
    }
  };
  client.addStatusUpdateListener(onStatus);
}

async function startAndroidPlayUpdate(decision) {
  try {
    const {IAUUpdateKind} = require('sp-react-native-in-app-updates');
    const client = getInAppUpdates();
    const updateType =
      decision.androidUpdateType === 'immediate'
        ? IAUUpdateKind.IMMEDIATE
        : IAUUpdateKind.FLEXIBLE;

    if (updateType === IAUUpdateKind.FLEXIBLE) {
      ensureAndroidFlexibleInstallListener();
    }

    await client.startUpdate({updateType});
  } catch (error) {
    console.warn(`${LOG_TAG} Android startUpdate failed`, error);
  }
}

export async function openAppStoreListing() {
  if (Platform.OS === 'android') {
    const marketUrl = `market://details?id=${ANDROID_PACKAGE_NAME}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
    try {
      const canMarket = await Linking.canOpenURL(marketUrl);
      await Linking.openURL(canMarket ? marketUrl : webUrl);
    } catch (error) {
      console.warn(`${LOG_TAG} open Play Store failed`, error);
      try {
        await Linking.openURL(webUrl);
      } catch (fallbackError) {
        console.warn(`${LOG_TAG} Play Store web fallback failed`, fallbackError);
      }
    }
    return;
  }

  try {
    if (IOS_APP_STORE_ID) {
      const appUrl = `itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}`;
      const webUrl = `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`;
      const canOpen = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpen ? appUrl : webUrl);
      return;
    }

    const lookup = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(
        ANDROID_PACKAGE_NAME,
      )}`,
    );
    const json = await lookup.json();
    const result = json.results?.[0];
    if (result?.trackId) {
      await Linking.openURL(
        `itms-apps://apps.apple.com/app/id${result.trackId}`,
      );
      return;
    }
    if (result?.trackViewUrl) {
      await Linking.openURL(result.trackViewUrl);
    }
  } catch (error) {
    console.warn(`${LOG_TAG} open App Store failed`, error);
  }
}

export async function recheckIosUpdateRequirement() {
  const config = await fetchAppVersionConfig({forceRefresh: true});
  if (!config) {
    return null;
  }
  const installedVersion = await getInstalledAppVersion();
  const platformConfig = Platform.OS === 'ios' ? config.ios : config.android;
  return decideUpdate(
    installedVersion,
    platformConfig,
    config.title,
    config.message,
  );
}

export async function reapplyUpdateGateOnForeground() {
  const previous = appUpdateStore.getState();
  const nextDecision = await recheckIosUpdateRequirement();

  if (!nextDecision) {
    if (
      previous.phase === 'ios_required' &&
      previous.decision?.severity === 'force'
    ) {
      return;
    }
    return;
  }

  if (nextDecision.severity === 'none') {
    appUpdateStore.markDone();
    return;
  }

  if (
    nextDecision.severity === 'optional' &&
    (await isOptionalUpdateSnoozedToday())
  ) {
    appUpdateStore.markDone();
    return;
  }

  if (Platform.OS === 'android' && !__DEV__) {
    return;
  }

  appUpdateStore.requireIosUpdate(nextDecision);
}

export async function runStartupAppUpdateCheck() {
  if (startupCheckPromise) {
    return startupCheckPromise;
  }

  startupCheckPromise = (async () => {
    appUpdateStore.markChecking();

    try {
      const config = await fetchAppVersionConfig();
      if (!config) {
        appUpdateStore.markDone();
        return {status: 'continue'};
      }

      const installedVersion = await getInstalledAppVersion();
      const platformConfig =
        Platform.OS === 'ios' ? config.ios : config.android;
      const decision = decideUpdate(
        installedVersion,
        platformConfig,
        config.title,
        config.message,
      );

      if (decision.severity === 'none') {
        appUpdateStore.markDone();
        return {status: 'continue'};
      }

      if (
        decision.severity === 'optional' &&
        (await isOptionalUpdateSnoozedToday())
      ) {
        appUpdateStore.markDone();
        return {status: 'continue'};
      }

      if (Platform.OS === 'android') {
        if (__DEV__) {
          console.log(
            `${LOG_TAG} DEV: skipping Play update API, showing update screen`,
            decision,
          );
          appUpdateStore.requireIosUpdate(decision);
          return {status: 'ios_update_required', decision};
        }
        await startAndroidPlayUpdate(decision);
        appUpdateStore.markDone();
        return {status: 'continue'};
      }

      appUpdateStore.requireIosUpdate(decision);
      return {status: 'ios_update_required', decision};
    } catch (error) {
      console.warn(`${LOG_TAG} startup check failed`, error);
      appUpdateStore.markDone();
      return {status: 'continue'};
    }
  })();

  return startupCheckPromise;
}
