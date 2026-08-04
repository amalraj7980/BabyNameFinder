import {isVersionLower} from './versionCompare';

export function decideUpdate(
  installedVersion,
  platformConfig,
  title,
  message,
) {
  const latestAboveMinimum = isVersionLower(
    platformConfig.minimumVersion,
    platformConfig.latestVersion,
  );

  let severity = 'none';

  if (latestAboveMinimum) {
    const belowMinimum = isVersionLower(
      installedVersion,
      platformConfig.minimumVersion,
    );
    const belowLatest = isVersionLower(
      installedVersion,
      platformConfig.latestVersion,
    );

    if (belowMinimum || platformConfig.forceUpdate) {
      severity = 'force';
    } else if (belowLatest) {
      severity = 'optional';
    }
  }

  const androidUpdateType =
    severity === 'force'
      ? 'immediate'
      : platformConfig.updateType === 'immediate'
        ? 'immediate'
        : 'flexible';

  return {
    severity,
    installedVersion,
    latestVersion: platformConfig.latestVersion,
    minimumVersion: platformConfig.minimumVersion,
    title,
    message,
    androidUpdateType,
  };
}
