/**
 * Shared name-style preference chips (onboarding + Preferences).
 * `premium: true` means locked until PRO / InAppPurchase.
 */
export const NAME_STYLE_OPTIONS = [
  {id: 'classic', label: 'Classic', color: '#98D8AA'},
  {id: 'modern', label: 'Modern'},
  {id: 'vintage', label: 'Vintage Revival'},
  {id: 'short', label: 'Short & Sweet'},
  {id: 'neutral', label: 'Gender-Neutral'},
  {id: 'heritage', label: 'Heritage Collections', premium: true},
  {id: 'vibe', label: 'Vibe Collections', premium: true},
  {id: 'premium', label: 'Premium Collections', premium: true},
];

export const FREE_STYLE_IDS = NAME_STYLE_OPTIONS.filter(o => !o.premium).map(
  o => o.id,
);

export const isStyleLocked = (option, isPrime) =>
  !!option?.premium && !isPrime;
