import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboardingDone: '@babynames/onboarding_done_v2',
  displayName: '@babynames/display_name',
  genderPrefs: '@babynames/gender_prefs',
  stylePrefs: '@babynames/style_prefs',
  partnerCode: '@babynames/partner_code',
  partnerLinked: '@babynames/partner_linked',
  inviteSent: '@babynames/invite_sent',
  cardStyle: '@babynames/card_style',
};

export async function getOnboardingDone() {
  return (await AsyncStorage.getItem(KEYS.onboardingDone)) === 'true';
}

export async function setOnboardingDone(done = true) {
  await AsyncStorage.setItem(KEYS.onboardingDone, done ? 'true' : 'false');
}

export async function getDisplayName() {
  return (await AsyncStorage.getItem(KEYS.displayName)) || '';
}

export async function setDisplayName(name) {
  await AsyncStorage.setItem(KEYS.displayName, name || '');
}

/** Mark Welcome / onboarding complete so cold start skips Welcome. */
export async function markAppEntered() {
  await setOnboardingDone(true);
  try {
    const {Storage} = require('../util');
    if (Storage?.setAppSetUpComplete) {
      await Storage.setAppSetUpComplete('true');
    }
  } catch (e) {
    await AsyncStorage.setItem('app_setup_complete', 'true');
  }
}

export async function getGenderPrefs() {
  const raw = await AsyncStorage.getItem(KEYS.genderPrefs);
  if (!raw) {
    return {boy: true, girl: true};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {boy: true, girl: true};
  }
}

export async function setGenderPrefs(prefs) {
  await AsyncStorage.setItem(KEYS.genderPrefs, JSON.stringify(prefs));
}

export async function getStylePrefs() {
  const raw = await AsyncStorage.getItem(KEYS.stylePrefs);
  if (!raw) {
    return ['classic'];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return ['classic'];
  }
}

export async function setStylePrefs(styles) {
  await AsyncStorage.setItem(KEYS.stylePrefs, JSON.stringify(styles || []));
}

export function generatePartnerCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function getOrCreatePartnerCode() {
  let code = await AsyncStorage.getItem(KEYS.partnerCode);
  if (!code) {
    code = generatePartnerCode();
    await AsyncStorage.setItem(KEYS.partnerCode, code);
  }
  return code;
}

export async function regeneratePartnerCode() {
  const code = generatePartnerCode();
  await AsyncStorage.setItem(KEYS.partnerCode, code);
  await AsyncStorage.setItem(KEYS.inviteSent, 'true');
  return code;
}

export async function setInviteSent(sent = true) {
  await AsyncStorage.setItem(KEYS.inviteSent, sent ? 'true' : 'false');
}

export async function getInviteSent() {
  return (await AsyncStorage.getItem(KEYS.inviteSent)) === 'true';
}

export async function getPartnerCode() {
  return (await AsyncStorage.getItem(KEYS.partnerCode)) || '';
}

export async function setPartnerCode(code) {
  await AsyncStorage.setItem(KEYS.partnerCode, String(code || ''));
}

export async function setPartnerLinked(linked) {
  await AsyncStorage.setItem(KEYS.partnerLinked, linked ? 'true' : 'false');
}

export async function isPartnerLinked() {
  return (await AsyncStorage.getItem(KEYS.partnerLinked)) === 'true';
}

export async function getCardStyle() {
  return (await AsyncStorage.getItem(KEYS.cardStyle)) || 'detailed';
}

export async function setCardStyle(style) {
  await AsyncStorage.setItem(KEYS.cardStyle, style || 'detailed');
}

export const OnboardingStorage = {
  KEYS,
  getOnboardingDone,
  setOnboardingDone,
  markAppEntered,
  getDisplayName,
  setDisplayName,
  getGenderPrefs,
  setGenderPrefs,
  getStylePrefs,
  setStylePrefs,
  getOrCreatePartnerCode,
  regeneratePartnerCode,
  setInviteSent,
  getInviteSent,
  getPartnerCode,
  setPartnerCode,
  setPartnerLinked,
  isPartnerLinked,
  generatePartnerCode,
  getCardStyle,
  setCardStyle,
};

export default OnboardingStorage;
