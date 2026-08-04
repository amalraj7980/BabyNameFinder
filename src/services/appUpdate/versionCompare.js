/**
 * Semantic version compare (e.g. 1.9.10 > 1.9.2).
 */
export function compareSemver(a, b) {
  const normalize = value => {
    const core = String(value || '')
      .trim()
      .replace(/^v/i, '')
      .split(/[-+]/)[0] || '';
    return core.split('.').map(part => {
      const n = parseInt(part.replace(/[^0-9].*$/, ''), 10);
      return Number.isFinite(n) ? n : 0;
    });
  };

  const left = normalize(a);
  const right = normalize(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const x = left[i] ?? 0;
    const y = right[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

export function isVersionLower(installed, target) {
  return compareSemver(installed, target) < 0;
}
