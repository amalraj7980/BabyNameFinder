/**
 * Discover filter — Country / Origin chips.
 * Values match flattened `origin` strings from baby_names (mapNameDoc / upload).
 * `aliases` catch related catalog labels (e.g. Sanskrit → Indian).
 */
export const COUNTRY_ORIGIN_OPTIONS = [
  {label: 'All', value: 'all'},
  {
    label: 'India',
    value: 'india',
    aliases: ['indian', 'sanskrit', 'modern indian', 'sanskrit / indian', 'arabic / indian'],
  },
  {
    label: 'English',
    value: 'english',
    aliases: ['english'],
  },
  {
    label: 'Arabic',
    value: 'arabic',
    aliases: ['arabic', 'arabic / indian'],
  },
  {
    label: 'Hebrew',
    value: 'hebrew',
    aliases: ['hebrew'],
  },
  {
    label: 'Latin / Classic',
    value: 'latin',
    aliases: ['latin'],
  },
  {
    label: 'Greek',
    value: 'greek',
    aliases: ['greek'],
  },
  {
    label: 'French',
    value: 'french',
    aliases: ['french'],
  },
  {
    label: 'Irish / Celtic',
    value: 'celtic',
    aliases: ['irish', 'celtic', 'scottish', 'welsh'],
  },
  {
    label: 'Germanic',
    value: 'germanic',
    aliases: ['germanic', 'dutch'],
  },
  {
    label: 'Spanish / Italian',
    value: 'romance',
    aliases: ['spanish', 'italian', 'portuguese'],
  },
  {
    label: 'Norse / Nordic',
    value: 'nordic',
    aliases: ['norse', 'scandinavian', 'danish', 'swedish'],
  },
  {
    label: 'Japanese',
    value: 'japanese',
    aliases: ['japanese'],
  },
  {
    label: 'Korean',
    value: 'korean',
    aliases: ['korean'],
  },
  {
    label: 'Chinese',
    value: 'chinese',
    aliases: ['chinese'],
  },
  {
    label: 'African',
    value: 'african',
    aliases: ['african', 'swahili', 'igbo'],
  },
  {
    label: 'Persian',
    value: 'persian',
    aliases: ['persian'],
  },
  {
    label: 'Slavic',
    value: 'slavic',
    aliases: ['slavic', 'russian', 'polish'],
  },
  {
    label: 'Hawaiian',
    value: 'hawaiian',
    aliases: ['hawaiian'],
  },
  {
    label: 'Modern',
    value: 'modern',
    aliases: ['modern'],
  },
];

/** Build a Set of lowercase origin labels that match selected chip values. */
export const resolveOriginMatchSet = selectedValues => {
  const selected = (selectedValues || []).filter(v => v && v !== 'all');
  if (!selected.length) {
    return null;
  }
  const match = new Set();
  for (const value of selected) {
    const opt = COUNTRY_ORIGIN_OPTIONS.find(o => o.value === value);
    if (!opt) {
      match.add(String(value).toLowerCase());
      continue;
    }
    match.add(opt.value);
    (opt.aliases || []).forEach(a => match.add(String(a).toLowerCase()));
  }
  return match;
};

export default COUNTRY_ORIGIN_OPTIONS;
