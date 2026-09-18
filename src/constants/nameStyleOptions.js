/**
 * Shared name-style preference chips (onboarding + Preferences).
 * `premium: true` means locked until PRO / InAppPurchase.
 */
export const NAME_STYLE_OPTIONS = [
  {id: 'classic', label: 'Classic', color: '#5FAF7A'},
  {id: 'modern', label: 'Modern', color: '#5FAF7A'},
  {id: 'vintage', label: 'Vintage Revival', color: '#5FAF7A'},
  {id: 'short', label: 'Short & Sweet', color: '#5FAF7A'},
  {id: 'neutral', label: 'Gender-Neutral', color: '#5FAF7A'},
  {id: 'heritage', label: 'Heritage Collections', premium: true, color: '#5FAF7A'},
  {id: 'vibe', label: 'Vibe Collections', premium: true, color: '#5FAF7A'},
  {id: 'premium', label: 'Premium Collections', premium: true, color: '#5FAF7A'},
];

export const FREE_STYLE_IDS = NAME_STYLE_OPTIONS.filter(o => !o.premium).map(
  o => o.id,
);

export const isStyleLocked = (option, isPrime) =>
  !!option?.premium && !isPrime;
