/**
 * Shared profile label used by Discover header, Matches, and Preferences.
 * Logged-in users prefer Firebase displayName; guests use local name or "Guest".
 * Logout clears the stored account name so headers show Guest.
 */
export function resolveDisplayName({
  localName,
  authDisplayName,
  isUserLoggedin,
} = {}) {
  const authName = String(authDisplayName || '').trim();
  const local = String(localName || '').trim();

  if (isUserLoggedin) {
    return authName || local || 'You';
  }

  return local || 'Guest';
}

export function emailFromSession(email) {
  const value = String(email || '').trim();
  return value || '';
}
