import Share from 'react-native-share';

import {ANDROID_PACKAGE_NAME} from '../firebase/config';
import {NAME_SHARE_PAGE_URL} from '../constants/appInfo';

/** Play Store listing — installs the app, or opens it when already installed. */
export const APP_INSTALL_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

export function getBabyNameShareUrl(name) {
  return `${NAME_SHARE_PAGE_URL}?name=${encodeURIComponent(name)}`;
}

export function buildBabyNameShareMessage(name) {
  return [
    '🌟 *A special name has been shortlisted!* 👶',
    '',
    `✨ *${name}*`,
    '',
    'Curious about the *meaning, origin & details* behind this name?',
    'Tap below to discover more! 💫',
    '',
    `🔗 ${getBabyNameShareUrl(name)}`,
    '',
    '❤️ Like the name? Share your thoughts!',
  ].join('\n');
}

export async function shareBabyName(name) {
  if (!name) {
    return;
  }
  try {
    await Share.open({
      title: 'Share via',
      message: buildBabyNameShareMessage(name),
    });
  } catch (error) {
    // user cancelled share — ignore
  }
}
