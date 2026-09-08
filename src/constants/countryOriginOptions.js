/**
 * Discover filter — Country / Origin chips.
 * Values match flattened `origin` strings from baby_names (mapNameDoc / upload).
 * `aliases` catch related catalog labels (e.g. Sanskrit → Indian).
 */
export const COUNTRY_ORIGIN_OPTIONS = [
  {label: 'All', value: 'all'},
  {
    label: 'North America',
    value: 'north-american',
    aliases: [
      'north-american',
      'united states',
      'united-states',
      'canada',
      'american',
    ],
    queryTags: ['north-american'],
  },
  {
    label: 'Middle East',
    value: 'middle-eastern',
    aliases: [
      'middle-eastern',
      'saudi arabia',
      'saudi-arabia',
      'iraq',
      'syria',
      'jordan',
      'lebanon',
      'yemen',
      'united arab emirates',
      'united-arab-emirates',
      'turkey',
      'egypt',
      'israel',
      'iran',
    ],
    queryTags: ['middle-eastern'],
  },
  {
    label: 'Europe',
    value: 'european',
    aliases: ['european'],
    queryTags: ['european'],
  },
  {
    label: 'Latin America',
    value: 'latin-american',
    aliases: ['latin-american'],
    queryTags: ['latin-american'],
  },
  {
    label: 'East Asia',
    value: 'east-asian',
    aliases: ['east-asian'],
    queryTags: ['east-asian'],
  },
  {
    label: 'Southeast Asia',
    value: 'southeast-asian',
    aliases: ['southeast-asian'],
    queryTags: ['southeast-asian'],
  },
  {
    label: 'India',
    value: 'india',
    aliases: ['indian', 'sanskrit', 'modern indian', 'sanskrit / indian', 'arabic / indian'],
    queryTags: ['india', 'indian', 'sanskrit'],
  },
  {
    label: 'English',
    value: 'english',
    aliases: ['english'],
    queryTags: ['english', 'united-kingdom'],
  },
  {
    label: 'Arabic',
    value: 'arabic',
    aliases: [
      'arabic',
      'arabic / indian',
      'saudi arabia',
      'saudi-arabia',
      'iraq',
      'syria',
      'jordan',
      'lebanon',
      'yemen',
      'united arab emirates',
      'united-arab-emirates',
    ],
    queryTags: [
      'arabic',
      'saudi-arabia',
      'iraq',
      'syria',
      'jordan',
      'lebanon',
      'yemen',
      'united-arab-emirates',
    ],
  },
  {
    label: 'Hebrew',
    value: 'hebrew',
    aliases: ['hebrew', 'israel'],
    queryTags: ['hebrew', 'israel'],
  },
  {
    label: 'Latin / Classic',
    value: 'latin',
    aliases: ['latin'],
    queryTags: ['latin'],
  },
  {
    label: 'Greek',
    value: 'greek',
    aliases: ['greek'],
    queryTags: ['greek', 'greece'],
  },
  {
    label: 'French',
    value: 'french',
    aliases: ['french'],
    queryTags: ['french', 'france'],
  },
  {
    label: 'Irish / Celtic',
    value: 'celtic',
    aliases: ['irish', 'celtic', 'scottish', 'welsh'],
    queryTags: ['celtic', 'irish', 'ireland', 'scottish', 'welsh'],
  },
  {
    label: 'Germanic',
    value: 'germanic',
    aliases: ['germanic', 'dutch'],
    queryTags: ['germanic', 'germany', 'netherlands', 'dutch'],
  },
  {
    label: 'Spanish / Italian',
    value: 'romance',
    aliases: ['spanish', 'italian', 'portuguese'],
    queryTags: ['spanish', 'spain', 'italian', 'italy', 'portuguese', 'portugal'],
  },
  {
    label: 'Norse / Nordic',
    value: 'nordic',
    aliases: ['norse', 'scandinavian', 'danish', 'swedish'],
    queryTags: ['norse', 'scandinavian', 'denmark', 'sweden', 'finland'],
  },
  {
    label: 'Japanese',
    value: 'japanese',
    aliases: ['japanese'],
    queryTags: ['japanese'],
  },
  {
    label: 'Korean',
    value: 'korean',
    aliases: ['korean'],
    queryTags: ['korean'],
  },
  {
    label: 'Chinese',
    value: 'chinese',
    aliases: ['chinese'],
    queryTags: ['chinese', 'hong-kong'],
  },
  {
    label: 'African',
    value: 'african',
    aliases: ['african', 'swahili', 'igbo'],
    queryTags: ['african', 'swahili', 'igbo'],
  },
  {
    label: 'Persian',
    value: 'persian',
    aliases: ['persian', 'iran'],
    queryTags: ['persian', 'iran'],
  },
  {
    label: 'Slavic',
    value: 'slavic',
    aliases: ['slavic', 'russian', 'polish'],
    queryTags: ['slavic', 'russia', 'poland', 'czechia', 'croatia'],
  },
  {
    label: 'Hawaiian',
    value: 'hawaiian',
    aliases: ['hawaiian'],
    queryTags: ['hawaiian'],
  },
  {
    label: 'Modern',
    value: 'modern',
    aliases: ['modern'],
    queryTags: ['modern'],
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

/** Tags used for an efficient Firestore origin-region query (maximum 10). */
export const resolveOriginQueryTags = selectedValues => {
  const selected = (selectedValues || []).filter(v => v && v !== 'all');
  if (!selected.length) {
    return null;
  }
  const tags = new Set();
  for (const value of selected) {
    const option = COUNTRY_ORIGIN_OPTIONS.find(o => o.value === value);
    (option?.queryTags || []).forEach(tag => tags.add(String(tag)));
  }
  return tags.size > 0 && tags.size <= 10 ? [...tags] : null;
};

export default COUNTRY_ORIGIN_OPTIONS;
