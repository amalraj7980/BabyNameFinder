export {compareSemver, isVersionLower} from './versionCompare';
export {decideUpdate} from './decideUpdate';
export {
  isOptionalUpdateSnoozedToday,
  markOptionalUpdateSnoozedToday,
} from './optionalUpdateSnooze';
export {appUpdateStore, useAppUpdateStore} from './appUpdateStore';
export {
  fetchAppVersionConfig,
  getInstalledAppVersion,
  openAppStoreListing,
  reapplyUpdateGateOnForeground,
  recheckIosUpdateRequirement,
  runStartupAppUpdateCheck,
  startAndroidFlexibleUpdate,
  installDownloadedAndroidUpdate,
} from './AppUpdateService';
